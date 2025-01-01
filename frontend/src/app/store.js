import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import userReducer from '../features/users/userSlice';
import landReducer from '../features/lands/landSlice';
import reportReducer from '../features/reports/reportSlice';
import settingsReducer from '../features/settings/settingsSlice';
import purchaseReducer from '../features/purchases/purchaseSlice';
import currencyReducer from '../features/currencies/currencySlice';
import employeeGroupReducer from '../features/employeeGroups/employeeGroupSlice';
import designationReducer from '../features/designations/designationSlice';
import employeeReducer from '../features/employees/employeeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    lands: landReducer,
    reports: reportReducer,
    settings: settingsReducer,
    purchase: purchaseReducer,
    currencies: currencyReducer,
    employeeGroups: employeeGroupReducer,
    designations: designationReducer,
    employees: employeeReducer,
  },
});