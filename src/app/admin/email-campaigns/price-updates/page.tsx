"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, UploadCloud, Send, Users, RefreshCcw, MousePointerClick, Eye, BarChart3 } from "lucide-react";

interface Subscription {
  id: string;
  email: string;
  full_name: string | null;
  segments: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UploadResult {
  captureDate: string;
  snapshotRows: number;
  changeEvents: number;
}

export default function PriceUpdateAdminPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [captureDate, setCaptureDate] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const [testEmail, setTestEmail] = useState("oyedelejeremiah.ng@gmail.com");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Tracking state
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    loadSubscriptions();
    loadTrackingData();
  }, []);

  async function loadTrackingData(captureDate?: string) {
    setLoadingTracking(true);
    try {
      const url = captureDate
        ? `/api/admin/price-updates/tracking?captureDate=${captureDate}`
        : "/api/admin/price-updates/tracking";
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to load tracking data");
      setTrackingData(data);
    } catch (err: any) {
      console.error("Failed to load tracking data", err);
    } finally {
      setLoadingTracking(false);
    }
  }

  async function loadSubscriptions() {
    setLoadingSubs(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/price-updates/subscriptions");
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to load subscribers");
      setSubscriptions(data.subscriptions ?? []);
    } catch (err: any) {
      setError(err?.message || "Failed to load subscribers");
    } finally {
      setLoadingSubs(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      setError("Select a CSV file exported from the price sheet");
      return;
    }
    setUploading(true);
    setError(null);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (captureDate) {
        formData.append("captureDate", captureDate);
      }
      const res = await fetch("/api/admin/price-updates/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Upload failed");
              setUploadResult({
                captureDate: data.captureDate,
                snapshotRows: data.snapshotRows,
                changeEvents: data.changeEvents,
              });
              // Refresh tracking data for the uploaded date
              if (data.captureDate) {
                await loadTrackingData(data.captureDate);
              }
    } catch (err: any) {
      setError(err?.message || "Failed to upload price sheet");
    } finally {
      setUploading(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail || !testEmail.includes("@")) {
      setError("Enter a valid test email");
      return;
    }
    setSendingTest(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/price-updates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: [testEmail] }),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to send test email");
      alert(`Test email sent for ${data.result.captureDate}`);
      // Refresh tracking data to show the sent event
      await loadTrackingData();
    } catch (err: any) {
      setError(err?.message || "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function handleSendAll() {
    if (!subscriptions.length) {
      setError("No subscribers available yet. Sync customers first.");
      return;
    }
    if (!confirm("Send price update email to all active subscribers?")) {
      return;
    }
    setSendingAll(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/price-updates/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to send emails");
      alert(`Sent ${data.result.sent} emails for ${data.result.captureDate}`);
      // Refresh tracking data to show the sent events
      await loadTrackingData();
    } catch (err: any) {
      setError(err?.message || "Failed to send price update");
    } finally {
      setSendingAll(false);
    }
  }

  async function handleSyncCustomers() {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/price-updates/sync-customers", {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to sync customers");
      await loadSubscriptions();
      alert(`Synced ${data.synced} customer emails`);
    } catch (err: any) {
      setError(err?.message || "Failed to sync customers");
    } finally {
      setSyncing(false);
    }
  }

  const activeCount = useMemo(
    () => subscriptions.filter((sub) => sub.is_active).length,
    [subscriptions]
  );

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="container max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-3xl font-semibold text-[#1B6013]">
            Price Update Automation
          </h1>
          <p className="text-sm text-slate-600">
            Upload the latest price sheet, sync customer recipients, and send
            WhatsApp-style price alerts by email.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" /> Active Subscribers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-slate-800">
                {activeCount}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sync customers to populate this list automatically.
              </p>
              <Button
                className="mt-4 w-full"
                variant="outline"
                onClick={handleSyncCustomers}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}{" "}
                Sync customers
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <UploadCloud className="h-4 w-4" /> Upload Price Sheet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                type="file"
                accept=".csv"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <Input
                placeholder="Capture date (YYYY-MM-DD)"
                value={captureDate}
                onChange={(event) => setCaptureDate(event.target.value)}
              />
              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={uploading || !file}
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {uploading ? "Uploading..." : "Process CSV"}
              </Button>
              {uploadResult && (
                <div className="rounded-md bg-green-50 px-3 py-2 text-xs text-green-700">
                  Processed {uploadResult.snapshotRows} rows ·{" "}
                  {uploadResult.changeEvents} change events · Capture{" "}
                  {uploadResult.captureDate}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Send className="h-4 w-4" /> Send Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Test email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSendTest}
                disabled={sendingTest}
              >
                {sendingTest ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {sendingTest ? "Sending test..." : "Send test email"}
              </Button>
              <Button
                className="w-full bg-[#1B6013] hover:bg-[#1B6013]/90"
                onClick={handleSendAll}
                disabled={sendingAll || !subscriptions.length}
              >
                {sendingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {sendingAll ? "Sending to all..." : "Send to all subscribers"}
              </Button>
              <p className="text-xs text-slate-500">
                Test emails bypass the subscriber list and send only to the
                address above.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <CardTitle>Subscribers</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadSubscriptions}
                disabled={loadingSubs}
              >
                {loadingSubs ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loadingSubs ? (
              <div className="flex items-center gap-2 p-6 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
                subscribers...
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                No subscribers yet. Use “Sync customers” to populate from your
                customer base.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">
                      Name
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">
                      Segments
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-slate-600">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {subscriptions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {sub.email}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {sub.full_name || "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-600">
                        {sub.segments?.length ? (
                          <div className="flex flex-wrap gap-2">
                            {sub.segments.map((segment) => (
                              <Badge key={segment} variant="secondary">
                                {segment}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">none</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={sub.is_active ? "default" : "secondary"}
                        >
                          {sub.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {new Date(
                          sub.updated_at || sub.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Email Tracking Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" /> Email Tracking Analytics
              </CardTitle>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    if (e.target.value) {
                      loadTrackingData(e.target.value);
                    } else {
                      loadTrackingData();
                    }
                  }}
                  className="w-40"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadTrackingData(selectedDate || undefined)}
                  disabled={loadingTracking}
                >
                  {loadingTracking ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCcw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingTracking ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-[#1B6013]" />
              </div>
            ) : trackingData?.metrics ? (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="text-xs text-slate-500 mb-1">Emails Sent</div>
                    <div className="text-2xl font-semibold text-slate-800">
                      {trackingData.metrics.sent}
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Opens
                    </div>
                    <div className="text-2xl font-semibold text-blue-700">
                      {trackingData.metrics.opens}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {trackingData.metrics.openRate}% open rate
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-xs text-green-600 mb-1 flex items-center gap-1">
                      <MousePointerClick className="h-3 w-3" /> Clicks
                    </div>
                    <div className="text-2xl font-semibold text-green-700">
                      {trackingData.metrics.clicks}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {trackingData.metrics.clickRate}% click rate
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-xs text-purple-600 mb-1">CTR</div>
                    <div className="text-2xl font-semibold text-purple-700">
                      {trackingData.metrics.sent > 0
                        ? Math.round(
                            (trackingData.metrics.clicks / trackingData.metrics.sent) *
                              100 *
                              10
                          ) / 10
                        : 0}
                      %
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Click-to-send ratio
                    </div>
                  </div>
                </div>

                {/* User Activity Table */}
                {trackingData.userActivity?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">
                      User Activity
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">
                              Email
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">
                              Sent
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">
                              Opens
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">
                              Clicks
                            </th>
                            <th className="px-4 py-2 text-left font-medium text-slate-600">
                              Last Activity
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          {trackingData.userActivity.map((user: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 font-medium text-slate-800">
                                {user.email}
                              </td>
                              <td className="px-4 py-2 text-slate-600">
                                <Badge variant="outline">{user.sent || 0}</Badge>
                              </td>
                              <td className="px-4 py-2 text-slate-600">
                                <Badge variant="secondary">{user.opens || 0}</Badge>
                              </td>
                              <td className="px-4 py-2 text-slate-600">
                                <Badge
                                  variant={
                                    user.clicks > 0 ? "default" : "secondary"
                                  }
                                >
                                  {user.clicks || 0}
                                </Badge>
                              </td>
                              <td className="px-4 py-2 text-xs text-slate-500">
                                {new Date(user.lastActivity).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(!trackingData.userActivity || trackingData.userActivity.length === 0) && (
                  <div className="text-center py-8 text-sm text-slate-500">
                    No tracking data available yet. Send an email campaign to see
                    analytics.
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-sm text-slate-500">
                No tracking data available.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
