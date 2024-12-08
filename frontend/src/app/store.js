import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/users/userSlice';
import landReducer from '../features/lands/landSlice';
import reportReducer from '../features/reports/reportSlice';
import settingsReducer from '../features/settings/settingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    lands: landReducer,
    reports: reportReducer,
    settings: settingsReducer,
  },
}); 