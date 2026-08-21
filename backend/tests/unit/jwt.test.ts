import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from '../../src/utils/jwt';

describe('access tokens', () => {
  it('round-trips the payload through sign and verify', () => {
    const token = signAccessToken({ sub: 'user123', role: 'customer' });
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('user123');
    expect(payload.role).toBe('customer');
  });

  it('throws when verifying a garbage token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow();
  });

  it('throws when verifying a refresh token as if it were an access token (different secret)', () => {
    const refreshToken = signRefreshToken({ sub: 'user123' });
    expect(() => verifyAccessToken(refreshToken)).toThrow();
  });
});

describe('refresh tokens', () => {
  it('round-trips the payload through sign and verify', () => {
    const token = signRefreshToken({ sub: 'user456' });
    const payload = verifyRefreshToken(token);
    expect(payload.sub).toBe('user456');
  });
});
