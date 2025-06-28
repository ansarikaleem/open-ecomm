const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
// console.log('Environment variables:', process.env);

require('dotenv').config();
// console.log('JWT_SECRET exists?', !!process.env.JWT_SECRET);
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 3000;

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});