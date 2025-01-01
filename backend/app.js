const express = require('express');
const cors = require('cors');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

// Import routes
const userRoutes = require('./routes/userRoutes');
const landRoutes = require('./routes/landRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const employeeGroupRoutes = require('./routes/employeeGroupRoutes');
const designationRoutes = require('./routes/designationRoutes');
const manufacturingRoutes = require('./routes/manufacturingRoutes');
const cuttingRoutes = require('./routes/cuttingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const salesRoutes = require('./routes/salesRoutes');
const assetRoutes = require('./routes/assetRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const loanRoutes = require('./routes/loanRoutes');
const reportRoutes = require('./routes/reportRoutes');
const taskRoutes = require('./routes/taskRoutes');
const taskCategoryRoutes = require('./routes/taskCategoryRoutes');
const manufacturingOrderRoutes = require('./routes/manufacturingOrderRoutes');
const customerRoutes = require('./routes/customerRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const productRoutes = require('./routes/productRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
const API_PREFIX = '/api';
app.use(`${API_PREFIX}/lands`, landRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/employee-groups`, employeeGroupRoutes);
app.use(`${API_PREFIX}/designations`, designationRoutes);
app.use(`${API_PREFIX}/manufacturing`, manufacturingRoutes);
app.use(`${API_PREFIX}/cutting`, cuttingRoutes);
app.use(`${API_PREFIX}/inventory`, inventoryRoutes);
app.use(`${API_PREFIX}/sales`, salesRoutes);
app.use(`${API_PREFIX}/assets`, assetRoutes);
app.use(`${API_PREFIX}/accounting`, accountingRoutes);
app.use(`${API_PREFIX}/loans`, loanRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);
app.use(`${API_PREFIX}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/task-categories`, taskCategoryRoutes);
app.use(`${API_PREFIX}/manufacturing-orders`, manufacturingOrderRoutes);
app.use(`${API_PREFIX}/customers`, customerRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/purchases`, purchaseRoutes);
app.use(`${API_PREFIX}/currencies`, currencyRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;