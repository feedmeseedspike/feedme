"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import NewVisitorModal from "./NewVisitorModal";
import { usePathname } from "next/navigation";

interface NewVisitorProviderProps {
  children: React.ReactNode;
}

export function NewVisitorProvider({ children }: NewVisitorProviderProps) {
  const { user, isLoading } = useUser();
  const [showModal, setShowModal] = useState(false);
  const pathname = usePathname();
  
  // Check if we are on an auth page
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/register') || 
                     pathname?.startsWith('/forgot-password') ||
                     pathname?.includes('/auth/');

  // Only show to non-authenticated users who are NOT on auth pages
  const shouldShowModal = !isLoading && !user && !isAuthPage;

  useEffect(() => {
    if (!shouldShowModal) return;

    if (typeof window !== 'undefined') {
      // Multiple checks to prevent abuse
      const hasShown = localStorage.getItem('feedme_welcome_shown');
      const dismissed = localStorage.getItem('feedme_welcome_dismissed');
      const sessionShown = sessionStorage.getItem('feedme_modal_session');
      const justSignedUp = new URLSearchParams(window.location.search).get('justSignedUp');
      
      if (hasShown || sessionShown || justSignedUp) return;

      // Check if dismissed recently (within 7 days)
      let recentlyDismissed = false;
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
        recentlyDismissed = hoursSinceDismissed < 168; 
      }
      
      if (recentlyDismissed) return;
      
      // Mark session to prevent showing again in same session
      sessionStorage.setItem('feedme_modal_session', 'true');
      
      // Removed automatic timer to reduce annoyance. 
      // This provider can now be used for exit-intent or manual triggers.
    }
  }, [shouldShowModal]);

  const handleClose = () => {
    setShowModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedme_welcome_dismissed', Date.now().toString());
    }
  };

  return (
    <>
      {children}
      {shouldShowModal && (
        <NewVisitorModal
          isOpen={showModal}
          onClose={handleClose}
        />
      )}
    </>
  );
}

export default NewVisitorProvider;
