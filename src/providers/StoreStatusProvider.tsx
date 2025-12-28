"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { StoreSettings } from "@/lib/validator";
import { usePathname } from "next/navigation";

function parseTime(timeStr: string) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
}

function formatTime(timeStr: string) {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(h);
    date.setMinutes(m || 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function checkStoreStatus(settings?: StoreSettings | null) {
  if (!settings) return { isOpen: true, message: "" };
  
  if (settings.is_store_enabled === false) {
      return { isOpen: false, message: "Store is currently disabled." };
  }

  const now = new Date();
  const day = now.getDay(); // 0 is Sunday
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (settings.closed_days && settings.closed_days.includes(day)) {
    return { isOpen: false, message: "We are closed today." };
  }

  if (settings.open_time && settings.close_time) {
      const openMinutes = parseTime(settings.open_time);
      const closeMinutes = parseTime(settings.close_time);
      
      if (currentMinutes < openMinutes || currentMinutes >= closeMinutes) {
        return { 
            isOpen: false, 
            message: `We are closed. Open from ${formatTime(settings.open_time)} to ${formatTime(settings.close_time)}.` 
        };
      }
  }

  return { isOpen: true, message: "" };
}

const StoreStatusContext = createContext<{ 
  isOpen: boolean; 
  message: string;
  settings: StoreSettings | null;
}>({
  isOpen: true,
  message: "",
  settings: null,
});

export const useStoreStatus = () => useContext(StoreStatusContext);

export function StoreStatusProvider({ 
  children, 
  settings 
}: { 
  children: React.ReactNode; 
  settings: StoreSettings | null; 
}) {
  const [status, setStatus] = useState(checkStoreStatus(settings));
  const pathname = usePathname();

  useEffect(() => {
    setStatus(checkStoreStatus(settings));
    const interval = setInterval(() => {
      setStatus(checkStoreStatus(settings));
    }, 60000);
    return () => clearInterval(interval);
  }, [settings]);

  const isAdmin = pathname?.startsWith("/admin");

  return (
    <StoreStatusContext.Provider value={{ ...status, settings }}>
      {/* {!status.isOpen && !isAdmin && (
        <div 
          className="w-full py-3 px-4 z-[50]"
          style={{ backgroundColor: '#000000', color: 'white' }}
        >
           <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm font-medium">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
             <span>
                {status.message}
                <span className="opacity-90 font-normal ml-1">
                  {settings?.accept_orders_when_closed 
                    ? "Orders placed now will be processed when we reopen." 
                    : "The store is currently offline."}
                </span>
             </span>
           </div>
        </div>
      )} */}
      {children}
    </StoreStatusContext.Provider>
  );
}
