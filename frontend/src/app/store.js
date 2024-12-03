import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/users/userSlice';
import landReducer from '../features/lands/landSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    lands: landReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 