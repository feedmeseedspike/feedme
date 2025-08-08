// AI API Wrapper with Usage Tracking
import OpenAI from 'openai';
import { aiUsageTracker, AIUsageLog } from './ai-usage-tracking';

export interface TrackedAIRequest {
  userId?: string;
  featureType: 'meal_planning' | 'image_recognition' | 'product_recommendation' | 'general_chat';
  userMessage: string;
  hasImage?: boolean;
}

export class TrackedOpenAI {
  private openai: OpenAI;
  
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async createChatCompletion(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    options: {
      model?: 'gpt-4' | 'gpt-4-vision-preview' | 'gpt-3.5-turbo';
      max_tokens?: number;
      temperature?: number;
    } = {},
    trackingInfo: TrackedAIRequest
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const startTime = Date.now();
    const model = options.model || 'gpt-4';
    
    // Check rate limit first
    if (trackingInfo.userId) {
      const isAllowed = await aiUsageTracker.checkUserRateLimit(trackingInfo.userId);
      if (!isAllowed) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages,
        max_tokens: options.max_tokens || 1000,
        temperature: options.temperature || 0.7,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log successful usage
      await aiUsageTracker.logUsage({
        user_id: trackingInfo.userId,
        feature_type: trackingInfo.featureType,
        model_used: model,
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
        request_duration_ms: duration,
        success: true,
        user_message_length: trackingInfo.userMessage.length,
        response_length: completion.choices[0]?.message?.content?.length || 0,
        has_image: trackingInfo.hasImage || false,
      });

      return completion;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log failed usage
      await aiUsageTracker.logUsage({
        user_id: trackingInfo.userId,
        feature_type: trackingInfo.featureType,
        model_used: model,
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
        request_duration_ms: duration,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        user_message_length: trackingInfo.userMessage.length,
        response_length: 0,
        has_image: trackingInfo.hasImage || false,
      });

      throw error;
    }
  }

  async analyzeImage(
    imageData: string,
    prompt: string,
    trackingInfo: TrackedAIRequest
  ): Promise<string> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: imageData,
            },
          },
        ],
      },
    ];

    const completion = await this.createChatCompletion(
      messages,
      { model: 'gpt-4-vision-preview', max_tokens: 1000 },
      { ...trackingInfo, hasImage: true }
    );

    return completion.choices[0]?.message?.content || '';
  }
}

// Global instance
export const trackedOpenAI = new TrackedOpenAI();

// Helper function for cost-optimized model selection
export function selectOptimalModel(
  requestType: 'simple' | 'complex' | 'vision',
  userMessage: string
): 'gpt-4' | 'gpt-4-vision-preview' | 'gpt-3.5-turbo' {
  if (requestType === 'vision') {
    return 'gpt-4-vision-preview';
  }
  
  // Use cheaper model for simple requests
  if (requestType === 'simple' || userMessage.length < 100) {
    return 'gpt-3.5-turbo';
  }
  
  return 'gpt-4';
}