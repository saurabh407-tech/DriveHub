import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { loginUser, logoutUser, registerUser, clearAuthError } from './authSlice';

vi.mock('@/services/authApi', () => ({
  loginRequest: vi.fn(),
  logoutRequest: vi.fn(),
  registerRequest: vi.fn(),
  getMeRequest: vi.fn(),
}));

vi.mock('@/services/api', () => ({
  setAccessToken: vi.fn(),
}));

vi.mock('@/services/socket', () => ({
  disconnectSocket: vi.fn(),
}));

import * as authApi from '@/services/authApi';

function buildStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

const mockUser = {
  _id: 'user1',
  name: 'Jordan Lee',
  email: 'jordan@example.com',
  role: 'customer' as const,
  isEmailVerified: true,
  wallet: { balance: 0, currency: 'INR' },
  createdAt: new Date().toISOString(),
};

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no user and idle status', () => {
    const store = buildStore();
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.status).toBe('idle');
  });

  it('sets the user and authenticated status on successful login', async () => {
    vi.mocked(authApi.loginRequest).mockResolvedValue({
      success: true,
      message: 'Logged in',
      data: { user: mockUser, accessToken: 'fake-token' },
    });

    const store = buildStore();
    await store.dispatch(loginUser({ email: mockUser.email, password: 'password123' }));

    const state = store.getState().auth;
    expect(state.status).toBe('authenticated');
    expect(state.user?.email).toBe(mockUser.email);
  });

  it('sets an error message and error status on failed login', async () => {
    vi.mocked(authApi.loginRequest).mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });

    const store = buildStore();
    await store.dispatch(loginUser({ email: 'wrong@example.com', password: 'bad' }));

    const state = store.getState().auth;
    expect(state.status).toBe('error');
    expect(state.error).toBe('Invalid email or password');
    expect(state.user).toBeNull();
  });

  it('clears the user on logout', async () => {
    vi.mocked(authApi.loginRequest).mockResolvedValue({
      success: true,
      message: 'Logged in',
      data: { user: mockUser, accessToken: 'fake-token' },
    });
    vi.mocked(authApi.logoutRequest).mockResolvedValue({ success: true, message: 'Logged out' });

    const store = buildStore();
    await store.dispatch(loginUser({ email: mockUser.email, password: 'password123' }));
    expect(store.getState().auth.user).not.toBeNull();

    await store.dispatch(logoutUser());
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.status).toBe('idle');
  });

  it('clearAuthError resets the error field without touching the user', async () => {
    vi.mocked(authApi.registerRequest).mockRejectedValue({
      response: { data: { message: 'Email already exists' } },
    });

    const store = buildStore();
    await store.dispatch(
      registerUser({ name: 'Jordan', email: 'dup@example.com', password: 'password123', role: 'customer' })
    );
    expect(store.getState().auth.error).toBe('Email already exists');

    store.dispatch(clearAuthError());
    expect(store.getState().auth.error).toBeNull();
  });
});
