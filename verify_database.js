/**
 * Quick database verification
 */
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: 'medarion_platform'
};

async function verify() {
  console.log('🔍 Verifying Medarion Platform Setup\n');
  
  const connection = await mysql.createConnection(dbConfig);
  console.log('✅ Database connected\n');
  
  // Check tables
  console.log('📊 Database Tables:');
  const [tables] = await connection.execute('SHOW TABLES');
  console.log(`   Total: ${tables.length} tables`);
  tables.forEach(row => {
    const tableName = Object.values(row)[0];
    console.log(`   - ${tableName}`);
  });
  
  // Check data
  console.log('\n📦 Data Summary:');
  const dataTables = ['users', 'companies', 'investors', 'deals', 'grants', 'public_stocks'];
  for (const table of dataTables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table.padEnd(20)}: ${rows[0].count} records`);
    } catch (e) {
      console.log(`   ${table.padEnd(20)}: Error`);
    }
  }
  
  // Check demo accounts
  console.log('\n👥 Demo Accounts:');
  const [demoUsers] = await connection.execute(
    "SELECT email, user_type, account_tier FROM users WHERE email LIKE '%@demo.com' OR email LIKE '%@medarion.com' ORDER BY account_tier, user_type"
  );
  demoUsers.forEach(user => {
    console.log(`   ${user.email.padEnd(30)} | ${user.user_type.padEnd(25)} | ${user.account_tier}`);
  });
  
  // Check users table schema
  console.log('\n🔑 Users Table - New Fields:');
  const [columns] = await connection.execute('DESCRIBE users');
  const newFields = ['account_tier', 'user_type', 'app_roles', 'dashboard_modules', 'module_order', 'ai_quota_used'];
  newFields.forEach(field => {
    const found = columns.find(col => col.Field === field);
    console.log(`   ${field.padEnd(20)}: ${found ? '✅ Present' : '❌ Missing'}`);
  });
  
  await connection.end();
  console.log('\n✅ Verification complete!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Start backend: cd server && npm run dev');
  console.log('   2. Start frontend: npm run dev');
  console.log('   3. Open: http://localhost:5173/auth');
  console.log('   4. Login with any demo account (see DEMO_ACCOUNTS_LIST.md)');
}

verify().catch(console.error);

























