// Vast.ai API Service for Mistral 7B
// Connects to Vast.ai Flask API running on localhost:8081 (via SSH tunnel)
import fetch from 'node-fetch';

class VastAiService {
  constructor() {
    // Use local proxy if available, otherwise direct connection
    // SSH tunnel runs on localhost:3001 and handles connection to Vast.ai
    this.baseUrl = process.env.VAST_AI_URL || 'http://localhost:3001';
    this.timeout = 30000; // 30 seconds for fast chat responses (reduced from 45s)
    // Support both Vast.ai native API key and custom key
    this.apiKey = process.env.VAST_API_KEY || process.env.VAST_AI_API_KEY || 'medarion-secure-key-2025';
    
    console.log('🔧 VastAiService initialized:', {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      hasApiKey: !!this.apiKey,
      usingProxy: this.baseUrl.includes('localhost:3001')
    });
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck() {
    try {
      console.log('[VastAiService] Starting health check...', {
        baseUrl: this.baseUrl,
        hasApiKey: !!this.apiKey
      });
      
      // Try /health endpoint first with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 10000)
      );
      
      const fetchPromise = fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (response.ok) {
        const data = await response.json();
        console.log('[VastAiService] Health check response:', JSON.stringify(data));
        // Accept multiple status formats from Vast.ai API
        // New format includes inference_ready field for better verification
        const isHealthy = data && (
          data.gpu || 
          data.status === 'healthy' || 
          data.status === 'OK' || 
          data.status === 'ok' ||
          (data.model && data.status === 'ok') ||  // Medarion API format: {"status":"ok","model":"Medarion-Mistral-7B"}
          (data.inference_ready === true)  // Enhanced format: {"status":"ok","model":"Medarion-Mistral-7B","inference_ready":true}
        );
        console.log('[VastAiService] Health check result:', isHealthy);
        if (data.inference_ready !== undefined) {
          console.log('[VastAiService] Inference ready:', data.inference_ready);
        }
        if (data.device) {
          console.log('[VastAiService] Model device:', data.device);
        }
        return isHealthy;
      } else {
        console.error('[VastAiService] Health check failed with status:', response.status);
        const errorText = await response.text();
        console.error('[VastAiService] Error response:', errorText);
        
        // Fallback to /ping if /health doesn't work
        try {
          const pingTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ping timeout')), 5000)
          );
          const pingFetchPromise = fetch(`${this.baseUrl}/ping`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              'X-API-Key': this.apiKey
            }
          });
          const pingResponse = await Promise.race([pingFetchPromise, pingTimeoutPromise]);
          return pingResponse.ok;
        } catch (pingError) {
          console.error('[VastAiService] Ping fallback also failed:', pingError.message);
          return false;
        }
      }
    } catch (error) {
      console.error('[VastAiService] Health check failed:', error.message);
      console.error('[VastAiService] Error stack:', error.stack);
      return false;
    }
  }

  /**
   * Call Vast.ai API with chat messages (OpenAI-compatible format)
   * @param {Array} messages - Array of {role, content} objects
   * @param {Object} options - {temperature, max_tokens}
   * @returns {Promise<Object>} - OpenAI-compatible response
   */
  async invoke(messages, options = {}) {
    const {
      temperature = 0.6,  // Balanced for natural, accurate responses
      max_tokens = 4000,  // Increased to allow complete, full responses (was 800, now 4000)
      top_p = 0.9,  // Nucleus sampling for quality
      repetition_penalty = 1.15  // Prevent repetition for better quality
    } = options;

    // Ensure system message is present for Medarion identity
    // The fine-tuned model needs to know it's Medarion
    const hasSystem = messages.some(msg => msg.role === 'system');
    if (!hasSystem) {
      messages = [{
        role: 'system',
        content: 'You are Medarion, an AI assistant specialized in African healthcare market intelligence. You provide insights on healthcare companies, investors, deals, grants, clinical trials, and regulatory information across Africa. You are knowledgeable about market trends, investment patterns, and healthcare innovation in African markets. Always identify yourself as Medarion when asked about your identity.'
      }, ...messages];
      console.log('[VastAiService] Added system message for Medarion identity');
    }

    // Use OpenAI-compatible chat endpoint
    const payload = {
      messages,
      temperature,
      max_tokens,
      top_p,
      repetition_penalty
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      console.log('[VastAiService] Calling /chat endpoint:', {
        url: `${this.baseUrl}/chat`,
        messagesCount: messages.length,
        temperature,
        max_tokens
      });

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VastAiService] API error:', response.status, errorText);
        throw new Error(`Vast.ai API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[VastAiService] Response received:', {
        hasChoices: !!data.choices,
        choicesCount: data.choices?.length || 0,
        contentLength: data.choices?.[0]?.message?.content?.length || 0
      });
      
      // Vast.ai returns OpenAI-compatible format
      // REMOVED ALL FILTERING - Trust the fine-tuned Medarion model completely
      if (data.choices && data.choices.length > 0) {
        let content = data.choices[0].message.content || '';

        // ONLY minimal cleanup - remove control characters that break display
        // Trust the fine-tuned model's output completely
        content = content.replace(/\uFFFD/g, ''); // Remove replacement characters
        content = content.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, ''); // Control chars only
        content = content.replace(/[\u200B-\u200D\uFEFF\u2060]/g, ''); // Zero-width chars
        content = content.trim();

        console.log('[VastAiService] Fine-tuned model response (unfiltered):', content.length, 'chars');

        // Update the content in the response
        data.choices[0].message.content = content;
        
        return {
          choices: data.choices,
          usage: data.usage || {}
        };
      }

      throw new Error('Invalid response format from Vast.ai');
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Vast.ai API request timeout');
      }
      console.error('[VastAiService] invoke error:', error.message);
      throw error;
    }
  }

  /**
   * Generate text from a prompt (simple interface)
   * @param {string} prompt - User prompt
   * @param {string} systemPrompt - Optional system prompt
   * @param {Object} options - {temperature, max_tokens}
   * @returns {Promise<string>} - Generated text
   */
  async generate(prompt, systemPrompt = null, options = {}) {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    
    messages.push({ role: 'user', content: prompt });

    const response = await this.invoke(messages, options);
    return response.choices[0].message.content || '';
  }
}

export const vastAiService = new VastAiService();
export default vastAiService;

