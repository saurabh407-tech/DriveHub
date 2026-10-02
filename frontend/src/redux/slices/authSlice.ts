import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import * as authApi from '@/services/authApi';
import { setAccessToken } from '@/services/api';
import { disconnectSocket } from '@/services/socket';
import type { AuthUser } from '@/services/authApi';

interface AuthState {
  user: AuthUser | null;
  status: 'idle' | 'loading' | 'authenticated' | 'error';
  bootstrapped: boolean; // whether we've attempted session restore on app load
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
  bootstrapped: false,
  error: null,
};

function extractErrorMessage(err: unknown): string {
  const anyErr = err as {
    response?: {
      data?: {
        message?: string;
        errors?: Record<string, string> | Array<{ msg?: string }>;
      };
    };
    message?: string;
  };

  const responseData = anyErr?.response?.data;
  if (responseData) {
    if (responseData.errors && typeof responseData.errors === 'object') {
      const firstVal = Object.values(responseData.errors)[0];
      if (typeof firstVal === 'string') return firstVal;
      if (typeof firstVal === 'object' && (firstVal as any)?.msg) return (firstVal as any).msg;
    }
    if (responseData.message) {
      return responseData.message;
    }
  }

  if (anyErr?.message) {
    return anyErr.message;
  }

  return 'Something went wrong. Please try again.';
}

export const registerUser = createAsyncThunk(
  'auth/register',
  async (payload: Parameters<typeof authApi.registerRequest>[0], { rejectWithValue }) => {
    try {
      return await authApi.registerRequest(payload);
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (payload: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.verifyOtpRequest(payload);
      if (res.data.accessToken) {
        setAccessToken(res.data.accessToken);
      }
      return res;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await authApi.loginRequest(payload);
      setAccessToken(res.data.accessToken);
      return res;
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logoutRequest();
  } finally {
    setAccessToken(null);
    disconnectSocket();
  }
});

/** Attempts to restore a session on app load using the httpOnly refresh cookie. */
export const bootstrapSession = createAsyncThunk('auth/bootstrap', async (_: void, { rejectWithValue }) => {
  try {
    const res = await authApi.getMeRequest();
    return res.data.user;
  } catch (err) {
    return rejectWithValue(extractErrorMessage(err));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.status = 'idle';
      })
      .addCase(registerUser.rejected, (state, action: PayloadAction<unknown>) => {
        state.status = 'error';
        state.error = action.payload as string;
      })

      .addCase(verifyOtp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.data.user;
        state.bootstrapped = true;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action: PayloadAction<unknown>) => {
        state.status = 'error';
        state.error = action.payload as string;
      })

      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'authenticated';
        state.user = action.payload.data.user;
        state.bootstrapped = true;
      })
      .addCase(loginUser.rejected, (state, action: PayloadAction<unknown>) => {
        state.status = 'error';
        state.error = action.payload as string;
      })

      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.status = 'idle';
      })

      .addCase(bootstrapSession.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.status = 'authenticated';
        state.bootstrapped = true;
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.user = null;
        state.status = 'idle';
        state.bootstrapped = true;
      });
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
