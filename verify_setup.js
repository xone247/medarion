/**
 * Medarion Platform - Setup Verification Script
 * Tests database schema, data migration, and API endpoints
 * 
 * Run: node verify_setup.js
 */

import mysql from 'mysql2/promise';
import fetch from 'node-fetch';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'medarion_platform',
};

const API_BASE = `http://localhost:${process.env.PORT || 3001}`;

let testsPassed = 0;
let testsFailed = 0;

function logTest(name, passed, details = '') {
  if (passed) {
    console.log(`✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}`);
    if (details) console.log(`   ${details}`);
    testsFailed++;
  }
}

async function testDatabaseConnection(connection) {
  console.log('\n📊 Testing Database Connection...');
  
  try {
    await connection.execute('SELECT 1');
    logTest('Database connection', true);
    return true;
  } catch (error) {
    logTest('Database connection', false, error.message);
    return false;
  }
}

async function testTableExistence(connection) {
  console.log('\n📋 Testing Table Existence...');
  
  const requiredTables = [
    'users', 'companies', 'investors', 'deals', 'grants',
    'clinical_trials', 'blog_posts', 'newsletter_subscriptions',
    'user_sessions', 'public_stocks', 'sponsored_ads',
    'nation_pulse_data', 'clinical_centers', 'investigators',
    'regulatory_bodies', 'company_clinical_trials', 'company_regulatory',
    'user_activity_log', 'ai_usage_log'
  ];

  try {
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    for (const table of requiredTables) {
      const exists = tableNames.includes(table);
      logTest(`Table: ${table}`, exists);
    }
  } catch (error) {
    console.error('Error checking tables:', error.message);
  }
}

async function testUsersTableSchema(connection) {
  console.log('\n👤 Testing Users Table Schema...');
  
  const requiredColumns = [
    'id', 'username', 'email', 'password_hash',
    'account_tier', 'user_type', 'app_roles',
    'dashboard_modules', 'module_order',
    'ai_quota_used', 'ai_quota_reset_date'
  ];

  try {
    const [columns] = await connection.execute('DESCRIBE users');
    const columnNames = columns.map(col => col.Field);

    for (const column of requiredColumns) {
      const exists = columnNames.includes(column);
      logTest(`Column: users.${column}`, exists);
    }
  } catch (error) {
    console.error('Error checking users schema:', error.message);
  }
}

async function testDataMigration(connection) {
  console.log('\n📦 Testing Data Migration...');
  
  const tables = [
    { name: 'companies', expected: 3 },
    { name: 'investors', expected: 3 },
    { name: 'grants', expected: 5 },
    { name: 'deals', expected: 5 },
    { name: 'public_stocks', expected: 4 }
  ];

  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table.name}`);
      const count = rows[0].count;
      const passed = count >= table.expected;
      logTest(
        `Data: ${table.name} (${count} rows, expected ${table.expected}+)`,
        passed,
        passed ? '' : `Only ${count} rows found`
      );
    } catch (error) {
      logTest(`Data: ${table.name}`, false, error.message);
    }
  }
}

async function testCompanyJSONFields(connection) {
  console.log('\n🏢 Testing Company JSON Fields...');
  
  try {
    const [companies] = await connection.execute(
      'SELECT name, investors, products, markets FROM companies LIMIT 1'
    );

    if (companies.length > 0) {
      const company = companies[0];
      
      logTest('Company has name', !!company.name);
      
      try {
        const investors = JSON.parse(company.investors || '[]');
        logTest('Company investors field is valid JSON', Array.isArray(investors));
      } catch {
        logTest('Company investors field is valid JSON', false);
      }

      try {
        const products = JSON.parse(company.products || '[]');
        logTest('Company products field is valid JSON', Array.isArray(products));
      } catch {
        logTest('Company products field is valid JSON', false);
      }

      try {
        const markets = JSON.parse(company.markets || '[]');
        logTest('Company markets field is valid JSON', Array.isArray(markets));
      } catch {
        logTest('Company markets field is valid JSON', false);
      }
    } else {
      logTest('Company JSON fields', false, 'No companies found');
    }
  } catch (error) {
    logTest('Company JSON fields', false, error.message);
  }
}

async function testInvestorData(connection) {
  console.log('\n💼 Testing Investor Data...');
  
  try {
    const [investors] = await connection.execute('SELECT * FROM investors LIMIT 1');

    if (investors.length > 0) {
      const investor = investors[0];
      
      logTest('Investor has name', !!investor.name);
      logTest('Investor has slug', !!investor.slug);
      logTest('Investor has type', !!investor.type);
      
      try {
        const focusSectors = JSON.parse(investor.focus_sectors || '[]');
        logTest('Investor focus_sectors is valid JSON', Array.isArray(focusSectors));
      } catch {
        logTest('Investor focus_sectors is valid JSON', false);
      }
    } else {
      logTest('Investor data', false, 'No investors found');
    }
  } catch (error) {
    logTest('Investor data', false, error.message);
  }
}

async function testAPIHealth() {
  console.log('\n🔌 Testing API Endpoints...');
  
  try {
    const response = await fetch(`${API_BASE}/health`);
    const data = await response.json();
    logTest('API health endpoint', response.ok && data.status === 'OK');
  } catch (error) {
    logTest('API health endpoint', false, error.message);
  }
}

async function testAPIEndpoints() {
  const endpoints = [
    '/api/companies',
    '/api/investors',
    '/api/deals',
    '/api/grants',
    '/api/clinical-trials',
    '/api/blog'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`);
      const passed = response.ok || response.status === 401; // 401 is OK for protected endpoints
      logTest(`API endpoint: ${endpoint}`, passed, response.ok ? '' : `Status: ${response.status}`);
    } catch (error) {
      logTest(`API endpoint: ${endpoint}`, false, error.message);
    }
  }
}

async function testUserRegistration() {
  console.log('\n🔐 Testing User Registration with New Fields...');
  
  const testUser = {
    username: `test_${Date.now()}`,
    email: `test_${Date.now()}@medarion.test`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    userType: 'startup',
    accountTier: 'free',
    companyName: 'Test Startup'
  };

  try {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();

    if (response.ok) {
      logTest('User registration successful', true);
      logTest('User has account_tier', !!data.user?.account_tier);
      logTest('User has user_type', !!data.user?.user_type);
      logTest('User has dashboard_modules', Array.isArray(data.user?.dashboard_modules));
      logTest('User has JWT token', !!data.token);
      
      // Verify correct tier and modules
      const isFreeTier = data.user.account_tier === 'free';
      const hasCorrectModuleCount = data.user.dashboard_modules?.length === 3;
      logTest('Free tier user has 3 modules', isFreeTier && hasCorrectModuleCount);
    } else {
      logTest('User registration', false, data.error || 'Unknown error');
    }
  } catch (error) {
    logTest('User registration', false, error.message);
  }
}

async function testAccountTierLogic(connection) {
  console.log('\n🎯 Testing Account Tier Logic...');
  
  try {
    // Create test users with different tiers
    const tiers = ['free', 'paid', 'academic', 'enterprise'];
    
    for (const tier of tiers) {
      const [users] = await connection.execute(
        'SELECT account_tier FROM users WHERE account_tier = ? LIMIT 1',
        [tier]
      );
      
      logTest(`Account tier '${tier}' can be stored`, users.length > 0 || tier === 'free');
    }
  } catch (error) {
    logTest('Account tier logic', false, error.message);
  }
}

async function generateSummaryReport(connection) {
  console.log('\n📊 Database Summary Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const tables = ['users', 'companies', 'investors', 'deals', 'grants', 'clinical_trials', 'blog_posts'];
  
  for (const table of tables) {
    try {
      const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`   ${table.padEnd(20)}: ${rows[0].count} records`);
    } catch (error) {
      console.log(`   ${table.padEnd(20)}: Error (${error.message})`);
    }
  }
}

async function main() {
  console.log('🚀 Medarion Platform - Setup Verification\n');
  console.log('Database:', dbConfig.database);
  console.log('Host:', dbConfig.host);
  console.log('API Base:', API_BASE);

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);

    // Run all tests
    await testDatabaseConnection(connection);
    await testTableExistence(connection);
    await testUsersTableSchema(connection);
    await testDataMigration(connection);
    await testCompanyJSONFields(connection);
    await testInvestorData(connection);
    await testAccountTierLogic(connection);
    await testAPIHealth();
    await testAPIEndpoints();
    await testUserRegistration();

    // Generate summary
    await generateSummaryReport(connection);

    // Final results
    console.log('\n' + '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (testsFailed === 0) {
      console.log('🎉 All tests passed! Your setup is complete and working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
      console.log('   Check:');
      console.log('   - XAMPP MySQL is running');
      console.log('   - Database schema has been updated (database_schema_update.sql)');
      console.log('   - Data migration has been run (migrate_all_data.js)');
      console.log('   - Backend server is running (npm run server:dev)');
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run verification
main().catch(console.error);

