import mysql from 'mysql2/promise';
const config = {
  host: 'localhost',
  user: 'medasnnc_medarion',
  password: 'Neorage94',
  database: 'medasnnc_medarion',
  port: 3306
};
try {
  const conn = await mysql.createConnection(config);
  await conn.query('SELECT 1');
  await conn.end();
  console.log('✅ Database connection OK');
  process.exit(0);
} catch (e) {
  console.error('❌ DB Error:', e.message);
  process.exit(1);
}
