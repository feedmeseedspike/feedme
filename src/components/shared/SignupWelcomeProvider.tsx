"use client";

import { useState, useEffect } from "react";
import WelcomeModal from "./WelcomeModal";

interface SignupWelcomeProviderProps {
  children: React.ReactNode;
}

export function SignupWelcomeProvider({ children }: SignupWelcomeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState<{
    customerName: string;
    discountCode: string;
    discountPercentage: number;
  } | null>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle signup modal
  useEffect(() => {
    if (!mounted) return;
    
    const newSignupData = localStorage.getItem('feedme_new_signup');
    
    if (newSignupData) {
      try {
        const data = JSON.parse(newSignupData);
        setWelcomeData(data);
        
        // Show modal after a delay to ensure page is loaded
        const timer = setTimeout(() => {
          setShowModal(true);
        }, 5000); // 5 seconds after mounting
        
        // Clean up localStorage
        localStorage.removeItem('feedme_new_signup');
        
        return () => clearTimeout(timer);
      } catch (error) {
        console.error('Error parsing signup data:', error);
        localStorage.removeItem('feedme_new_signup');
      }
    }
  }, [mounted]);

  const handleClose = () => {
    setShowModal(false);
    setWelcomeData(null);
  };

  // Don't render modal until component is mounted (prevents hydration issues)
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {welcomeData && (
        <WelcomeModal
          isOpen={showModal}
          onClose={handleClose}
          customerName={welcomeData.customerName}
          discountCode={welcomeData.discountCode}
          discountPercentage={welcomeData.discountPercentage}
        />
      )}
    </>
  );
}

export default SignupWelcomeProvider;