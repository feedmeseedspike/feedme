"use client";

import React from "react";
import { useNotifications } from "src/hooks/useNotifications";
import { useUser } from "src/hooks/useUser";
import { 
  Bell, 
  Info, 
  AlertTriangle, 
  X, 
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Trash2,
  AlertCircle
} from "lucide-react";
import { Button } from "@components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "src/components/ui/dialog";
import { Separator } from "@components/ui/separator";
import { cn } from "src/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { dismissAllNotificationsAction } from "src/lib/actions/notifications.actions";

export default function NotificationsPage() {
  const { user } = useUser();
  const { 
    notifications, 
    unreadCount, 
    dismissNotification, 
    isLoading,
    refresh
  } = useNotifications(user?.user_id);

  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const handleClearAll = async () => {
    const result = await dismissAllNotificationsAction();
    if (result.success) {
      refresh();
      setIsConfirmOpen(false);
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "error":
        return "bg-red-50 text-red-600 border-red-100";
      case "warning":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "info":
      default:
        return "bg-blue-50 text-blue-600 border-blue-100";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[#1B6013]/5 flex items-center justify-center border border-[#1B6013]/10">
            <Bell className="h-6 w-6 text-[#1B6013]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">
              Notifications
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              Stay updated with your latest alerts and activities
            </p>
          </div>
        </div>
        
        {notifications.length > 0 && (
          <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 font-bold uppercase tracking-widest text-xs h-11 px-6 rounded-2xl transition-all"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black uppercase italic italic text-gray-900">Clear all notifications?</DialogTitle>
                <DialogDescription className="text-gray-500 font-medium pt-2">
                  This will permanently dismiss all your current notifications. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex gap-2 sm:gap-0 pt-4">
                <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px]">
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleClearAll} className="bg-red-500 hover:bg-red-600 rounded-xl font-bold uppercase tracking-widest text-[10px] px-8">
                  Yes, Clear All
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Content Section */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[500px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="h-10 w-10 border-4 border-[#1B6013] border-t-transparent animate-spin rounded-full" />
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">
              Fetching updates...
            </p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-6 ring-8 ring-gray-200/20">
              <CheckCircle2 className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase italic mb-2 tracking-tight">
              You&apos;re All Caught Up
            </h3>
            <p className="text-gray-400 max-w-sm font-medium leading-relaxed">
              No new notifications at the moment. We&apos;ll ping you when something important happens!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification, index) => (
              <div 
                key={notification.id} 
                className={cn(
                  "relative group px-6 sm:px-8 py-6 transition-all hover:bg-gray-50/80",
                  index === 0 && "hover:rounded-t-[2.5rem]",
                  index === notifications.length - 1 && "hover:rounded-b-[2.5rem]"
                )}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  <div className={cn(
                    "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-300",
                    getTypeStyles(notification.type)
                  )}>
                    {getIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-lg font-bold text-gray-900 leading-snug tracking-tight">
                        {notification.body}
                      </p>
                      <button 
                        onClick={() => dismissNotification(notification.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-red-100"
                        title="Dismiss"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </span>
                      
                      {notification.link && (
                        <Link 
                          href={notification.link} 
                          className="inline-flex items-center gap-2 text-xs font-black text-[#1B6013] hover:text-[#144a0e] uppercase tracking-widest group/link transition-all"
                        >
                          View Activity
                          <ExternalLink className="h-3 w-3 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-[#1B6013] p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-125 transition-transform duration-700">
           <Bell className="h-40 w-40" />
        </div>
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <h3 className="text-xl font-black uppercase italic tracking-tighter">Stay Connected</h3>
          <p className="text-white/80 font-medium max-w-md">
            Enable browser notifications in your settings to get real-time price alerts, order updates, and new blog posts.
          </p>
        </div>
        <div className="md:ml-auto relative z-10 shrink-0">
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 px-8 h-12 rounded-xl font-bold uppercase tracking-widest text-xs">
            Push Notification Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
