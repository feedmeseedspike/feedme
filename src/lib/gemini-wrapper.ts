// Google Gemini AI Wrapper with Usage Tracking
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiUsageTracker } from './ai-usage-tracking';

export interface TrackedGeminiRequest {
  userId?: string;
  featureType: 'meal_planning' | 'image_recognition' | 'product_recommendation' | 'general_chat';
  userMessage: string;
  hasImage?: boolean;
}

export class TrackedGemini {
  private genAI?: GoogleGenerativeAI;
  
  private ensureInitialized() {
    if (!this.genAI) {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY is not set in environment variables');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generateContent(
    prompt: string,
    options: {
      model?: 'gemini-1.5-flash' | 'gemini-1.5-pro';
      maxOutputTokens?: number;
      temperature?: number;
    } = {},
    trackingInfo: TrackedGeminiRequest,
    imageData?: string
  ): Promise<string> {
    this.ensureInitialized();
    const startTime = Date.now();
    const model = options.model || 'gemini-1.5-flash'; // 1.5-flash supports both text and images
    
    // Check rate limit first
    if (trackingInfo.userId) {
      const isAllowed = await aiUsageTracker.checkUserRateLimit(trackingInfo.userId);
      if (!isAllowed) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
    }

    // Check daily quota before making API call
    const quotaStatus = await aiUsageTracker.checkDailyQuota();
    if (quotaStatus.exceeded) {
      throw new Error('Daily AI quota exceeded. Service will reset tomorrow.');
    }
    
    // Warn when approaching quota limit (90% used)
    if (quotaStatus.remaining <= 5) {
      console.warn(`Low quota warning: ${quotaStatus.remaining} requests remaining today`);
    }

    // Retry logic for service overload (increased retries)
    let retries = 5;
    let lastError;
    
    while (retries > 0) {
      try {
        const genModel = this.genAI!.getGenerativeModel({ 
          model,
          generationConfig: {
            maxOutputTokens: options.maxOutputTokens || 1000,
            temperature: options.temperature || 0.7,
          }
        });

        let result;
        
        if (imageData) {
          // Handle image input
          const imagePart = {
            inlineData: {
              data: imageData,
              mimeType: 'image/jpeg'
            }
          };
          
          result = await genModel.generateContent([prompt, imagePart]);
        } else {
          // Handle text-only input
          result = await genModel.generateContent(prompt);
        }

        const response = result.response;
        const text = response.text();
      
        const endTime = Date.now();
        const duration = endTime - startTime;

        // Estimate token usage (Gemini doesn't provide exact counts)
        // We'll estimate based on character count
        const promptTokens = Math.ceil(prompt.length / 4); // Rough estimate: 4 chars = 1 token
        const completionTokens = Math.ceil(text.length / 4);
        const totalTokens = promptTokens + completionTokens;

        // Log successful usage (Gemini is free, so cost = 0)
        await aiUsageTracker.logUsage({
          user_id: trackingInfo.userId,
          feature_type: trackingInfo.featureType,
          model_used: model as 'gpt-4' | 'gpt-4-vision-preview' | 'gpt-3.5-turbo' | 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-flash' | 'gemini-1.5-pro',
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: totalTokens,
          request_duration_ms: duration,
          success: true,
          user_message_length: trackingInfo.userMessage.length,
          response_length: text.length,
          has_image: trackingInfo.hasImage || false,
        });

        return text;
        
      } catch (error) {
        lastError = error;
        retries--;
        
        // Check error type
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const isQuotaExceeded = errorMessage.includes('quota') || 
                               errorMessage.includes('429') ||
                               errorMessage.includes('exceeded your current quota');
        const isOverloadError = errorMessage.includes('overloaded') || 
                               errorMessage.includes('503') || 
                               errorMessage.includes('Service Unavailable');
        
        // Don't retry quota exceeded errors - they won't resolve with retries
        if (isQuotaExceeded) {
          console.error('Gemini API quota exceeded - daily limit reached');
          break; // Exit retry loop immediately
        }
        
        if (isOverloadError && retries > 0) {
          // Wait before retrying (exponential backoff with longer delays)
          const delay = (6 - retries) * 2000; // 2s, 4s, 6s, 8s, 10s
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If not an overload error or no retries left, break
        break;
      }
    }
    
    // If we get here, all retries failed
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log failed usage
    await aiUsageTracker.logUsage({
      user_id: trackingInfo.userId,
      feature_type: trackingInfo.featureType,
      model_used: model as 'gpt-4' | 'gpt-4-vision-preview' | 'gpt-3.5-turbo' | 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-flash' | 'gemini-1.5-pro',
      prompt_tokens: 0,
      completion_tokens: 0,
      total_tokens: 0,
      request_duration_ms: duration,
      success: false,
      error_message: lastError instanceof Error ? lastError.message : 'Unknown error',
      user_message_length: trackingInfo.userMessage.length,
      response_length: 0,
      has_image: trackingInfo.hasImage || false,
    });

    throw lastError;
  }

  async analyzeImage(
    imageData: string,
    prompt: string,
    trackingInfo: TrackedGeminiRequest
  ): Promise<string> {
    return this.generateContent(
      prompt,
      { model: 'gemini-1.5-pro', maxOutputTokens: 1000 },
      { ...trackingInfo, hasImage: true },
      imageData
    );
  }
}

// Global instance
export const trackedGemini = new TrackedGemini();

// Helper function for model selection (Gemini has fewer models)
export function selectOptimalGeminiModel(
  requestType: 'simple' | 'complex' | 'vision',
  userMessage: string
): 'gemini-1.5-flash' | 'gemini-1.5-pro' {
  // Always use flash for free tier - it has much higher limits
  // Pro has very limited free tier quotas (50 requests/day)
  return 'gemini-1.5-flash';
}