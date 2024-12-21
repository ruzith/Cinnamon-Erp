const express = require('express');
const cors = require('cors');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import routes
const payrollRoutes = require('./routes/payrollRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/payroll', payrollRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/currencies', currencyRoutes);

// Error handling middleware should be last
app.use(notFound);
app.use(errorHandler);

module.exports = app; 