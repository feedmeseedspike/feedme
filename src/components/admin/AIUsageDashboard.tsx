"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { aiUsageTracker, AIUsageStats, AIUsageLog } from 'src/lib/ai-usage-tracking';
import { costAlertManager, CostAlert } from 'src/lib/ai-cost-alerts';
import { generateMockAIData, clearMockAIData, hasMockData } from 'src/lib/ai-mock-data';
import { Badge } from '@components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Clock,
  Cpu,
  Image
} from 'lucide-react';

interface AIUsageDashboardProps {
  className?: string;
}

const AIUsageDashboard: React.FC<AIUsageDashboardProps> = ({ className }) => {
  const [stats, setStats] = useState<AIUsageStats>({
    total_requests: 0,
    successful_requests: 0,
    failed_requests: 0,
    total_cost: 0,
    total_tokens: 0,
    average_cost_per_request: 0,
    most_used_feature: '',
    unique_users: 0,
  });
  
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week' | 'month'>('day');
  const [recentLogs, setRecentLogs] = useState<AIUsageLog[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    console.log(`Loading stats for timeRange: ${timeRange}`);
    
    try {
      // Check if aiUsageTracker is available
      if (!aiUsageTracker || typeof aiUsageTracker.getUsageStats !== 'function') {
        throw new Error('AI Usage Tracker not available');
      }

      // Add timeout for each operation
      const statsPromise = aiUsageTracker.getUsageStats(timeRange);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats loading timeout')), 3000) // Reduced timeout
      );
      
      const currentStats = await Promise.race([statsPromise, timeoutPromise]) as any;
      console.log(`Stats loaded for ${timeRange}:`, currentStats);
      
      // Validate the stats response
      if (!currentStats || typeof currentStats !== 'object') {
        throw new Error('Invalid stats response');
      }
      
      setStats({
        total_requests: currentStats.total_requests || 0,
        successful_requests: currentStats.successful_requests || 0,
        failed_requests: currentStats.failed_requests || 0,
        total_cost: currentStats.total_cost || 0,
        total_tokens: currentStats.total_tokens || 0,
        average_cost_per_request: currentStats.average_cost_per_request || 0,
        most_used_feature: currentStats.most_used_feature || 'N/A',
        unique_users: currentStats.unique_users || 0,
      });
      
      // Get recent logs for detailed view
      const logs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
      setRecentLogs(logs.slice(-20).reverse()); // Last 20 logs, most recent first
      
      // Check for cost alerts (with shorter timeout)
      try {
        const alertsPromise = costAlertManager.checkAllThresholds();
        const alertTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Alerts timeout')), 2000)
        );
        
        const newAlerts = await Promise.race([alertsPromise, alertTimeoutPromise]) as any;
        const allActiveAlerts = costAlertManager.getActiveAlerts();
        setActiveAlerts(allActiveAlerts);
      } catch (alertError) {
        console.warn('Alert loading failed:', alertError);
        setActiveAlerts([]); // Set empty alerts on failure
      }
      
    } catch (error) {
      console.error(`Failed to load AI usage stats for ${timeRange}:`, error);
      setError(`Failed to load AI analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Try to get basic data from localStorage as fallback
      try {
        const logs = JSON.parse(localStorage.getItem('ai_usage_logs') || '[]');
        console.log(`Fallback: Found ${logs.length} logs in localStorage`);
        
        setRecentLogs(logs.slice(-20).reverse());
        
        // Calculate basic stats from logs
        const successfulRequests = logs.filter((log: any) => log.success).length;
        const totalCost = logs.reduce((sum: number, log: any) => sum + (log.estimated_cost || 0), 0);
        const totalTokens = logs.reduce((sum: number, log: any) => sum + (log.total_tokens || 0), 0);
        
        setStats({
          total_requests: logs.length,
          successful_requests: successfulRequests,
          failed_requests: logs.length - successfulRequests,
          total_cost: totalCost,
          total_tokens: totalTokens,
          average_cost_per_request: logs.length > 0 ? totalCost / logs.length : 0,
          most_used_feature: 'meal_planning',
          unique_users: new Set(logs.map((log: any) => log.user_id).filter(Boolean)).size,
        });
        
        console.log('Using fallback stats from localStorage');
      } catch (fallbackError) {
        console.error('Fallback stats loading failed:', fallbackError);
        
        // Set completely empty stats
        setStats({
          total_requests: 0,
          successful_requests: 0,
          failed_requests: 0,
          total_cost: 0,
          total_tokens: 0,
          average_cost_per_request: 0,
          most_used_feature: 'N/A',
          unique_users: 0,
        });
        setRecentLogs([]);
      }
      
      setActiveAlerts([]);
    } finally {
      setLoading(false);
      console.log(`Loading completed for ${timeRange}`);
    }
  };

  useEffect(() => {
    loadStats();
    
    // Safety timeout - if loading takes more than 10 seconds, stop loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('AI dashboard loading timeout - stopping loading state');
        setLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getFeatureBadgeColor = (feature: string) => {
    const colors = {
      meal_planning: 'bg-blue-100 text-blue-800',
      image_recognition: 'bg-purple-100 text-purple-800',
      product_recommendation: 'bg-green-100 text-green-800',
      general_chat: 'bg-gray-100 text-gray-800',
    };
    return colors[feature as keyof typeof colors] || colors.general_chat;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">AI Usage Dashboard</h1>
        <div className="flex gap-2">
          {(['hour', 'day', 'week', 'month'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="capitalize"
            >
              {range}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            className="ml-2"
          >
            Refresh
          </Button>
          {!hasMockData() ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                generateMockAIData();
                loadStats();
              }}
              className="ml-2 bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
            >
              Generate Test Data
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearMockAIData();
                loadStats();
              }}
              className="ml-2 bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
            >
              Clear Test Data
            </Button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Dashboard Error</h3>
                <p className="text-sm text-red-700">{error}</p>
                <p className="text-xs text-red-600 mt-1">
                  Using fallback data from localStorage. Try refreshing or generating test data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_cost)}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatCurrency(stats.average_cost_per_request)}/request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_requests)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">{stats.successful_requests} success</span>
              {stats.failed_requests > 0 && (
                <span className="text-red-600"> • {stats.failed_requests} failed</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.unique_users)}</div>
            <p className="text-xs text-muted-foreground">
              Unique users this {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.total_tokens)}</div>
            <p className="text-xs text-muted-foreground">
              Most used: {stats.most_used_feature.replace('_', ' ')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <h3 className="font-semibold text-red-800">Cost Threshold Exceeded</h3>
                      <p className="text-sm text-red-700">
                        Current {alert.timeframe}ly cost: ${alert.currentCost.toFixed(4)} 
                        (Threshold: ${alert.thresholdAmount.toFixed(2)})
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Triggered: {new Date(alert.triggeredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        costAlertManager.acknowledgeAlert(alert.id);
                        setActiveAlerts(costAlertManager.getActiveAlerts());
                      }}
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        costAlertManager.dismissAlert(alert.id);
                        setActiveAlerts(costAlertManager.getActiveAlerts());
                      }}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* General Cost Warning */}
      {stats.total_cost > 50 && activeAlerts.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-800">Cost Warning</h3>
                <p className="text-sm text-yellow-700">
                  AI usage costs are ${stats.total_cost.toFixed(2)} for this {timeRange}. 
                  Monitor usage carefully to avoid unexpected charges.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent AI Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No AI requests yet</p>
                <p className="text-sm text-gray-400">
                  {stats.total_requests === 0 
                    ? "Start using the AI meal planner to see data here"
                    : "Loading recent activity..."
                  }
                </p>
              </div>
            ) : (
              recentLogs.map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {log.has_image && <Image className="h-4 w-4 text-purple-600" />}
                      <Badge className={getFeatureBadgeColor(log.feature_type)}>
                        {log.feature_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">{log.model_used}</span>
                      <span className="text-gray-500 ml-2">
                        {log.total_tokens} tokens
                      </span>
                      {log.user_id && (
                        <span className="text-gray-500 ml-2">
                          User: {log.user_id.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <span className={getStatusColor(log.success)}>
                      {log.success ? '✓' : '✗'}
                    </span>
                    <span className="font-mono">
                      {formatCurrency(log.estimated_cost)}
                    </span>
                    <span className="text-gray-500">
                      {log.request_duration_ms}ms
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIUsageDashboard;