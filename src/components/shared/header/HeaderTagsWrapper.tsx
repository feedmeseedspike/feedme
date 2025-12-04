"use client";

import React from "react";
import clsx from "clsx";

interface HeaderTagsWrapperProps {
  children: React.ReactNode;
}

const SCROLL_DELTA_THRESHOLD = 6;
const SHOW_NEAR_TOP = 120;

const HeaderTagsWrapper = ({ children }: HeaderTagsWrapperProps) => {
  const [isHidden, setIsHidden] = React.useState(false);
  const [hasShadow, setHasShadow] = React.useState(false);
  const [stickyOffset, setStickyOffset] = React.useState(72);
  const lastScrollY = React.useRef(0);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const headerEl = document.querySelector("header");

    const computeOffset = () => {
      if (!headerEl) return;
      const { height } = headerEl.getBoundingClientRect();
      setStickyOffset(Math.max(56, Math.round(height)));
    };

    computeOffset();
    window.addEventListener("resize", computeOffset);
    return () => window.removeEventListener("resize", computeOffset);
  }, []);

  React.useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      lastScrollY.current = current;

      if (current <= SHOW_NEAR_TOP) {
        setIsHidden(false);
      } else if (delta > SCROLL_DELTA_THRESHOLD) {
        setIsHidden(true);
      } else if (delta < -SCROLL_DELTA_THRESHOLD) {
        setIsHidden(false);
      }

      setHasShadow(current > stickyOffset * 0.4);
    };

    const onScroll = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = window.requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll();

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      window.removeEventListener("scroll", onScroll);
    };
  }, [stickyOffset]);

  return (
    <div className="hidden md:block">
    <div
        className={clsx(
          "sticky z-40 w-full transition-transform duration-300 ease-out",
          isHidden ? "-translate-y-full opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
        )}
        style={{ top: stickyOffset }}
      >
        <div
          className={clsx(
            "bg-white/95 backdrop-blur border-b border-gray-100 py-2",
            hasShadow && "shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
          )}
    >
      {children}
        </div>
      </div>
    </div>
  );
};

export default HeaderTagsWrapper;
