import { generateOtp, generateUrlToken, hashValue, compareHash } from '../../src/utils/tokens';

describe('generateOtp', () => {
  it('always returns a 6-digit numeric string', () => {
    for (let i = 0; i < 20; i++) {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    }
  });

  it('produces varied values across calls', () => {
    const values = new Set(Array.from({ length: 20 }, () => generateOtp()));
    expect(values.size).toBeGreaterThan(1);
  });
});

describe('generateUrlToken', () => {
  it('returns a 64-character hex string', () => {
    const token = generateUrlToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is different on every call', () => {
    expect(generateUrlToken()).not.toBe(generateUrlToken());
  });
});

describe('hashValue / compareHash', () => {
  it('produces a hash that compareHash can verify against the original value', async () => {
    const hash = await hashValue('super-secret-otp');
    await expect(compareHash('super-secret-otp', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect value', async () => {
    const hash = await hashValue('correct-value');
    await expect(compareHash('wrong-value', hash)).resolves.toBe(false);
  });

  it('rejects when no hash is provided (e.g. no OTP was ever requested)', async () => {
    await expect(compareHash('anything', undefined)).resolves.toBe(false);
  });
});
