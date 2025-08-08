// AI Cost Threshold Alert System
import { aiUsageTracker, AIUsageStats } from './ai-usage-tracking';

export interface CostThreshold {
  id: string;
  name: string;
  amount: number;
  timeframe: 'hour' | 'day' | 'week' | 'month';
  enabled: boolean;
  notificationMethod: 'email' | 'webhook' | 'dashboard';
  webhookUrl?: string;
  emailAddress?: string;
}

export interface CostAlert {
  id: string;
  thresholdId: string;
  currentCost: number;
  thresholdAmount: number;
  percentage: number;
  timeframe: string;
  triggeredAt: string;
  acknowledged: boolean;
}

// Default cost thresholds for a startup
export const DEFAULT_COST_THRESHOLDS: CostThreshold[] = [
  {
    id: 'daily-warning',
    name: 'Daily Warning',
    amount: 10.0,
    timeframe: 'day',
    enabled: true,
    notificationMethod: 'dashboard',
  },
  {
    id: 'daily-critical',
    name: 'Daily Critical',
    amount: 25.0,
    timeframe: 'day',
    enabled: true,
    notificationMethod: 'dashboard',
  },
  {
    id: 'weekly-warning',
    name: 'Weekly Warning',
    amount: 50.0,
    timeframe: 'week',
    enabled: true,
    notificationMethod: 'dashboard',
  },
  {
    id: 'weekly-critical',
    name: 'Weekly Critical',
    amount: 100.0,
    timeframe: 'week',
    enabled: true,
    notificationMethod: 'dashboard',
  },
  {
    id: 'monthly-budget',
    name: 'Monthly Budget Limit',
    amount: 300.0,
    timeframe: 'month',
    enabled: true,
    notificationMethod: 'dashboard',
  },
];

export class CostAlertManager {
  private thresholds: CostThreshold[] = [];
  private activeAlerts: CostAlert[] = [];

  constructor() {
    this.loadThresholds();
    this.loadActiveAlerts();
  }

  private loadThresholds(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_cost_thresholds');
      this.thresholds = saved ? JSON.parse(saved) : [...DEFAULT_COST_THRESHOLDS];
    } else {
      this.thresholds = [...DEFAULT_COST_THRESHOLDS];
    }
  }

  private saveThresholds(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_cost_thresholds', JSON.stringify(this.thresholds));
    }
  }

  private loadActiveAlerts(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ai_active_alerts');
      this.activeAlerts = saved ? JSON.parse(saved) : [];
    }
  }

  private saveActiveAlerts(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai_active_alerts', JSON.stringify(this.activeAlerts));
    }
  }

  async checkAllThresholds(): Promise<CostAlert[]> {
    const newAlerts: CostAlert[] = [];

    for (const threshold of this.thresholds) {
      if (!threshold.enabled) continue;

      try {
        const stats = await aiUsageTracker.getUsageStats(threshold.timeframe);
        const percentage = (stats.total_cost / threshold.amount) * 100;

        // Check if threshold is exceeded
        if (stats.total_cost >= threshold.amount) {
          const existingAlert = this.activeAlerts.find(
            alert => alert.thresholdId === threshold.id && !alert.acknowledged
          );

          if (!existingAlert) {
            const alert: CostAlert = {
              id: `alert_${Date.now()}_${threshold.id}`,
              thresholdId: threshold.id,
              currentCost: stats.total_cost,
              thresholdAmount: threshold.amount,
              percentage: Math.round(percentage),
              timeframe: threshold.timeframe,
              triggeredAt: new Date().toISOString(),
              acknowledged: false,
            };

            this.activeAlerts.push(alert);
            newAlerts.push(alert);
            await this.sendNotification(threshold, alert);
          }
        }
      } catch (error) {
        console.error(`Failed to check threshold ${threshold.id}:`, error);
      }
    }

    if (newAlerts.length > 0) {
      this.saveActiveAlerts();
    }

    return newAlerts;
  }

  async sendNotification(threshold: CostThreshold, alert: CostAlert): Promise<void> {
    const message = this.formatAlertMessage(threshold, alert);

    switch (threshold.notificationMethod) {
      case 'email':
        if (threshold.emailAddress) {
          await this.sendEmailAlert(threshold.emailAddress, message, alert);
        }
        break;
      
      case 'webhook':
        if (threshold.webhookUrl) {
          await this.sendWebhookAlert(threshold.webhookUrl, alert);
        }
        break;
      
      case 'dashboard':
        // Dashboard alerts are handled by the UI
        console.warn('AI Cost Alert:', message);
        break;
    }
  }

  private formatAlertMessage(threshold: CostThreshold, alert: CostAlert): string {
    return `🚨 AI Cost Alert: ${threshold.name}
    
Current cost: $${alert.currentCost.toFixed(4)}
Threshold: $${alert.thresholdAmount}
Percentage: ${alert.percentage}%
Timeframe: ${alert.timeframe}
Triggered: ${new Date(alert.triggeredAt).toLocaleString()}

Please review your AI usage and consider implementing cost controls.`;
  }

  private async sendEmailAlert(email: string, message: string, alert: CostAlert): Promise<void> {
    try {
      // This would integrate with your email service (SendGrid, etc.)
      
      // Example API call:
      // await fetch('/api/notifications/email', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     to: email,
      //     subject: 'AI Cost Alert - Threshold Exceeded',
      //     message: message,
      //     alert: alert
      //   })
      // });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  private async sendWebhookAlert(webhookUrl: string, alert: CostAlert): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ai_cost_alert',
          alert: alert,
          timestamp: new Date().toISOString(),
        })
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  getActiveAlerts(): CostAlert[] {
    return this.activeAlerts.filter(alert => !alert.acknowledged);
  }

  acknowledgeAlert(alertId: string): void {
    const alert = this.activeAlerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.saveActiveAlerts();
    }
  }

  dismissAlert(alertId: string): void {
    this.activeAlerts = this.activeAlerts.filter(a => a.id !== alertId);
    this.saveActiveAlerts();
  }

  getThresholds(): CostThreshold[] {
    return [...this.thresholds];
  }

  updateThreshold(threshold: CostThreshold): void {
    const index = this.thresholds.findIndex(t => t.id === threshold.id);
    if (index >= 0) {
      this.thresholds[index] = threshold;
    } else {
      this.thresholds.push(threshold);
    }
    this.saveThresholds();
  }

  deleteThreshold(thresholdId: string): void {
    this.thresholds = this.thresholds.filter(t => t.id !== thresholdId);
    this.saveThresholds();
  }

  // Get spending velocity (cost per hour) to predict when thresholds will be hit
  async getSpendingVelocity(): Promise<{
    hourlyRate: number;
    projectedDaily: number;
    projectedWeekly: number;
    projectedMonthly: number;
  }> {
    try {
      const hourlyStats = await aiUsageTracker.getUsageStats('hour');
      const dailyStats = await aiUsageTracker.getUsageStats('day');
      
      const hourlyRate = hourlyStats.total_cost;
      const avgHourlyFromDaily = dailyStats.total_cost / 24;
      
      // Use the higher rate for conservative projection
      const effectiveHourlyRate = Math.max(hourlyRate, avgHourlyFromDaily);
      
      return {
        hourlyRate: effectiveHourlyRate,
        projectedDaily: effectiveHourlyRate * 24,
        projectedWeekly: effectiveHourlyRate * 24 * 7,
        projectedMonthly: effectiveHourlyRate * 24 * 30,
      };
    } catch (error) {
      console.error('Failed to calculate spending velocity:', error);
      return {
        hourlyRate: 0,
        projectedDaily: 0,
        projectedWeekly: 0,
        projectedMonthly: 0,
      };
    }
  }
}

// Global instance
export const costAlertManager = new CostAlertManager();

// Auto-check thresholds every 10 minutes
if (typeof window !== 'undefined') {
  setInterval(async () => {
    try {
      await costAlertManager.checkAllThresholds();
    } catch (error) {
      console.error('Failed to check cost thresholds:', error);
    }
  }, 10 * 60 * 1000); // 10 minutes
}