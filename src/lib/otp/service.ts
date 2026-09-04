import crypto from 'crypto';
import { prisma } from '../prisma';
import { getOTPProvider, hashOTP } from './provider';

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export interface SendOTPResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  devCode?: string; // only populated in development mock mode
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  identifier?: string;
  isNewUser?: boolean;
  userId?: string;
}

/**
 * Normalizes identifier (email or phone)
 */
export function normalizeIdentifier(input: string): { identifier: string; type: 'email' | 'phone' } {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return { identifier: trimmed.toLowerCase(), type: 'email' };
  }
  // Strip non-numeric characters for phone
  const cleanPhone = trimmed.replace(/\s+/g, '').replace(/[-()]/g, '');
  return { identifier: cleanPhone, type: 'phone' };
}

/**
 * Sends a secure 6-digit OTP to the specified identifier
 */
export async function sendOTP(rawIdentifier: string): Promise<SendOTPResult> {
  const { identifier, type } = normalizeIdentifier(rawIdentifier);

  if (type === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }
  } else {
    // Phone validation (at least 10 digits)
    const phoneDigits = identifier.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return { success: false, message: 'Please provide a valid 10-digit mobile number.' };
    }
  }

  const now = new Date();

  // 1. Check Resend Cooldown
  const recentOTP = await prisma.oTPVerification.findFirst({
    where: {
      identifier,
      createdAt: {
        gte: new Date(now.getTime() - RESEND_COOLDOWN_SECONDS * 1000),
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentOTP) {
    const elapsedSeconds = Math.floor((now.getTime() - recentOTP.createdAt.getTime()) / 1000);
    const waitTime = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
    return {
      success: false,
      message: `Please wait ${waitTime} seconds before requesting a new code.`,
      cooldownSeconds: waitTime,
    };
  }

  // 2. Invalidate any existing active OTPs for this identifier
  await prisma.oTPVerification.updateMany({
    where: {
      identifier,
      verified: false,
    },
    data: {
      verified: true, // effectively invalidates
    },
  });

  // 3. Generate Cryptographically Secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = hashOTP(rawOtp, identifier);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 4. Store Hash in PostgreSQL
  await prisma.oTPVerification.create({
    data: {
      identifier,
      otpHash,
      expiresAt,
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      attempts: 0,
      verified: false,
    },
  });

  // 5. Dispatch OTP via Provider
  const provider = getOTPProvider();
  const dispatchResult = await provider.sendOTP(identifier, rawOtp, type);

  if (!dispatchResult.success) {
    return {
      success: false,
      message: dispatchResult.error || 'Failed to dispatch verification code. Please try again.',
    };
  }

  const isDev = (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_OTP === 'true') && provider.name === 'mock';

  return {
    success: true,
    message: `Verification code sent to ${identifier}.`,
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    devCode: isDev ? rawOtp : undefined,
  };
}

/**
 * Verifies the 6-digit OTP and authenticates/provisions the user
 */
export async function verifyOTP(
  rawIdentifier: string,
  rawOtp: string,
  optionalRole: 'CUSTOMER' | 'SELLER' = 'CUSTOMER'
): Promise<VerifyOTPResult> {
  const { identifier } = normalizeIdentifier(rawIdentifier);
  const cleanOtp = rawOtp.trim();

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, message: 'Please enter a valid 6-digit verification code.' };
  }

  const now = new Date();

  // 1. Fetch latest pending OTP record
  const record = await prisma.oTPVerification.findFirst({
    where: {
      identifier,
      verified: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    return { success: false, message: 'Invalid or expired verification code. Please request a new one.' };
  }

  // 2. Check Expiration
  if (now > record.expiresAt) {
    return { success: false, message: 'Verification code has expired. Please request a new one.' };
  }

  // 3. Check Attempt Lockout
  if (record.attempts >= record.maxAttempts) {
    return { success: false, message: 'Maximum verification attempts exceeded. Please request a new code.' };
  }

  // 4. Verify Hash
  const expectedHash = hashOTP(cleanOtp, identifier);
  const isMatch = crypto.timingSafeEqual(Buffer.from(expectedHash), Buffer.from(record.otpHash));

  if (!isMatch) {
    // Increment attempts
    const updated = await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    const remaining = record.maxAttempts - updated.attempts;
    if (remaining <= 0) {
      return { success: false, message: 'Too many incorrect attempts. This code has been invalidated.' };
    }

    return {
      success: false,
      message: `Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`,
    };
  }

  // 5. Invalidate OTP Immediately
  await prisma.oTPVerification.update({
    where: { id: record.id },
    data: { verified: true },
  });

  // 6. User Lookup or Provisioning
  let user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
    },
    include: { store: true },
  });

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const randomPassword = crypto.randomBytes(24).toString('hex');
    const isEmail = identifier.includes('@');

    const defaultName = isEmail
      ? identifier.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ')
      : `Client ${identifier.slice(-4)}`;

    user = await prisma.user.create({
      data: {
        name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
        email: isEmail ? identifier : `${identifier}@phone.zyora.internal`,
        phone: isEmail ? null : identifier,
        password: randomPassword, // Nonce password (auth via OTP or reset)
        role: optionalRole,
      },
      include: { store: true },
    });
  }

  return {
    success: true,
    message: 'Verification successful.',
    identifier,
    isNewUser,
    userId: user.id,
  };
}

