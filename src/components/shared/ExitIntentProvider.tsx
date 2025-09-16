"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import NewVisitorModal from "./NewVisitorModal";

interface NewVisitorProviderProps {
  children: React.ReactNode;
}

export function NewVisitorProvider({ children }: NewVisitorProviderProps) {
  const { user, isLoading } = useUser();
  const [showModal, setShowModal] = useState(false);
  
  // Only show to non-authenticated users
  const shouldShowModal = !isLoading && !user;

  useEffect(() => {
    if (!shouldShowModal) return;

    if (typeof window !== 'undefined') {
      // Multiple checks to prevent abuse
      const hasShown = localStorage.getItem('feedme_welcome_shown');
      const dismissed = localStorage.getItem('feedme_welcome_dismissed');
      const sessionShown = sessionStorage.getItem('feedme_modal_session');
      const justSignedUp = new URLSearchParams(window.location.search).get('justSignedUp');
      
      // Check if dismissed recently (within 24 hours)
      let recentlyDismissed = false;
      if (dismissed) {
        const dismissedTime = parseInt(dismissed);
        const now = Date.now();
        const hoursSinceDismissed = (now - dismissedTime) / (1000 * 60 * 60);
        recentlyDismissed = hoursSinceDismissed < 24;
      }
      
      // Don't show if any condition is met
      if (hasShown || recentlyDismissed || sessionShown || justSignedUp) return;
      
      // Mark session to prevent showing again in same session
      sessionStorage.setItem('feedme_modal_session', 'true');
      
      // Show modal after 5 seconds delay
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 5000);

      return () => clearTimeout(timer);
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