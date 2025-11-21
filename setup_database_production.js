import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'medasnnc_medarion',
  password: process.env.DB_PASSWORD || 'Neorage94',
  database: process.env.DB_NAME || 'medasnnc_medarion',
  charset: 'utf8mb4',
  multipleStatements: true
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    console.log('Config:', { ...dbConfig, password: '***' });
    
    // First connect without database to create it if needed
    const serverConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      charset: dbConfig.charset
    });
    
    await serverConnection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await serverConnection.end();
    console.log('✅ Database created/verified');
    
    // Now connect to the database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read and execute the comprehensive schema
    console.log('📖 Reading database schema...');
    const sqlFile = fs.readFileSync(path.join(process.cwd(), 'comprehensive_database_schema.sql'), 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sqlFile
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.toLowerCase().startsWith('create database'));
    
    console.log(`🏗️  Executing ${statements.length} SQL statements...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement.length > 10) {
        try {
          await connection.execute(statement);
          successCount++;
          if ((i + 1) % 10 === 0) {
            console.log(`   Progress: ${i + 1}/${statements.length} statements executed...`);
          }
        } catch (error) {
          // Ignore "table already exists" errors
          if (!error.message.includes('already exists') && !error.message.includes('Duplicate')) {
            console.warn(`⚠️  Warning on statement ${i + 1}: ${error.message.substring(0, 60)}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      }
    }
    
    console.log(`✅ Database setup completed!`);
    console.log(`   Success: ${successCount}, Warnings: ${errorCount}`);
    
    // Verify tables were created
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Tables created: ${tables.length}`);
    if (tables.length > 0) {
      console.log('   Tables:', tables.map(t => Object.values(t)[0]).join(', '));
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

