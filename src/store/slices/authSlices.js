import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/auth'

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      return await authService.login(username, password)
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      return await authService.register(userData)
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: authService.getCurrentUser(),
    role: authService.getCurrentRole(),
    isAuthenticated: authService.isAuthenticated(),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      authService.logout()
      state.user = null
      state.role = null
      state.isAuthenticated = false
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.role = action.payload.role
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.role = action.payload.role
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout } = authSlice.actions
export default authSlice.reducer