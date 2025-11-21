// Test script to verify backend can connect to Vast.ai API
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const API_URL = process.env.VAST_AI_URL || 'https://establish-ought-operation-areas.trycloudflare.com';
const API_KEY = process.env.VAST_AI_API_KEY || 'medarion-secure-key-2025';

async function testConnection() {
  console.log('\n🔍 Testing Backend API Connection...');
  console.log(`URL: ${API_URL}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      },
      timeout: 10000
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ SUCCESS!');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      // Test the health check logic
      const isHealthy = data && (
        data.gpu || 
        data.status === 'healthy' || 
        data.status === 'OK' || 
        data.status === 'ok' ||
        (data.model && data.status === 'ok')
      );
      
      console.log(`\nHealth check result: ${isHealthy ? '✅ TRUE' : '❌ FALSE'}`);
      return isHealthy;
    } else {
      console.log('\n❌ FAILED!');
      console.log(`Status: ${response.status}`);
      const text = await response.text();
      console.log(`Response: ${text}`);
      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR!');
    console.log(`Error: ${error.message}`);
    console.log(`Stack: ${error.stack}`);
    return false;
  }
}

testConnection().then(result => {
  process.exit(result ? 0 : 1);
});

