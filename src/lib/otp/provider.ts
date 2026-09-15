import crypto from 'crypto';
import { getJwtSecret } from '../auth';

export interface OTPProviderResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface IOTPProvider {
  name: string;
  sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult>;
}

/**
 * Normalizes Indian mobile number to E.164 (+91XXXXXXXXXX) and extracts 10 digits
 */
export function normalizeIndianMobile(rawPhone: string): {
  isValid: boolean;
  normalized: string; // e.g. +919876543210
  national10: string; // e.g. 9876543210
  countryDigits: string; // e.g. 919876543210
} {
  const digits = rawPhone.replace(/\D/g, '');

  let national10 = '';

  if (digits.length === 10) {
    national10 = digits;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national10 = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    national10 = digits.slice(2);
  } else if (digits.length > 10) {
    national10 = digits.slice(-10);
  }

  // Validate Indian 10-digit mobile number starting with 6, 7, 8, or 9
  const isValid = /^[6-9]\d{9}$/.test(national10);

  return {
    isValid,
    normalized: isValid ? `+91${national10}` : rawPhone.trim(),
    national10: isValid ? national10 : digits,
    countryDigits: isValid ? `91${national10}` : digits,
  };
}

/**
 * Robust phone number normalizer for backwards compatibility
 */
export function formatPhoneNumber(rawPhone: string): {
  e164: string;
  national10: string;
  countryWithDigits: string;
} {
  const normalized = normalizeIndianMobile(rawPhone);
  return {
    e164: normalized.normalized,
    national10: normalized.national10,
    countryWithDigits: normalized.countryDigits,
  };
}

/**
 * Meta WhatsApp Cloud API Provider (Official Meta Graph API)
 */
export class MetaWhatsAppOTPProvider implements IOTPProvider {
  name = 'meta_whatsapp';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    const accessToken =
      process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
    const templateLang =
      process.env.WHATSAPP_TEMPLATE_LANG ||
      process.env.WHATSAPP_TEMPLATE_LANGUAGE ||
      'en_US';
    const buttonSubType = process.env.WHATSAPP_TEMPLATE_BUTTON_TYPE || 'url';

    if (!accessToken || !phoneNumberId) {
      return {
        success: false,
        error:
          'Meta WhatsApp Cloud API credentials not configured. Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in .env.local.',
      };
    }

    try {
      const { countryDigits } = normalizeIndianMobile(identifier);
      const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      };

      if (templateName) {
        const buildPayload = (includeButton: boolean) => {
          const components: any[] = [
            {
              type: 'body',
              parameters: [{ type: 'text', text: otp }],
            },
          ];

          if (includeButton && buttonSubType !== 'none') {
            components.push({
              type: 'button',
              sub_type: buttonSubType,
              index: '0',
              parameters: [{ type: 'text', text: otp }],
            });
          }

          return {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: countryDigits,
            type: 'template',
            template: {
              name: templateName,
              language: { code: templateLang },
              components,
            },
          };
        };

        // Try sending with button first if button is enabled
        const withButton = buttonSubType !== 'none';
        let res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPayload(withButton)),
        });

        // If template doesn't have a button component, Meta returns error #100; auto-retry with body only
        if (!res.ok && withButton) {
          const cloneErr = await res.clone().json().catch(() => ({}));
          const errMsg = cloneErr?.error?.message || '';
          if (
            errMsg.includes('components') ||
            errMsg.includes('button') ||
            cloneErr?.error?.code === 100
          ) {
            res = await fetch(endpoint, {
              method: 'POST',
              headers,
              body: JSON.stringify(buildPayload(false)),
            });
          }
        }

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const fbError = errJson?.error;
          console.error('[META WHATSAPP ERROR]', fbError?.message || fbError);

          let userMsg = 'Failed to dispatch WhatsApp OTP.';
          if (fbError?.code === 190) {
            userMsg =
              'WhatsApp access token has expired or is invalid. Please refresh WHATSAPP_ACCESS_TOKEN in .env.local.';
          } else if (fbError?.code === 132000) {
            userMsg = `Template "${templateName}" does not exist in your WhatsApp Business Account.`;
          } else if (fbError?.code === 132001) {
            userMsg = `Template "${templateName}" does not exist for language "${templateLang}". Check WHATSAPP_TEMPLATE_LANG.`;
          } else if (fbError?.code === 131030) {
            userMsg =
              'Recipient phone number is not in your allowed test recipients list in the Meta App Dashboard.';
          } else if (fbError?.message) {
            userMsg = fbError.message;
          }

          return {
            success: false,
            error: userMsg,
          };
        }

        return {
          success: true,
          message: 'OTP sent to your WhatsApp.',
        };
      } else {
        // Direct session message (Note: Meta requires 24h active window for direct session messages)
        const bodyPayload = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: countryDigits,
          type: 'text',
          text: {
            preview_url: false,
            body: `Your ZYORA verification code is ${otp}. Valid for 5 minutes. Please do not share this code with anyone.`,
          },
        };

        const res = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(bodyPayload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const fbError = errJson?.error;
          console.error('[META WHATSAPP ERROR]', fbError?.message || fbError);

          let userMsg = 'Failed to dispatch WhatsApp OTP.';
          if (fbError?.code === 131047) {
            userMsg =
              'Meta WhatsApp requires an approved Message Template for user authentication. Please set WHATSAPP_TEMPLATE_NAME in .env.local.';
          } else if (fbError?.message) {
            userMsg = fbError.message;
          }

          return {
            success: false,
            error: userMsg,
          };
        }

        return {
          success: true,
          message: 'OTP sent to your WhatsApp.',
        };
      }
    } catch (err: any) {
      console.error('[META WHATSAPP EXCEPTION]', err?.message);
      return {
        success: false,
        error: 'WhatsApp gateway error. Please try again shortly.',
      };
    }
  }
}

/**
 * Twilio WhatsApp API Provider
 */
export class TwilioWhatsAppOTPProvider implements IOTPProvider {
  name = 'twilio_whatsapp';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromWhatsApp =
      process.env.TWILIO_WHATSAPP_FROM ||
      process.env.TWILIO_WHATSAPP_NUMBER ||
      '+14155238886'; // Twilio Sandbox default

    if (!accountSid || !authToken) {
      return {
        success: false,
        error:
          'Twilio WhatsApp credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.',
      };
    }

    try {
      const { normalized } = normalizeIndianMobile(identifier);
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const formattedFrom = fromWhatsApp.startsWith('whatsapp:')
        ? fromWhatsApp
        : `whatsapp:${fromWhatsApp}`;
      const formattedTo = `whatsapp:${normalized}`;

      const params = new URLSearchParams({
        To: formattedTo,
        From: formattedFrom,
        Body: `Your ZYORA verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
      });

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          '[TWILIO WHATSAPP ERROR]',
          errorData?.message || errorData?.code || 'Delivery failed'
        );
        return {
          success: false,
          error:
            errorData?.message ||
            'Failed to dispatch WhatsApp OTP via Twilio. Please verify phone number.',
        };
      }

      return {
        success: true,
        message: 'OTP sent to your WhatsApp.',
      };
    } catch (err: any) {
      console.error('[TWILIO WHATSAPP EXCEPTION]', err?.message);
      return {
        success: false,
        error: 'WhatsApp gateway error. Please try again shortly.',
      };
    }
  }
}

/**
 * MSG91 WhatsApp Provider
 */
export class MSG91WhatsAppOTPProvider implements IOTPProvider {
  name = 'msg91_whatsapp';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER;
    const templateName = process.env.MSG91_WHATSAPP_TEMPLATE_NAME;

    if (!authKey || !integratedNumber || !templateName) {
      return {
        success: false,
        error:
          'MSG91 WhatsApp credentials not configured. Please set MSG91_AUTH_KEY, MSG91_WHATSAPP_INTEGRATED_NUMBER, and MSG91_WHATSAPP_TEMPLATE_NAME.',
      };
    }

    try {
      const { countryDigits } = normalizeIndianMobile(identifier);
      const endpoint =
        'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
        },
        body: JSON.stringify({
          integrated_number: integratedNumber,
          content_type: 'template',
          payload: {
            to: countryDigits,
            type: 'template',
            template: {
              name: templateName,
              language: { code: 'en', policy: 'deterministic' },
              components: [
                {
                  type: 'body',
                  parameters: [{ type: 'text', text: otp }],
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: '0',
                  parameters: [{ type: 'text', text: otp }],
                },
              ],
            },
          },
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.status === 'error') {
        console.error('[MSG91 WHATSAPP ERROR]', data?.message || 'Delivery failure');
        return {
          success: false,
          error: data?.message || 'MSG91 WhatsApp delivery failed.',
        };
      }

      return {
        success: true,
        message: 'OTP sent to your WhatsApp.',
      };
    } catch (err: any) {
      console.error('[MSG91 WHATSAPP EXCEPTION]', err?.message);
      return {
        success: false,
        error: 'MSG91 WhatsApp gateway error. Please try again.',
      };
    }
  }
}

/**
 * Unified WhatsApp OTP Provider (Auto-detects active WhatsApp service)
 */
export class WhatsAppOTPProvider implements IOTPProvider {
  name = 'whatsapp';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    // 1. Check Meta WhatsApp Cloud API
    if (
      (process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_API_TOKEN) &&
      process.env.WHATSAPP_PHONE_NUMBER_ID
    ) {
      return new MetaWhatsAppOTPProvider().sendOTP(identifier, otp, type);
    }

    // 2. Check Twilio WhatsApp API
    if (
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_WHATSAPP_FROM ||
        process.env.TWILIO_WHATSAPP_NUMBER ||
        process.env.OTP_PROVIDER === 'whatsapp_twilio' ||
        process.env.OTP_PROVIDER === 'twilio')
    ) {
      return new TwilioWhatsAppOTPProvider().sendOTP(identifier, otp, type);
    }

    // 3. Check MSG91 WhatsApp API
    if (
      process.env.MSG91_AUTH_KEY &&
      process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER
    ) {
      return new MSG91WhatsAppOTPProvider().sendOTP(identifier, otp, type);
    }

    // 4. Unconfigured Provider State (Production-ready error)
    return {
      success: false,
      error:
        'WhatsApp OTP service is not configured. Please configure your WhatsApp API credentials (Meta WhatsApp Cloud API or Twilio WhatsApp) in .env.local.',
    };
  }
}

/**
 * Twilio SMS Provider (Fallback / SMS channel)
 */
export class TwilioOTPProvider implements IOTPProvider {
  name = 'twilio';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone =
      process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM_PHONE;
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

    if (!accountSid || !authToken || (!fromPhone && !messagingServiceSid)) {
      return {
        success: false,
        error:
          'Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in environment variables.',
      };
    }

    try {
      const { normalized } = normalizeIndianMobile(identifier);
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const params = new URLSearchParams({
        To: normalized,
        Body: `Your ZYORA verification code is ${otp}. Valid for 5 minutes. Do not share this code with anyone.`,
      });

      if (messagingServiceSid) {
        params.append('MessagingServiceSid', messagingServiceSid);
      } else if (fromPhone) {
        params.append('From', fromPhone);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization:
            'Basic ' +
            Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error(
          '[TWILIO ERROR]',
          errorData?.message || errorData?.code || 'Twilio delivery failure'
        );
        return {
          success: false,
          error:
            errorData?.message ||
            'Failed to dispatch SMS via Twilio. Please verify destination number.',
        };
      }

      return {
        success: true,
        message: `Verification code sent via SMS to ${normalized}.`,
      };
    } catch (err: any) {
      console.error('[TWILIO EXCEPTION]', err?.message);
      return {
        success: false,
        error: 'Twilio SMS service error. Please try again shortly.',
      };
    }
  }
}

/**
 * Fast2SMS Provider (Instant Indian SMS Gateway)
 */
export class Fast2SMSOTPProvider implements IOTPProvider {
  name = 'fast2sms';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    const apiKey = process.env.FAST2SMS_API_KEY;

    if (!apiKey) {
      return {
        success: false,
        error:
          'Fast2SMS API key is not configured. Please set FAST2SMS_API_KEY in environment variables.',
      };
    }

    try {
      const { national10 } = normalizeIndianMobile(identifier);
      const endpoint = 'https://www.fast2sms.com/dev/bulkV2';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          authorization: apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables_values: otp,
          route: 'otp',
          numbers: national10,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.return === false) {
        console.error(
          '[FAST2SMS ERROR]',
          data?.message || 'Fast2SMS delivery failure'
        );
        return {
          success: false,
          error: Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || 'Fast2SMS delivery failure.',
        };
      }

      return {
        success: true,
        message: `Verification code sent via SMS to ${national10}.`,
      };
    } catch (err: any) {
      console.error('[FAST2SMS EXCEPTION]', err?.message);
      return {
        success: false,
        error: 'Fast2SMS gateway error. Please try again shortly.',
      };
    }
  }
}

/**
 * Resend Email Provider (Transactional Email OTP)
 */
export class ResendOTPProvider implements IOTPProvider {
  name = 'resend';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
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

      return {
        success: true,
        message: `Verification code sent to ${identifier}`,
      };
    } catch (err: any) {
      console.error('Resend OTP exception:', err?.message);
      return { success: false, error: 'Email service error' };
    }
  }
}

/**
 * Mock Provider (Safe local test provider ONLY)
 */
export class MockOTPProvider implements IOTPProvider {
  name = 'mock';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.ALLOW_MOCK_OTP !== 'true'
    ) {
      return {
        success: false,
        error:
          'Mock OTP provider is forbidden in production environment. A real WhatsApp or SMS provider must be configured.',
      };
    }

    return {
      success: true,
      message: 'OTP sent to your WhatsApp.',
    };
  }
}

/**
 * Fallback provider when no WhatsApp / SMS service credentials have been configured
 */
export class UnconfiguredOTPProvider implements IOTPProvider {
  name = 'unconfigured';

  async sendOTP(
    identifier: string,
    otp: string,
    type: 'phone' | 'email' | 'whatsapp'
  ): Promise<OTPProviderResult> {
    return {
      success: false,
      error:
        'WhatsApp OTP service is not configured. Please configure your WhatsApp API credentials (Meta WhatsApp Cloud API or Twilio WhatsApp) in environment variables.',
    };
  }
}

/**
 * Factory to retrieve the configured OTP provider with smart auto-detection
 */
export function getOTPProvider(
  channel: 'phone' | 'email' | 'whatsapp' = 'whatsapp'
): IOTPProvider {
  const providerType = (process.env.OTP_PROVIDER || '').trim().toLowerCase();

  // If WhatsApp channel is requested or configured
  if (
    channel === 'whatsapp' ||
    providerType === 'whatsapp' ||
    providerType === 'meta_whatsapp' ||
    providerType === 'twilio_whatsapp'
  ) {
    if (providerType === 'meta_whatsapp') return new MetaWhatsAppOTPProvider();
    if (providerType === 'twilio_whatsapp') return new TwilioWhatsAppOTPProvider();
    if (providerType === 'msg91_whatsapp') return new MSG91WhatsAppOTPProvider();
    return new WhatsAppOTPProvider();
  }

  if (providerType === 'twilio') {
    return new TwilioOTPProvider();
  }
  if (providerType === 'fast2sms') {
    return new Fast2SMSOTPProvider();
  }
  if (providerType === 'resend' || channel === 'email') {
    return new ResendOTPProvider();
  }
  if (
    providerType === 'mock' &&
    (process.env.NODE_ENV !== 'production' ||
      process.env.ALLOW_MOCK_OTP === 'true')
  ) {
    return new MockOTPProvider();
  }

  // Auto-detect based on environment variables
  if (
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  ) {
    return new MetaWhatsAppOTPProvider();
  }
  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    (process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_WHATSAPP_NUMBER)
  ) {
    return new TwilioWhatsAppOTPProvider();
  }
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    return new TwilioOTPProvider();
  }
  if (process.env.FAST2SMS_API_KEY) {
    return new Fast2SMSOTPProvider();
  }
  if (process.env.RESEND_API_KEY) {
    return new ResendOTPProvider();
  }

  // Fall back to Mock ONLY if explicitly enabled in local development
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.ALLOW_MOCK_OTP === 'true'
  ) {
    return new MockOTPProvider();
  }

  return new WhatsAppOTPProvider();
}

/**
 * Securely hashes an OTP with server secret and identifier salt using HMAC-SHA256
 */
export function hashOTP(otp: string, identifier: string): string {
  const secret = getJwtSecret();
  return crypto
    .createHmac('sha256', secret)
    .update(`${otp}:${identifier}`)
    .digest('hex');
}
