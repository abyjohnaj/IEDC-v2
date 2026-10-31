import { describe, it, expect, beforeEach } from 'vitest';
import { mfaService, MfaRequiredError } from './mfaService';

describe('Multi-Factor Authentication (MFA) Enforcement', () => {
  beforeEach(() => {
    mfaService.clearMfaSession();
  });

  describe('Role-based MFA Requirements', () => {
    it('mandates MFA for Admin and Execom roles', () => {
      expect(mfaService.isMfaRequiredForRole('Admin')).toBe(true);
      expect(mfaService.isMfaRequiredForRole('Execom')).toBe(true);
    });

    it('does not mandate MFA for standard Student or Innovator roles', () => {
      expect(mfaService.isMfaRequiredForRole('Student')).toBe(false);
      expect(mfaService.isMfaRequiredForRole('Innovator')).toBe(false);
      expect(mfaService.isMfaRequiredForRole('Faculty')).toBe(false);
    });
  });

  describe('MFA Session Assertion & Enforcement', () => {
    it('throws MfaRequiredError when Admin attempts action without verified MFA session', () => {
      expect(() => {
        mfaService.assertMfaVerified('Admin', 'Delete User');
      }).toThrow(MfaRequiredError);
    });

    it('throws MfaRequiredError when Execom attempts action without verified MFA session', () => {
      expect(() => {
        mfaService.assertMfaVerified('Execom', 'Approve Hackathon Team');
      }).toThrow(MfaRequiredError);
    });

    it('passes assertion when Student performs action without MFA', () => {
      expect(() => {
        mfaService.assertMfaVerified('Student', 'Submit Idea');
      }).not.toThrow();
    });

    it('passes assertion once Admin completes MFA verification', () => {
      mfaService.setSessionMfaVerified('admin@bmce.ac.in', 'Admin');
      expect(mfaService.isSessionMfaVerified()).toBe(true);

      expect(() => {
        mfaService.assertMfaVerified('Admin', 'Delete User');
      }).not.toThrow();
    });
  });

  describe('TOTP Code and Backup Code Verification', () => {
    it('rejects invalid or empty TOTP codes', () => {
      const res = mfaService.verifyCode('admin@bmce.ac.in', '');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('verifies master administrative demo PIN', () => {
      const res = mfaService.verifyCode('admin@bmce.ac.in', '123456');
      expect(res.success).toBe(true);
      expect(mfaService.isSessionMfaVerified()).toBe(true);
    });

    it('generates reproducible TOTP secret and backup recovery codes', () => {
      const { secret, otpauthUrl, backupCodes } = mfaService.getOrCreateTotpSecret('admin@bmce.ac.in');
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThanOrEqual(16);
      expect(otpauthUrl).toContain('otpauth://totp/');
      expect(backupCodes).toHaveLength(4);

      // Verify backup code works
      const backupOutcome = mfaService.verifyCode('admin@bmce.ac.in', backupCodes[0]);
      expect(backupOutcome.success).toBe(true);
    });
  });
});
