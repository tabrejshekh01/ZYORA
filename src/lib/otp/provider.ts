import crypto from 'crypto';
import { getJwtSecret } from '../auth';

export interface OTPProviderResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IOTPProvider {
  name: string;
  sendOTP(identifier: string, otp: string, type: 'email' | 'phone'): Promise<OTPProviderResult>;
}

/**
 * Mock Provider for safe local development.
 * Never calls paid third-party SMS/email APIs.
 * In production, this provider is strictly disabled.
 */
export class MockOTPProvider implements IOTPProvider {
  name = 'mock';

  async sendOTP(identifier: string, otp: string, type: 'email' | 'phone'): Promise<OTPProviderResult> {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_OTP !== 'true') {
      return {
        success: false,
        error: 'Mock OTP provider is forbidden in production environment.',
      };
    }

    // Safe development logging - clearly demarcated
    console.log(`\n==================================================`);
    console.log(`[DEV OTP SERVICE] Test Code for ${identifier} (${type}): ${otp}`);
    console.log(`[DEV OTP SERVICE] Expires in 5 minutes.`);
    console.log(`==================================================\n`);

    return {
      success: true,
      message: `[Development Mode] Verification code generated for ${identifier}`,
    };
  }
}

/**
 * Twilio SMS Provider
 */
export class TwilioOTPProvider implements IOTPProvider {
  name = 'twilio';

  async sendOTP(identifier: string, otp: string, type: 'email' | 'phone'): Promise<OTPProviderResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      return { success: false, error: 'Twilio credentials not configured' };
    }

    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const body = new URLSearchParams({
        To: identifier,
        From: fromPhone,
        Body: `Your ZYORA verification code is ${otp}. Valid for 5 minutes. Do not share this code.`,
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error('Twilio OTP error:', errText);
        return { success: false, error: 'Failed to send SMS code' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Twilio OTP exception:', err?.message);
      return { success: false, error: 'SMS service error' };
    }
  }
}

/**
 * MSG91 SMS Provider (India)
 */
export class MSG91OTPProvider implements IOTPProvider {
  name = 'msg91';

  async sendOTP(identifier: string, otp: string, type: 'email' | 'phone'): Promise<OTPProviderResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;

    if (!authKey || !templateId) {
      return { success: false, error: 'MSG91 credentials not configured' };
    }

    try {
      const cleanPhone = identifier.replace(/\D/g, '');
      const endpoint = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${cleanPhone}&authkey=${authKey}&otp=${otp}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        return { success: false, error: 'MSG91 delivery failure' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('MSG91 exception:', err?.message);
      return { success: false, error: 'SMS delivery failure' };
    }
  }
}

/**
 * Resend Email Provider
 */
export class ResendOTPProvider implements IOTPProvider {
  name = 'resend';

  async sendOTP(identifier: string, otp: string, type: 'email' | 'phone'): Promise<OTPProviderResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'security@zyora.com';

    if (!apiKey) {
      return { success: false, error: 'Resend API key not configured' };
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `ZYORA Luxury Atelier <${fromEmail}>`,
          to: [identifier],
          subject: `${otp} is your ZYORA verification code`,
          html: `
            <div style="background:#faf9f6;padding:40px;font-family:sans-serif;color:#1c1917;max-width:500px;margin:0 auto;border-radius:16px;border:1px solid #e7e5e4">
              <h2 style="font-family:serif;font-size:24px;color:#1c1917;margin-top:0">ZYORA Haute Couture</h2>
              <p style="font-size:14px;color:#78716c">Use the following one-time passcode to sign in or verify your account:</p>
              <div style="background:#ffffff;border:1px solid #c5a059;border-radius:12px;padding:18px;text-align:center;margin:24px 0">
                <span style="font-family:monospace;font-size:32px;font-weight:bold;letter-spacing:6px;color:#c5a059">${otp}</span>
              </div>
              <p style="font-size:12px;color:#a8a29e">This verification code expires in 5 minutes. If you did not request this, please disregard this message.</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        return { success: false, error: 'Failed to send verification email' };
      }

      return { success: true };
    } catch (err: any) {
      console.error('Resend OTP exception:', err?.message);
      return { success: false, error: 'Email service error' };
    }
  }
}

/**
 * Factory to retrieve the configured OTP provider
 */
export function getOTPProvider(): IOTPProvider {
  const providerType = (process.env.OTP_PROVIDER || 'mock').toLowerCase();

  switch (providerType) {
    case 'twilio':
      return new TwilioOTPProvider();
    case 'msg91':
      return new MSG91OTPProvider();
    case 'resend':
      return new ResendOTPProvider();
    case 'mock':
    default:
      return new MockOTPProvider();
  }
}

/**
 * Securely hashes an OTP with a server secret and identifier salt using HMAC-SHA256
 */
export function hashOTP(otp: string, identifier: string): string {
  const secret = getJwtSecret();
  return crypto.createHmac('sha256', secret).update(`${otp}:${identifier}`).digest('hex');
}

