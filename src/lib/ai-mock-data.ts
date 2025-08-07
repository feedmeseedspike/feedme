// Mock AI Usage Data Generator for Testing
import { AIUsageLog } from './ai-usage-tracking';

export function generateMockAIData(): void {
  if (typeof window === 'undefined') return;
  
  const mockLogs: AIUsageLog[] = [];
  const now = Date.now();
  
  // Generate data for different time periods
  const timeRanges = [
    { period: 'hour', count: 5, timeAgo: 30 * 60 * 1000 }, // Last 30 minutes
    { period: 'day', count: 15, timeAgo: 12 * 60 * 60 * 1000 }, // Last 12 hours
    { period: 'week', count: 25, timeAgo: 3 * 24 * 60 * 60 * 1000 }, // Last 3 days
    { period: 'month', count: 50, timeAgo: 15 * 24 * 60 * 60 * 1000 }, // Last 15 days
  ];
  
  let logId = 1;
  
  timeRanges.forEach(range => {
    for (let i = 0; i < range.count; i++) {
      const randomTimeAgo = Math.random() * range.timeAgo;
      const timestamp = new Date(now - randomTimeAgo);
      
      const features = ['meal_planning', 'image_recognition', 'product_recommendation', 'general_chat'];
      const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-pro-vision', 'gpt-4', 'gpt-4-vision-preview', 'gpt-3.5-turbo'];
      const feature = features[Math.floor(Math.random() * features.length)] as any;
      const model = models[Math.floor(Math.random() * models.length)] as any;
      
      // Realistic token counts based on model
      const promptTokens = Math.floor(Math.random() * 500) + 100;
      const completionTokens = Math.floor(Math.random() * 300) + 50;
      const totalTokens = promptTokens + completionTokens;
      
      // Calculate realistic costs
      const costs = {
        'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
        'gpt-4-vision-preview': { input: 0.01 / 1000, output: 0.03 / 1000 },
        'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
        'gemini-pro': { input: 0, output: 0 }, // FREE
        'gemini-pro-vision': { input: 0, output: 0 }, // FREE
        'gemini-1.5-flash': { input: 0, output: 0 }, // FREE
        'gemini-1.5-pro': { input: 0, output: 0 }, // FREE
      };
      
      const modelCost = costs[model as keyof typeof costs];
      const estimatedCost = modelCost ? (promptTokens * modelCost.input) + (completionTokens * modelCost.output) : 0;
      
      const mockLog: AIUsageLog = {
        id: `mock_${logId++}`,
        user_id: Math.random() > 0.3 ? `user_${Math.floor(Math.random() * 10) + 1}` : undefined,
        session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        feature_type: feature,
        model_used: model,
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        estimated_cost: estimatedCost,
        request_duration_ms: Math.floor(Math.random() * 3000) + 500,
        success: Math.random() > 0.05, // 95% success rate
        error_message: Math.random() > 0.95 ? 'Rate limit exceeded' : undefined,
        user_message_length: Math.floor(Math.random() * 200) + 20,
        response_length: Math.floor(Math.random() * 500) + 100,
        has_image: feature === 'image_recognition' || Math.random() > 0.8,
        created_at: timestamp.toISOString(),
      };
      
      mockLogs.push(mockLog);
    }
  });
  
  // Sort by timestamp (newest first)
  mockLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  
  // Save to localStorage
  localStorage.setItem('ai_usage_logs', JSON.stringify(mockLogs));
  
}

// Clear mock data
export function clearMockAIData(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ai_usage_logs');
}

// Check if mock data exists
export function hasMockData(): boolean {
  if (typeof window === 'undefined') return false;
  const data = localStorage.getItem('ai_usage_logs');
  return data !== null && JSON.parse(data).length > 0;
}