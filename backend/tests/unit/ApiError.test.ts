import { ApiError } from '../../src/utils/ApiError';

describe('ApiError factory methods', () => {
  it('badRequest sets status 400 and preserves the errors payload', () => {
    const err = ApiError.badRequest('Invalid input', { email: 'Required' });
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Invalid input');
    expect(err.errors).toEqual({ email: 'Required' });
    expect(err.isOperational).toBe(true);
  });

  it('unauthorized defaults to a sensible message and status 401', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('forbidden sets status 403', () => {
    expect(ApiError.forbidden('No access').statusCode).toBe(403);
  });

  it('notFound sets status 404', () => {
    expect(ApiError.notFound().statusCode).toBe(404);
  });

  it('conflict sets status 409', () => {
    expect(ApiError.conflict('Already exists').statusCode).toBe(409);
  });

  it('tooMany sets status 429', () => {
    expect(ApiError.tooMany().statusCode).toBe(429);
  });

  it('internal sets status 500 and marks the error as non-operational', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('is a real Error instance, so it works with instanceof checks in error handlers', () => {
    const err = ApiError.badRequest();
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
  });
});
