"use client";

import { useState, useEffect, useCallback } from 'react';

interface UseExitIntentOptions {
  sensitivity?: number; // How close to the top edge (default: 20px)
  timer?: number; // Minimum time on site before showing (default: 30 seconds)
  enabled?: boolean; // Enable/disable the hook
}

export function useExitIntent(options: UseExitIntentOptions = {}) {
  const {
    sensitivity = 20,
    timer = 30000, // 30 seconds
    enabled = true,
  } = options;

  const [showExitIntent, setShowExitIntent] = useState(false);
  const [isTimeElapsed, setIsTimeElapsed] = useState(false);

  // Check if modal should be shown based on localStorage
  const shouldShowModal = useCallback(() => {
    if (typeof window === 'undefined') return false;

    // Don't show if already shown
    if (localStorage.getItem('feedme_exit_modal_shown') === 'true') {
      return false;
    }

    // Don't show if dismissed today (24 hours)
    const dismissedTime = localStorage.getItem('feedme_exit_modal_dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(parseInt(dismissedTime));
      const now = new Date();
      const hoursSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceDismissed < 24) {
        return false;
      }
    }

    // Don't show to authenticated users who already have discounts
    if (localStorage.getItem('feedme_user_authenticated') === 'true') {
      return false;
    }

    return true;
  }, []);

  // Exit intent detection
  const handleMouseLeave = useCallback((event: MouseEvent) => {
    if (!enabled || !isTimeElapsed || !shouldShowModal()) return;

    // Check if mouse is leaving from the top of the page
    if (event.clientY <= sensitivity) {
      setShowExitIntent(true);
    }
  }, [enabled, isTimeElapsed, sensitivity, shouldShowModal]);

  // Mobile touch detection (for mobile exit intent)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!enabled || !isTimeElapsed || !shouldShowModal()) return;

    // Detect rapid upward swipe (potential browser navigation)
    const touch = event.touches[0];
    if (touch && touch.clientY <= sensitivity) {
      setShowExitIntent(true);
    }
  }, [enabled, isTimeElapsed, sensitivity, shouldShowModal]);

  // ESC key detection
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled || !isTimeElapsed || !shouldShowModal()) return;

    if (event.key === 'Escape') {
      setShowExitIntent(true);
    }
  }, [enabled, isTimeElapsed, shouldShowModal]);

  useEffect(() => {
    if (!enabled) return;

    // Set timer for minimum time on site
    const timeoutId = setTimeout(() => {
      setIsTimeElapsed(true);
    }, timer);

    return () => clearTimeout(timeoutId);
  }, [enabled, timer]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Add event listeners
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleMouseLeave, handleTouchStart, handleKeyDown]);

  const resetExitIntent = useCallback(() => {
    setShowExitIntent(false);
  }, []);

  const disableExitIntent = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('feedme_exit_modal_shown', 'true');
    setShowExitIntent(false);
  }, []);

  return {
    showExitIntent,
    resetExitIntent,
    disableExitIntent,
    isTimeElapsed,
  };
}