import dotenv from 'dotenv';
dotenv.config();

console.log('Testing server configuration...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);

try {
  // Try to import server.js
  const server = await import('./server.js');
  console.log('✅ Server module loaded successfully');
  console.log('Server exports:', Object.keys(server));
  process.exit(0);
} catch (e) {
  console.error('❌ Server import failed:', e.message);
  console.error('Stack:', e.stack);
  process.exit(1);
}

