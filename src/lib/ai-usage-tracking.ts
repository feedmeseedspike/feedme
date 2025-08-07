// AI Usage Tracking and Cost Monitoring System

export interface AIUsageLog {
  id?: string;
  user_id?: string;
  session_id: string;
  feature_type: 'meal_planning' | 'image_recognition' | 'product_recommendation' | 'general_chat';
  model_used: 'gpt-4' | 'gpt-4-vision-preview' | 'gpt-3.5-turbo' | 'gemini-pro' | 'gemini-pro-vision' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  request_duration_ms: number;
  success: boolean;
  error_message?: string;
  user_message_length: number;
  response_length: number;
  has_image: boolean;
  created_at: string;
}

export interface AIUsageStats {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  total_cost: number;
  total_tokens: number;
  average_cost_per_request: number;
  most_used_feature: string;
  unique_users: number;
}

// AI Model Pricing (as of 2024 - update as needed)
export const AI_PRICING = {
  'gpt-4': {
    input: 0.03 / 1000,  // $0.03 per 1K tokens
    output: 0.06 / 1000, // $0.06 per 1K tokens
  },
  'gpt-4-vision-preview': {
    input: 0.01 / 1000,  // $0.01 per 1K tokens  
    output: 0.03 / 1000, // $0.03 per 1K tokens
  },
  'gpt-3.5-turbo': {
    input: 0.0015 / 1000,  // $0.0015 per 1K tokens
    output: 0.002 / 1000,  // $0.002 per 1K tokens
  },
  'gemini-pro': {
    input: 0,  // FREE
    output: 0, // FREE
  },
  'gemini-pro-vision': {
    input: 0,  // FREE
    output: 0, // FREE
  },
  'gemini-1.5-flash': {
    input: 0,  // FREE - 15 requests/min, 1500/day
    output: 0, // FREE
  },
  'gemini-1.5-pro': {
    input: 0,  // FREE - 2 requests/min, 50/day (very limited)
    output: 0, // FREE
  }
};

export function calculateCost(
  model: keyof typeof AI_PRICING,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = AI_PRICING[model];
  const inputCost = promptTokens * pricing.input;
  const outputCost = completionTokens * pricing.output;
  return inputCost + outputCost;
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class AIUsageTracker {
  private sessionId: string;
  
  constructor() {
    this.sessionId = generateSessionId();
  }

  async logUsage(
    usage: Omit<AIUsageLog, 'id' | 'created_at' | 'session_id' | 'estimated_cost'>
  ): Promise<void> {
    const estimatedCost = calculateCost(
      usage.model_used,
      usage.prompt_tokens,
      usage.completion_tokens
    );

    const logEntry: AIUsageLog = {
      ...usage,
      session_id: this.sessionId,
      estimated_cost: estimatedCost,
      created_at: new Date().toISOString(),
    };

    try {
      // Import Supabase client dynamically to avoid issues in client-side code
      const { createClient } = await import('src/utils/supabase/client');
      const supabase = createClient();
      
      // Insert into Supabase database
      const { error } = await supabase
        .from('ai_usage_logs')
        .insert(logEntry);
      
      if (error) {
        console.error('Supabase insert error:', error);
        // Fallback to localStorage for development
        if (typeof window !== 'undefined') {
          const existingLogs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
          existingLogs.push(logEntry);
          localStorage.setItem('ai_usage_logs', JSON.stringify(existingLogs));
        }
      }
    } catch (error) {
      console.error('Failed to log AI usage:', error);
      // Fallback to localStorage for development
      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
        existingLogs.push(logEntry);
        localStorage.setItem('ai_usage_logs', JSON.stringify(existingLogs));
      }
    }
  }

  async checkUserRateLimit(userId: string, timeWindow: number = 3600000): Promise<boolean> {
    // Check if user has exceeded rate limit in the last hour
    const windowStart = new Date(Date.now() - timeWindow).toISOString();
    
    try {
      // Import Supabase client dynamically
      const { createClient } = await import('src/utils/supabase/client');
      const supabase = createClient();
      
      const { count, error } = await supabase
        .from('ai_usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', windowStart);
      
      if (error) {
        console.error('Rate limit check error:', error);
        // Fallback to localStorage for development
        if (typeof window !== 'undefined') {
          const existingLogs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
          const userLogs = existingLogs.filter((log: AIUsageLog) => 
            log.user_id === userId && 
            new Date(log.created_at).getTime() > (Date.now() - timeWindow)
          );
          const MAX_REQUESTS_PER_HOUR = 20;
          return userLogs.length < MAX_REQUESTS_PER_HOUR;
        }
        return true; // Allow request if check fails
      }
      
      const MAX_REQUESTS_PER_HOUR = 20; // Adjust based on your needs
      return (count || 0) < MAX_REQUESTS_PER_HOUR;
    } catch (error) {
      console.error('Failed to check rate limit:', error);
      return true; // Allow request if check fails
    }
  }

  async checkDailyQuota(): Promise<{ remaining: number; total: number; exceeded: boolean }> {
    try {
      const DAILY_QUOTA = 50; // Gemini free tier limit
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      
      let dailyRequests = 0;
      
      try {
        // Import Supabase client dynamically
        const { createClient } = await import('src/utils/supabase/client');
        const supabase = createClient();
        
        const { count, error } = await supabase
          .from('ai_usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('success', true)
          .gte('created_at', dayStart.toISOString());
          
        if (!error) {
          dailyRequests = count || 0;
        } else {
          throw error;
        }
      } catch (dbError) {
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const existingLogs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
          dailyRequests = existingLogs.filter((log: AIUsageLog) => 
            log.success && 
            new Date(log.created_at).getTime() > dayStart.getTime()
          ).length;
        }
      }
      
      return {
        remaining: Math.max(0, DAILY_QUOTA - dailyRequests),
        total: DAILY_QUOTA,
        exceeded: dailyRequests >= DAILY_QUOTA
      };
    } catch (error) {
      console.error('Failed to check daily quota:', error);
      return { remaining: 50, total: 50, exceeded: false };
    }
  }

  async getUsageStats(timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<AIUsageStats> {
    const timeRanges = {
      hour: 3600000,      // 1 hour
      day: 86400000,      // 24 hours  
      week: 604800000,    // 7 days
      month: 2592000000,  // 30 days
    };
    
    
    const windowStartTime = Date.now() - timeRanges[timeRange];
    const windowStart = new Date(windowStartTime).toISOString();
    
    
    try {
      // Always try localStorage first (for development/testing)
      if (typeof window !== 'undefined') {
        const existingLogs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
        
        const relevantLogs = existingLogs.filter((log: AIUsageLog) => {
          const logTime = new Date(log.created_at).getTime();
          return logTime > windowStartTime;
        });
        
        
        if (existingLogs.length > 0 || timeRange === 'day') {
          // If we have localStorage data, or if it's day view, return localStorage results
          return this.calculateStatsFromLogs(relevantLogs);
        }
      }
      
      // Try Supabase as fallback
      try {
        const { createClient } = await import('src/utils/supabase/client');
        const supabase = createClient();
        
        const { data: logs, error } = await supabase
          .from('ai_usage_logs')
          .select('*')
          .gte('created_at', windowStart);
        
        if (error) {
          console.warn(`Supabase error for ${timeRange}:`, error.message);
          return this.getEmptyStats();
        }
        
        return this.calculateStatsFromLogs((logs || []) as AIUsageLog[]);
        
      } catch (supabaseError) {
        console.warn(`Supabase connection failed for ${timeRange}:`, supabaseError);
        return this.getEmptyStats();
      }
      
    } catch (error) {
      console.error(`Failed to get usage stats for ${timeRange}:`, error);
      return this.getEmptyStats();
    }
  }

  private calculateStatsFromLogs(logs: AIUsageLog[]): AIUsageStats {
    const stats: AIUsageStats = {
      total_requests: logs.length,
      successful_requests: logs.filter(log => log.success).length,
      failed_requests: logs.filter(log => !log.success).length,
      total_cost: logs.reduce((sum, log) => sum + log.estimated_cost, 0),
      total_tokens: logs.reduce((sum, log) => sum + log.total_tokens, 0),
      average_cost_per_request: 0,
      most_used_feature: '',
      unique_users: new Set(logs.map(log => log.user_id).filter(Boolean)).size,
    };
    
    stats.average_cost_per_request = stats.total_requests > 0 ? stats.total_cost / stats.total_requests : 0;
    
    // Find most used feature
    const featureCounts = logs.reduce((acc: Record<string, number>, log) => {
      acc[log.feature_type] = (acc[log.feature_type] || 0) + 1;
      return acc;
    }, {});
    
    stats.most_used_feature = Object.entries(featureCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    return stats;
  }

  private getEmptyStats(): AIUsageStats {
    return {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      total_cost: 0,
      total_tokens: 0,
      average_cost_per_request: 0,
      most_used_feature: '',
      unique_users: 0,
    };
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Global instance
export const aiUsageTracker = new AIUsageTracker();