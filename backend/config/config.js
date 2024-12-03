const config = {
  development: {
    mongoOptions: {
      // Add any specific development options here
    }
  },
  production: {
    mongoOptions: {
      // Add any specific production options here
    }
  },
  test: {
    mongoOptions: {
      // Add any specific test options here
    }
  }
};

module.exports = config[process.env.NODE_ENV || 'development']; 