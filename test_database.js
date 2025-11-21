import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'medasnnc_medarion',
  password: process.env.DB_PASSWORD || 'Neorage94',
  database: process.env.DB_NAME || 'medasnnc_medarion',
  port: parseInt(process.env.DB_PORT || '3306')
};

try {
  console.log('Testing database connection...');
  console.log('Config:', { ...config, password: '***' });
  
  const conn = await mysql.createConnection(config);
  const [rows] = await conn.query('SELECT 1 as test, DATABASE() as db');
  await conn.end();
  
  console.log('✅ Database connection OK');
  console.log('Test result:', rows[0]);
  process.exit(0);
} catch (e) {
  console.error('❌ Database connection failed:', e.message);
  process.exit(1);
}

