const express = require('express');
const cors = require('cors');
const payrollRoutes = require('./routes/payrollRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/payroll', payrollRoutes);

// Error handling middleware should be last
app.use(notFound);
app.use(errorHandler);

module.exports = app; 