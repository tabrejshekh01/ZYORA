import crypto from 'crypto';
import { prisma } from '../prisma';
import { getOTPProvider, hashOTP, normalizeIndianMobile } from './provider';

const RESEND_COOLDOWN_SECONDS = 30;
const OTP_EXPIRY_MINUTES = 5;
const MAX_VERIFY_ATTEMPTS = 5;

export interface SendOTPResult {
  success: boolean;
  message: string;
  cooldownSeconds?: number;
}

export interface VerifyOTPResult {
  success: boolean;
  message: string;
  identifier?: string;
  isNewUser?: boolean;
  userId?: string;
}

/**
 * Normalizes identifier (email or Indian mobile phone)
 */
export function normalizeIdentifier(input: string): {
  identifier: string;
  type: 'email' | 'phone';
  isValid: boolean;
  national10?: string;
} {
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return {
      identifier: trimmed.toLowerCase(),
      type: 'email',
      isValid: emailRegex.test(trimmed),
    };
  }

  // Treat as Indian mobile phone
  const norm = normalizeIndianMobile(trimmed);
  return {
    identifier: norm.normalized,
    type: 'phone',
    isValid: norm.isValid,
    national10: norm.national10,
  };
}

/**
 * Sends a secure 6-digit WhatsApp OTP to the specified mobile phone number (or email)
 */
export async function sendOTP(rawIdentifier: string): Promise<SendOTPResult> {
  const { identifier, type, isValid } = normalizeIdentifier(rawIdentifier);

  if (!isValid) {
    if (type === 'email') {
      return { success: false, message: 'Please provide a valid email address.' };
    }
    return {
      success: false,
      message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.',
    };
  }

  const now = new Date();

  // 1. Check Resend Cooldown (30 seconds)
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
    const waitTime = Math.max(1, RESEND_COOLDOWN_SECONDS - elapsedSeconds);
    return {
      success: false,
      message: `Please wait ${waitTime}s before requesting a new OTP.`,
      cooldownSeconds: waitTime,
    };
  }

  // 2. Invalidate any previous active OTPs for this identifier
  await prisma.oTPVerification.updateMany({
    where: {
      identifier,
      verified: false,
    },
    data: {
      verified: true,
    },
  });

  // 3. Generate Cryptographically Secure 6-digit OTP
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const otpHash = hashOTP(rawOtp, identifier);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // 4. Store Hash in PostgreSQL (No plaintext OTP in database)
  await prisma.oTPVerification.create({
    data: {
      identifier,
      phone: type === 'phone' ? identifier : null,
      channel: type === 'phone' ? 'whatsapp' : 'email',
      otpHash,
      expiresAt,
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      attempts: 0,
      verified: false,
    },
  });

  // 5. Dispatch OTP via WhatsApp / Provider
  const provider = getOTPProvider(type === 'phone' ? 'whatsapp' : 'email');
  const dispatchResult = await provider.sendOTP(
    identifier,
    rawOtp,
    type === 'phone' ? 'whatsapp' : 'email'
  );

  if (!dispatchResult.success) {
    return {
      success: false,
      message: dispatchResult.error || 'Failed to dispatch WhatsApp OTP. Please try again.',
    };
  }

  return {
    success: true,
    message: dispatchResult.message || 'OTP sent to your WhatsApp.',
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
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
  const { identifier, type, isValid, national10 } = normalizeIdentifier(rawIdentifier);

  if (!isValid) {
    return {
      success: false,
      message:
        type === 'email'
          ? 'Please enter a valid email address.'
          : 'Please enter a valid 10-digit mobile number.',
    };
  }

  const cleanOtp = rawOtp.trim();

  if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
    return { success: false, message: 'Invalid OTP. Please enter the 6-digit code.' };
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
    return {
      success: false,
      message: 'Invalid OTP. Please try again.',
    };
  }

  // 2. Check Expiration (5 minutes)
  if (now > record.expiresAt) {
    return {
      success: false,
      message: 'This OTP has expired. Please request a new one.',
    };
  }

  // 3. Check Attempt Lockout (max 5 attempts)
  if (record.attempts >= record.maxAttempts) {
    return {
      success: false,
      message: 'Too many attempts. Please request a new OTP later.',
    };
  }

  // 4. Verify Hash with Timing-Safe Comparison
  const expectedHash = hashOTP(cleanOtp, identifier);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(expectedHash),
    Buffer.from(record.otpHash)
  );

  if (!isMatch) {
    // Increment failed attempts
    const updated = await prisma.oTPVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });

    const remaining = record.maxAttempts - updated.attempts;
    if (remaining <= 0) {
      return {
        success: false,
        message: 'Too many attempts. Please request a new OTP later.',
      };
    }

    return {
      success: false,
      message: `Invalid OTP. Please try again. (${remaining} attempt${remaining > 1 ? 's' : ''} left)`,
    };
  }

  // 5. Mark OTP as verified and record timestamp
  await prisma.oTPVerification.update({
    where: { id: record.id },
    data: {
      verified: true,
      usedAt: new Date(),
    },
  });

  // 6. User Lookup or Provisioning
  let user: any = null;

  if (type === 'phone' && national10) {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: identifier },
          { phone: national10 },
          { phone: `+91 ${national10.slice(0, 5)} ${national10.slice(5)}` },
          { phone: `+91${national10}` },
          { email: `${national10}@phone.zyora.internal` },
          { email: `${identifier}@phone.zyora.internal` },
        ],
      },
      include: { store: true },
    });
  } else {
    user = await prisma.user.findFirst({
      where: { email: identifier },
      include: { store: true },
    });
  }

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const randomPassword = crypto.randomBytes(24).toString('hex');

    if (type === 'phone' && national10) {
      user = await prisma.user.create({
        data: {
          name: `Client ${national10.slice(-4)}`,
          email: `${national10}@phone.zyora.internal`,
          phone: identifier,
          password: randomPassword,
          role: optionalRole,
        },
        include: { store: true },
      });
    } else {
      const defaultName = identifier.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ');
      user = await prisma.user.create({
        data: {
          name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
          email: identifier,
          phone: null,
          password: randomPassword,
          role: optionalRole,
        },
        include: { store: true },
      });
    }
  }

  return {
    success: true,
    message: 'Verification successful.',
    identifier,
    isNewUser,
    userId: user.id,
  };
}
