import { Metadata } from 'next';
import AIUsageDashboard from '@components/admin/AIUsageDashboard';

export const metadata: Metadata = {
  title: 'AI Analytics - Admin Dashboard',
  description: 'Monitor AI usage, costs, and performance analytics',
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function AIAnalyticsPage() {
  return (
    <div className="container mx-auto">
      <AIUsageDashboard />
    </div>
  );
}