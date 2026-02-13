"use client";

import { useState } from "react";
import { Bell, Send, Info, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { sendBroadcastNotification, NotificationType } from "@/lib/actions/notifications.actions";

export default function AdminNotificationsClient() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<NotificationType>("info");
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSend = async () => {
    if (!title || !body) {
      showToast("Title and Body are required", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await sendBroadcastNotification({
        type,
        title,
        body,
        link: link || undefined,
      });

      if (result.success) {
        showToast(`Successfully sent notification to ${result.count} users`, "success");
        setTitle("");
        setBody("");
        setLink("");
      } else {
        showToast(result.error || "Failed to send notification", "error");
      }
    } catch (error) {
      console.error(error);
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <Bell className="w-8 h-8 text-indigo-600" />
          Push Notifications
        </h1>
        <p className="text-gray-500">
          Send a broadcast notification to all users. This will appear as a push notification on their devices and an in-app alert.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-indigo-50/50">
              <CardTitle className="text-lg text-indigo-900">Message Details</CardTitle>
              <CardDescription>Compose your notification message below.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notification Title</label>
                <Input
                  placeholder="e.g. Price Drop Alert! 📉"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Message Body</label>
                <Textarea
                  placeholder="e.g. Some of your favorite items are now 20% off. Shop now!"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="border-gray-200"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <Select value={type} onValueChange={(val: NotificationType) => setType(val)}>
                    <SelectTrigger className="border-gray-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-blue-500" />
                          <span>Information</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="warning">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span>Warning</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="error">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span>Alert / Urgency</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Action Link (Optional)</label>
                  <Input
                    placeholder="/shop or https://..."
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    className="border-gray-200"
                  />
                </div>
              </div>

              <Button
                onClick={handleSend}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Sending to all users...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Broadcast Notification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div className="space-y-6">
          <Card className="border-gray-100 bg-gray-50/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Live Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-w-[280px] mx-auto">
                <div className="bg-gray-800 p-2 flex items-center justify-between">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">Mobile Preview</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 p-2 rounded-lg">
                      <Bell className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {title || "Notification Title"}
                      </p>
                      <p className="text-[10px] text-gray-500 line-clamp-2">
                        {body || "Your message will appear here. Keep it concise and engaging!"}
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        type === 'info' ? 'bg-blue-500 w-1/3' : 
                        type === 'warning' ? 'bg-orange-500 w-2/3' : 'bg-red-500 w-full'
                      }`} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-3 text-xs text-gray-600">
                  <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p>Broadcasts take a few minutes to reach all devices depending on the user count.</p>
                </div>
                <div className="flex items-start gap-3 text-xs text-gray-600">
                  <Send className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <p>In-app notifications appear instantly for currently active users.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
