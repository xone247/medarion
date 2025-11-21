// AWS SageMaker Service for Mistral 7B
import { SageMakerRuntimeClient, InvokeEndpointCommand, InvokeEndpointAsyncCommand } from '@aws-sdk/client-sagemaker-runtime';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

class SageMakerService {
  constructor() {
    // Ensure credentials are available - use explicit values if env vars not set
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || 'YOUR_AWS_ACCESS_KEY_ID';
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_AWS_SECRET_ACCESS_KEY';
    const region = process.env.SAGEMAKER_REGION || 'us-east-2';
    
    console.log('🔧 SageMakerService initialized:', {
      region,
      endpoint: process.env.SAGEMAKER_ENDPOINT_NAME || 'medarion-7b-async-cpu',
      hasCredentials: !!accessKeyId && !!secretAccessKey
    });
    
    this.client = new SageMakerRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    
    this.endpointName = process.env.SAGEMAKER_ENDPOINT_NAME || 'medarion-7b-async-cpu';
    this.inferenceMode = process.env.SAGEMAKER_INFERENCE_MODE || 'async'; // 'async' | 'realtime' | 'serverless'
    this.s3Bucket = process.env.SAGEMAKER_ASYNC_BUCKET || process.env.S3_BUCKET || 'medarion7b-model-2025-ue2';
    this.asyncInputPrefix = process.env.SAGEMAKER_ASYNC_INPUT_PREFIX || 'async-inputs/';
    this.s3 = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  }

  /**
   * Call SageMaker endpoint with chat messages
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - {temperature, max_tokens}
   * @returns {Promise<Object>} Response with choices and usage
   */
  async invoke(messages, options = {}) {
    const {
      temperature = 0.7,
      max_tokens = 4000
    } = options;

    const payload = {
      messages,
      temperature,
      max_tokens
    };

    try {
      if (this.inferenceMode === 'async') {
        // Async: upload payload to S3, invoke async, poll for output
        const key = `${this.asyncInputPrefix.replace(/\/?$/, '/')}${uuidv4()}.json`;
        await this.s3.send(new PutObjectCommand({
          Bucket: this.s3Bucket,
          Key: key,
          ContentType: 'application/json',
          Body: JSON.stringify(payload),
        }));

        const invoke = new InvokeEndpointAsyncCommand({
          EndpointName: this.endpointName,
          InputLocation: `s3://${this.s3Bucket}/${key}`,
        });

        const startTime = Date.now();
        const resp = await this.client.send(invoke);
        const outputLocation = resp?.OutputLocation;
        if (!outputLocation) {
          throw new Error('No OutputLocation returned from async invocation');
        }
        // Parse s3://bucket/key
        const s3Path = outputLocation.slice('s3://'.length);
        const bucket = s3Path.split('/')[0];
        const outKey = s3Path.substring(bucket.length + 1);

        // Poll for output
        let bodyText = '';
        for (let i = 0; i < 120; i++) {
          try {
            await this.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: outKey }));
            const out = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: outKey }));
            bodyText = await out.Body.transformToString();
            break;
          } catch (e) {
            if (i === 0) console.log(`⏳ Waiting for async output (attempt ${i + 1}/120)...`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }
        const duration = Date.now() - startTime;
        if (!bodyText) {
          throw new Error('Timed out waiting for async output after 4 minutes');
        }
        
        let result;
        try {
          result = JSON.parse(bodyText);
        } catch (parseError) {
          console.error('Failed to parse SageMaker response:', bodyText.substring(0, 500));
          throw new Error(`Invalid JSON response from SageMaker: ${parseError.message}`);
        }
        
        // Handle different response formats
        if (result.choices && Array.isArray(result.choices)) {
          return { ...result, executionTime: duration };
        } else if (result.output || result.response) {
          // Some endpoints return {output: "text"} or {response: "text"}
          return {
            choices: [{
              message: {
                content: result.output || result.response || JSON.stringify(result)
              }
            }],
            executionTime: duration
          };
        } else {
          // Fallback: wrap the entire response
          return {
            choices: [{
              message: {
                content: typeof result === 'string' ? result : JSON.stringify(result)
              }
            }],
            executionTime: duration
          };
        }
      }

      // Sync (realtime/serverless)
      const command = new InvokeEndpointCommand({
        EndpointName: this.endpointName,
        ContentType: 'application/json',
        Body: JSON.stringify(payload)
      });

      const startTime = Date.now();
      const response = await this.client.send(command);
      const duration = Date.now() - startTime;

      const result = JSON.parse(new TextDecoder().decode(response.Body));
      
      return {
        ...result,
        executionTime: duration
      };
    } catch (error) {
      console.error('❌ SageMaker invoke error:', error.message);
      console.error('Error code:', error.name);
      console.error('Error details:', {
        endpoint: this.endpointName,
        region: this.client.config.region,
        mode: this.inferenceMode,
        bucket: this.s3Bucket
      });
      if (error.$metadata) {
        console.error('AWS Metadata:', error.$metadata);
      }
      throw new Error(`SageMaker error: ${error.message}`);
    }
  }

  /**
   * Generate text from a prompt
   * @param {string} prompt - User prompt
   * @param {string} systemPrompt - System prompt (optional)
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generate(prompt, systemPrompt = null, options = {}) {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.invoke(messages, options);
    return response.choices[0].message.content;
  }

  /**
   * Calculate cost based on execution time and memory
   * @param {number} memoryGB - Memory in GB
   * @param {number} durationSeconds - Duration in seconds
   * @returns {number} Cost in USD
   */
  calculateCost(memoryGB = 8, durationSeconds) {
    const costPerGBSecond = 0.000111;
    return memoryGB * durationSeconds * costPerGBSecond;
  }

  /**
   * Health check - verify endpoint is accessible
   * @returns {Promise<boolean>}
   */
  async healthCheck() {
    try {
      // Try a minimal request
      const response = await this.invoke(
        [{ role: 'user', content: 'test' }],
        { max_tokens: 10 }
      );
      return !!response;
    } catch (error) {
      console.error('SageMaker health check failed:', error);
      return false;
    }
  }
}

export const sagemakerService = new SageMakerService();
export default sagemakerService;

