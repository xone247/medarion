import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Default XAMPP MySQL password is empty
  database: 'medarion_platform', // Connect directly to the database
  charset: 'utf8mb4'
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔌 Connecting to MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL successfully');

    // Read and execute the SQL file
    console.log('📖 Reading database schema...');
    const sqlFile = fs.readFileSync(path.join(process.cwd(), 'create_database.sql'), 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sqlFile
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log('🏗️  Creating database and tables...');
    
    // Execute each statement separately
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (error) {
          console.warn(`⚠️  Warning executing statement: ${statement.substring(0, 50)}...`);
          console.warn(`   Error: ${error.message}`);
        }
      }
    }
    
    console.log('✅ Database setup completed successfully!');
    console.log('📊 Database: medarion_platform');
    console.log('🔗 You can now start the application with: npm start');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. XAMPP is running');
    console.log('   2. MySQL service is started');
    console.log('   3. MySQL is accessible on localhost:3306');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
