const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const app = require('./app');
const Report = require('./models/domain/Report');

// Load environment variables
dotenv.config();

// Initialize server
const PORT = process.env.PORT || 5001;
let server;

// Database and Server initialization
const initializeServer = async () => {
  try {
    // Connect to database
    await connectDB();
    
    // Initialize report templates
    await Report.initializeTemplates();
    console.log('Report templates initialized');

    // Start server
    server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.log('Unhandled Rejection:', err.message);
      // Gracefully close server & exit process
      shutdownServer();
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.log('Uncaught Exception:', err.message);
      // Gracefully close server & exit process
      shutdownServer();
    });

  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
};

// Graceful shutdown function
const shutdownServer = () => {
  console.log('Shutting down server...');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

// Initialize the server
initializeServer(); 