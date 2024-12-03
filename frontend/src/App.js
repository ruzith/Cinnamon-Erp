import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import LandManagement from './pages/LandManagement';
import UserManagement from './pages/UserManagement';
import EmployeeManagement from './pages/EmployeeManagement';
import TaskManagement from './pages/TaskManagement';
import CuttingManagement from './pages/CuttingManagement';
import Manufacturing from './pages/Manufacturing';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import AssetManagement from './pages/AssetManagement';
import Accounting from './pages/Accounting';
import LoanBook from './pages/LoanBook';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateRoute from './components/common/PrivateRoute';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from './theme';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  const toggleDarkMode = () => {
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  return (
    <ThemeProvider theme={getTheme(darkMode)}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/*" element={
          <PrivateRoute>
            <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lands/*" element={<LandManagement />} />
                <Route path="/users/*" element={<UserManagement />} />
                <Route path="/employees/*" element={<EmployeeManagement />} />
                <Route path="/tasks/*" element={<TaskManagement />} />
                <Route path="/cutting/*" element={<CuttingManagement />} />
                <Route path="/manufacturing/*" element={<Manufacturing />} />
                <Route path="/inventory/*" element={<Inventory />} />
                <Route path="/sales/*" element={<Sales />} />
                <Route path="/assets/*" element={<AssetManagement />} />
                <Route path="/accounting/*" element={<Accounting />} />
                <Route path="/loans/*" element={<LoanBook />} />
                <Route path="/reports/*" element={<Reports />} />
                <Route path="/settings/*" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        } />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
