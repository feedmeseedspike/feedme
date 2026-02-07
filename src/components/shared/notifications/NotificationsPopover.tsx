"use client";

import { useState } from "react";
import { Bell, Info, AlertTriangle, X, Check, ExternalLink } from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@components/ui/popover";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import { useNotifications } from "src/hooks/useNotifications";
import { cn } from "src/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { dismissAllNotificationsAction } from "src/lib/actions/notifications.actions";

interface NotificationsPopoverProps {
  userId: string | undefined;
}

export function NotificationsPopover({ userId }: NotificationsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, dismissNotification, isLoading, refresh } = useNotifications(userId);

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
        return <AlertTriangle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-white hover:bg-white/10 rounded-full h-10 w-10 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#1B6013]">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 sm:w-96 rounded-2xl shadow-2xl border-gray-100 overflow-hidden" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50/50">
          <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                {unreadCount} New
              </span>
            )}
          </h3>
          {notifications.length > 0 && (
             <Button 
               variant="ghost" 
               size="sm" 
               className="h-8 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-900" 
               onClick={async () => {
                 const result = await dismissAllNotificationsAction();
                 if (result.success) {
                   refresh();
                 }
               }}
             >
                Clear All
             </Button>
          )}
        </div>
        <Separator />
        
        <div className="h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
               <div className="h-5 w-5 border-2 border-[#1B6013] border-t-transparent animate-spin rounded-full" />
               <p className="text-xs text-gray-400 font-medium">Checking updates...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 p-8 text-center bg-white">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                 <Bell className="h-6 w-6 text-gray-200" />
              </div>
              <p className="font-bold text-gray-900 text-sm">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">You don&apos;t have any new notifications at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={cn(
                    "relative group px-4 py-4 transition-colors hover:bg-gray-50",
                    !notification.dismissed && "bg-white"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                      getTypeStyles(notification.type)
                    )}>
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium text-gray-900 leading-snug pr-6">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] text-gray-400 font-medium lowercase">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                         </span>
                         {notification.link && (
                           <Link 
                            href={notification.link} 
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1B6013] hover:underline uppercase tracking-wider"
                            onClick={() => {
                                setIsOpen(false);
                                dismissNotification(notification.id);
                            }}
                           >
                              View Details
                              <ExternalLink className="h-2.5 w-2.5" />
                           </Link>
                         )}
                      </div>
                    </div>
                    <button 
                      onClick={() => dismissNotification(notification.id)}
                      className="absolute top-4 right-4 text-gray-300 hover:text-gray-900 transition-colors bg-white group-hover:bg-gray-50 rounded p-0.5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 5 && (
           <>
            <Separator />
            <div className="p-2 bg-gray-50/30">
                <Button variant="ghost" className="w-full text-[10px] font-black uppercase tracking-widest text-[#1B6013] h-10 hover:bg-gray-100" asChild>
                    <Link href="/account/notifications">View All Notifications</Link>
                </Button>
            </div>
           </>
        )}
      </PopoverContent>
    </Popover>
  );
}
