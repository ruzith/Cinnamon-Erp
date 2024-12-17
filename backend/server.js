const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB } = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const userRoutes = require('./routes/userRoutes')
const settingsRoutes = require('./routes/settingsRoutes');
const Report = require('./models/Report');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(async () => {
  try {
    await Report.initializeTemplates();
    console.log('Report templates initialized');
  } catch (error) {
    console.error('Error initializing report templates:', error);
  }
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/lands', require('./routes/landRoutes'));
app.use('/api/users', userRoutes);
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/designations', require('./routes/designationRoutes'));
app.use('/api/manufacturing', require('./routes/manufacturingRoutes'));
app.use('/api/cutting', require('./routes/cuttingRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/accounting', require('./routes/accountingRoutes'));
app.use('/api/loans', require('./routes/loanRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/manufacturing-orders', require('./routes/manufacturingOrderRoutes'));
app.use('/api/customers', require('./routes/customerRoutes'));
app.use('/api/settings', settingsRoutes);

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  process.exit(1);
}); 