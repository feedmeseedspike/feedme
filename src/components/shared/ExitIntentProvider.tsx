"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/useUser";
import EidFestivalModal from "./EidFestivalModal";
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

  // Show to ALL users (logged in or not) who are NOT on auth pages
  const shouldShowModal = !isLoading && !isAuthPage;

  useEffect(() => {
    if (!shouldShowModal) return;

    if (typeof window !== 'undefined') {
      const shown = localStorage.getItem('feedme_eid_shown');
      const dismissed = localStorage.getItem('feedme_eid_dismissed');
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      // If already shown once or dismissed within the last 24 hours, don't show
      if (shown === 'true') return;
      if (dismissed && (now - parseInt(dismissed)) < twentyFourHours) return;

      setShowModal(true);
    }
  }, [shouldShowModal]);

  const handleClose = () => {
    setShowModal(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('feedme_eid_dismissed', Date.now().toString());
    }
  };

  return (
    <>
      {children}
      {shouldShowModal && (
        <EidFestivalModal
          isOpen={showModal}
          onClose={handleClose}
          isLoggedIn={!!user}
        />
      )}
    </>
  );
}

export default NewVisitorProvider;
