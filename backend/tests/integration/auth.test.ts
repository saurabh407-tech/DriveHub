import request from 'supertest';
import { createApp } from '../../src/app';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../helpers/db';
import { User } from '../../src/models/User.model';

const app = createApp();

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

describe('POST /api/v1/auth/register', () => {
  it('creates an unverified user and sends an OTP', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      password: 'password123',
      role: 'customer',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe('jordan@example.com');
    expect(res.body.data.user.isEmailVerified).toBe(false);

    const stored = await User.findOne({ email: 'jordan@example.com' }).select('+otpHash');
    expect(stored?.otpHash).toBeTruthy();
  });

  it('rejects a duplicate email with 409', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Jordan Lee',
      email: 'dupe@example.com',
      password: 'password123',
    });

    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Someone Else',
      email: 'dupe@example.com',
      password: 'password456',
    });

    expect(res.status).toBe(409);
  });

  it('rejects a weak password with a 400 validation error', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Jordan Lee',
      email: 'weak@example.com',
      password: 'short',
    });

    expect(res.status).toBe(400);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('never returns the password hash in the response', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
      name: 'Jordan Lee',
      email: 'safe@example.com',
      password: 'password123',
    });
    expect(res.body.data.user.password).toBeUndefined();
  });
});

describe('login flow', () => {
  async function registerAndVerify(email: string) {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Test User',
      email,
      password: 'password123',
    });
    const user = await User.findOne({ email }).select('+otpHash');
    // The OTP is hashed at rest; simulate verification by marking the
    // account verified directly, the same end-state /verify-otp reaches.
    user!.isEmailVerified = true;
    user!.otpHash = undefined;
    await user!.save();
  }

  it('rejects login with the wrong password', async () => {
    await registerAndVerify('login1@example.com');
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login1@example.com', password: 'wrong-password' });
    expect(res.status).toBe(401);
  });

  it('logs in successfully with correct credentials and sets a refresh cookie', async () => {
    await registerAndVerify('login2@example.com');
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login2@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects login for a non-existent account without revealing that distinction', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });
});

describe('role-based access control on /api/v1/users', () => {
  it('rejects unauthenticated access to the admin user list', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('rejects a non-admin authenticated user from the admin user list', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Regular Customer',
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
    });
    const user = await User.findOne({ email: 'customer@example.com' });
    user!.isEmailVerified = true;
    await user!.save();

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'customer@example.com', password: 'password123' });
    const token = loginRes.body.data.accessToken;

    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
