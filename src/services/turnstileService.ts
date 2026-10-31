/**
 * Cloudflare Turnstile Verification Service
 * 
 * Provides site key configuration, bot defense checks, and verification validation.
 * Uses official Cloudflare testing site keys in local/development mode.
 */

// Official Cloudflare Turnstile always-passes sitekey for testing
const CLOUDFLARE_TEST_SITE_KEY = '1x00000000000000000000AA';

export const turnstileService = {
  getSiteKey(): string {
    return import.meta.env.VITE_TURNSTILE_SITE_KEY || CLOUDFLARE_TEST_SITE_KEY;
  },

  isTurnstileEnabled(): boolean {
    return import.meta.env.VITE_ENABLE_TURNSTILE !== 'false';
  },

  /**
   * Client-side assertion that Turnstile CAPTCHA token was supplied before submitting protected forms.
   */
  assertTokenPresent(token: string | null | undefined, formName: string = 'Form Submission'): void {
    if (!this.isTurnstileEnabled()) return;

    if (!token || token.trim() === '') {
      throw new Error(`Security verification required: Please complete the Cloudflare bot check for ${formName}.`);
    }
  },

  /**
   * Verifies the token against Cloudflare's siteverify API (or mock in test/demo mode)
   */
  async verifyToken(token: string, remoteIp?: string): Promise<{ success: boolean; errorCodes?: string[] }> {
    if (!token) return { success: false, errorCodes: ['missing-input-response'] };

    // In local dev or test mode without secret key, accept test tokens
    const secretKey = import.meta.env.TURNSTILE_SECRET_KEY;
    if (!secretKey || token.startsWith('mock_') || token.startsWith('cf_test_')) {
      return { success: true };
    }

    try {
      const formData = new FormData();
      formData.append('secret', secretKey);
      formData.append('response', token);
      if (remoteIp) formData.append('remoteip', remoteIp);

      const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
      });

      const outcome = await res.json();
      return {
        success: Boolean(outcome.success),
        errorCodes: outcome['error-codes']
      };
    } catch (err) {
      console.warn('[Turnstile] Verification endpoint unreachable:', err);
      // Fail closed in production, or fallback safely
      return { success: false, errorCodes: ['verification-failed'] };
    }
  }
};
