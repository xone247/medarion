// AI Endpoint Integration Service for Medarion Platform
// This service handles all AI API calls and prepares for AWS deployment

import { aiService } from './databaseService';

// AI Configuration Types
interface AIConfig {
  provider: 'aws' | 'openai' | 'anthropic' | 'ollama' | 'custom';
  endpoint: string;
  apiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

interface AIRequest {
  tool: string;
  query: string;
  parameters?: Record<string, any>;
  userId?: number;
  context?: any;
}

interface AIResponse {
  success: boolean;
  data?: any;
  error?: string;
  tokensUsed?: number;
  cost?: number;
  executionTime?: number;
}

// AI Endpoint Manager
class AIEndpointManager {
  private static instance: AIEndpointManager;
  private configs: Map<string, AIConfig> = new Map();
  private defaultConfig: AIConfig;

  constructor() {
    this.defaultConfig = {
      provider: 'aws',
      endpoint: 'https://your-aws-endpoint.com',
      model: 'medarion-8b-qlora',
      maxTokens: 4000,
      temperature: 0.2,
      timeout: 30000
    };
  }

  static getInstance(): AIEndpointManager {
    if (!AIEndpointManager.instance) {
      AIEndpointManager.instance = new AIEndpointManager();
    }
    return AIEndpointManager.instance;
  }

  // Load AI configurations from database
  async loadConfigurations(): Promise<void> {
    try {
      const models = await aiService.getAIModels();
      models.forEach((model: any) => {
        this.configs.set(model.name, {
          provider: model.provider,
          endpoint: model.endpoint,
          apiKey: model.api_key_encrypted,
          model: model.model_version,
          maxTokens: model.max_tokens,
          temperature: model.temperature,
          timeout: 30000
        });
      });
    } catch (error) {
      console.error('Error loading AI configurations:', error);
    }
  }

  // Get configuration for a specific model
  getConfig(modelName: string): AIConfig {
    return this.configs.get(modelName) || this.defaultConfig;
  }

  // Update configuration
  async updateConfig(modelName: string, config: Partial<AIConfig>): Promise<void> {
    const currentConfig = this.getConfig(modelName);
    const updatedConfig = { ...currentConfig, ...config };
    this.configs.set(modelName, updatedConfig);
    
    // Update in database
    try {
      await aiService.updateAIModel(1, updatedConfig); // Assuming model ID 1
    } catch (error) {
      console.error('Error updating AI configuration:', error);
    }
  }
}

// AI Service Implementation
class AIService {
  private endpointManager: AIEndpointManager;

  constructor() {
    this.endpointManager = AIEndpointManager.getInstance();
  }

  // Generic AI request handler
  async makeRequest(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    
    try {
      // Get AI configuration
      const config = this.endpointManager.getConfig('medarion-8b-qlora');
      
      // Prepare request payload
      const payload = this.preparePayload(request, config);
      
      // Make API call
      const response = await this.callAIEndpoint(config, payload);
      
      // Process response
      const processedResponse = this.processResponse(response, config);
      
      // Log usage
      await this.logUsage(request, processedResponse, Date.now() - startTime);
      
      return {
        success: true,
        data: processedResponse,
        tokensUsed: response.tokensUsed,
        cost: response.cost,
        executionTime: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('AI request failed:', error);
      
      // Log error
      await this.logUsage(request, null, Date.now() - startTime, error.message);
      
      return {
        success: false,
        error: error.message,
        executionTime: Date.now() - startTime
      };
    }
  }

  // Prepare request payload based on provider
  private preparePayload(request: AIRequest, config: AIConfig): any {
    const basePayload = {
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature
    };

    switch (config.provider) {
      case 'aws':
        return {
          ...basePayload,
          messages: [
            { role: 'system', content: this.getSystemPrompt(request.tool) },
            { role: 'user', content: this.formatQuery(request) }
          ],
          stream: false
        };
        
      case 'openai':
        return {
          ...basePayload,
          messages: [
            { role: 'system', content: this.getSystemPrompt(request.tool) },
            { role: 'user', content: this.formatQuery(request) }
          ]
        };
        
      case 'anthropic':
        return {
          ...basePayload,
          messages: [
            { role: 'user', content: this.formatQuery(request) }
          ],
          system: this.getSystemPrompt(request.tool)
        };
        
      case 'ollama':
        return {
          ...basePayload,
          prompt: `${this.getSystemPrompt(request.tool)}\n\nUser: ${this.formatQuery(request)}`,
          stream: false
        };
        
      default:
        return basePayload;
    }
  }

  // Call AI endpoint
  private async callAIEndpoint(config: AIConfig, payload: any): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };

      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }

      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`AI endpoint error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  // Process response based on provider
  private processResponse(response: any, config: AIConfig): any {
    switch (config.provider) {
      case 'aws':
      case 'openai':
        return {
          content: response.choices?.[0]?.message?.content || response.response || '',
          tokensUsed: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0, config.provider)
        };
        
      case 'anthropic':
        return {
          content: response.content?.[0]?.text || '',
          tokensUsed: response.usage?.input_tokens + response.usage?.output_tokens || 0,
          cost: this.calculateCost(response.usage?.input_tokens + response.usage?.output_tokens || 0, config.provider)
        };
        
      case 'ollama':
        return {
          content: response.response || '',
          tokensUsed: response.eval_count || 0,
          cost: 0 // Ollama is typically free
        };
        
      default:
        return {
          content: response.content || response.response || '',
          tokensUsed: 0,
          cost: 0
        };
    }
  }

  // Get system prompt for specific tool
  private getSystemPrompt(tool: string): string {
    const prompts: Record<string, string> = {
      'market_risk_assessment': 'You are an expert in African healthcare market analysis. Provide detailed risk assessments with specific scores and actionable insights.',
      'competitor_analysis': 'You are a competitive intelligence expert specializing in African healthcare markets. Analyze competitors with specific data and strategic insights.',
      'valuation_benchmark': 'You are a healthcare investment analyst with expertise in African startup valuations. Provide accurate valuation ranges with detailed reasoning.',
      'due_diligence_summary': 'You are a due diligence expert for healthcare investments in Africa. Create comprehensive assessments with SWOT analysis and key questions.',
      'fundraising_strategy': 'You are a fundraising strategist specializing in African healthcare startups. Develop detailed strategies with specific timelines and targets.',
      'ask_medarion': 'You are Medarion, a helpful AI assistant for African healthcare market data. Provide accurate, contextual answers with sources when available.'
    };

    return prompts[tool] || 'You are a helpful AI assistant specializing in African healthcare market data and analysis.';
  }

  // Format query based on tool and parameters
  private formatQuery(request: AIRequest): string {
    const { tool, query, parameters } = request;

    switch (tool) {
      case 'market_risk_assessment':
        return `Assess market risk for ${parameters?.country || 'the specified country'}. Provide a risk score (0-100) and identify 3-5 key risk factors. Context: ${query}`;
        
      case 'competitor_analysis':
        return `Analyze competitors for ${parameters?.company_name || 'the specified company'} in the ${parameters?.sector || 'healthcare'} sector. List top 3 competitors with their strengths. Context: ${query}`;
        
      case 'valuation_benchmark':
        return `Provide valuation range for ${parameters?.stage || 'the specified stage'} stage ${parameters?.sector || 'healthcare'} startups in USD millions. Include low and high estimates. Context: ${query}`;
        
      case 'due_diligence_summary':
        return `Create a due diligence summary for ${parameters?.company_name || 'the specified company'} including SWOT analysis and 3 key questions for investors. Context: ${query}`;
        
      case 'fundraising_strategy':
        return `Develop a fundraising strategy for a ${parameters?.sector || 'healthcare'} ${parameters?.stage || 'startup'} raising $${parameters?.amount || 'funding'}. Include investor targeting and timeline. Context: ${query}`;
        
      default:
        return query;
    }
  }

  // Calculate cost based on tokens and provider
  private calculateCost(tokens: number, provider: string): number {
    const costs: Record<string, number> = {
      'openai': tokens * 0.00003, // Approximate cost per token
      'anthropic': tokens * 0.000025,
      'aws': tokens * 0.00002,
      'ollama': 0
    };

    return costs[provider] || 0;
  }

  // Log AI usage
  private async logUsage(request: AIRequest, response: any, executionTime: number, error?: string): Promise<void> {
    try {
      await aiService.logAIUsage({
        user_id: request.userId || 0,
        tool_name: request.tool,
        query: request.query,
        response: response?.content || null,
        tokens_used: response?.tokensUsed || 0,
        cost_usd: response?.cost || 0,
        execution_time_ms: executionTime,
        success: !error,
        error_message: error || null
      });
    } catch (error) {
      console.error('Error logging AI usage:', error);
    }
  }

  // Specific AI tool implementations
  async assessMarketRisk(country: string, context?: any): Promise<AIResponse> {
    return this.makeRequest({
      tool: 'market_risk_assessment',
      query: `Assess market risk for ${country}`,
      parameters: { country },
      context
    });
  }

  async analyzeCompetitors(companyName: string, sector: string, context?: any): Promise<AIResponse> {
    return this.makeRequest({
      tool: 'competitor_analysis',
      query: `Analyze competitors for ${companyName}`,
      parameters: { company_name: companyName, sector },
      context
    });
  }

  async benchmarkValuation(stage: string, sector: string, context?: any): Promise<AIResponse> {
    return this.makeRequest({
      tool: 'valuation_benchmark',
      query: `Benchmark valuation for ${stage} ${sector}`,
      parameters: { stage, sector },
      context
    });
  }

  async generateDueDiligenceSummary(companyName: string, context?: any): Promise<AIResponse> {
    return this.makeRequest({
      tool: 'due_diligence_summary',
      query: `Generate due diligence summary for ${companyName}`,
      parameters: { company_name: companyName },
      context
    });
  }

  async generateFundraisingStrategy(sector: string, stage: string, amount: number, context?: any): Promise<AIResponse> {
    return this.makeRequest({
      tool: 'fundraising_strategy',
      query: `Generate fundraising strategy for ${sector} ${stage} startup`,
      parameters: { sector, stage, amount },
      context
    });
  }

  async askMedarion(query: string, userId?: number, context?: any): Promise<AIResponse> {
    return this.makeRequest({
      tool: 'ask_medarion',
      query,
      userId,
      context
    });
  }

  // Batch processing for multiple requests
  async processBatch(requests: AIRequest[]): Promise<AIResponse[]> {
    const promises = requests.map(request => this.makeRequest(request));
    return Promise.all(promises);
  }

  // Health check for AI endpoints
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [modelName, config] of this.endpointManager['configs']) {
      try {
        const response = await fetch(config.endpoint, {
          method: 'GET',
          headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}
        });
        results[modelName] = response.ok;
      } catch (error) {
        results[modelName] = false;
      }
    }
    
    return results;
  }
}

// Export singleton instance
export const aiEndpointService = new AIService();
export const aiEndpointManager = AIEndpointManager.getInstance();

// Export types
export type { AIConfig, AIRequest, AIResponse };

// AWS-specific configuration helper
export const configureAWS = async (endpoint: string, apiKey?: string) => {
  const manager = AIEndpointManager.getInstance();
  await manager.updateConfig('medarion-8b-qlora', {
    provider: 'aws',
    endpoint,
    apiKey,
    model: 'medarion-8b-qlora',
    maxTokens: 4000,
    temperature: 0.2
  });
};

// OpenAI configuration helper
export const configureOpenAI = async (apiKey: string, model: string = 'gpt-4') => {
  const manager = AIEndpointManager.getInstance();
  await manager.updateConfig('openai', {
    provider: 'openai',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    apiKey,
    model,
    maxTokens: 4000,
    temperature: 0.7
  });
};

// Anthropic configuration helper
export const configureAnthropic = async (apiKey: string, model: string = 'claude-3-sonnet') => {
  const manager = AIEndpointManager.getInstance();
  await manager.updateConfig('anthropic', {
    provider: 'anthropic',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey,
    model,
    maxTokens: 4000,
    temperature: 0.7
  });
};

export default aiEndpointService;


