// Vast.ai API Service for Mistral 7B
// Connects to Vast.ai Flask API running on localhost:8081 (via SSH tunnel)

class VastAiService {
  constructor() {
    this.baseUrl = process.env.VAST_AI_URL || 'http://localhost:8081';
    this.timeout = 120000; // 2 minutes for AI generation
    
    console.log('🔧 VastAiService initialized:', {
      baseUrl: this.baseUrl,
      timeout: this.timeout
    });
  }

  /**
   * Health check - verify API is accessible
   */
  async healthCheck() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data && (data.gpu || data.status === 'OK');
    } catch (error) {
      console.error('Vast.ai health check failed:', error.message);
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
      temperature = 0.7,
      max_tokens = 4000
    } = options;

    const payload = {
      messages,
      temperature,
      max_tokens
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vast.ai API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // Vast.ai returns OpenAI-compatible format
      if (data.choices && data.choices.length > 0) {
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
      console.error('Vast.ai invoke error:', error.message);
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

