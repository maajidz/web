// This is a simple entry file for Vercel
console.log('Starting Flattr API server...');

// Load the built application from dist/main.js
try {
  require('./dist/main');
  console.log('Server loaded successfully!');
} catch (error) {
  console.error('Failed to load server:', error);
  process.exit(1);
} 