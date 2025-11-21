// Direct test of SageMaker service
import dotenv from 'dotenv';
import { sagemakerService } from './services/sagemakerService.js';

dotenv.config();

console.log('🧪 Testing SageMaker Service Directly...\n');

async function test() {
  try {
    console.log('1️⃣ Testing health check...');
    const health = await sagemakerService.healthCheck();
    console.log('Health check result:', health ? '✅ PASSED' : '❌ FAILED');
    
    if (!health) {
      console.log('\n⚠️ Health check failed, but continuing with invoke test...');
    }
    
    console.log('\n2️⃣ Testing invoke with simple message...');
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello in one sentence.' }
    ];
    
    console.log('Sending messages:', JSON.stringify(messages, null, 2));
    console.log('⏳ This may take 30-60 seconds for async endpoint...\n');
    
    const response = await sagemakerService.invoke(messages, {
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('\n✅ Success! Response received:');
    console.log('Response structure:', Object.keys(response));
    if (response.choices && response.choices[0]) {
      console.log('Answer:', response.choices[0].message.content);
    } else {
      console.log('Full response:', JSON.stringify(response, null, 2));
    }
    if (response.executionTime) {
      console.log(`Execution time: ${response.executionTime}ms (${(response.executionTime / 1000).toFixed(2)}s)`);
    }
    
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

test().then(success => {
  process.exit(success ? 0 : 1);
});

