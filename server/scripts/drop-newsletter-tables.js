import pool from '../config/database.js';

async function dropNewsletterTables() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    connection = await pool.getConnection();
    console.log('Connected to database successfully.');
    
    const tables = [
      'newsletter_campaigns',
      'newsletter_email_config',
      'newsletter_subscriptions'
    ];
    
    for (const table of tables) {
      try {
        console.log(`\nDropping table: ${table}...`);
        await connection.execute(`DROP TABLE IF EXISTS \`${table}\``);
        console.log(`✓ Table ${table} dropped successfully.`);
      } catch (error) {
        console.error(`✗ Error dropping table ${table}:`, error.message);
      }
    }
    
    console.log('\n✓ All newsletter tables have been dropped.');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('\nDatabase connection released.');
    }
  }
}

dropNewsletterTables();

