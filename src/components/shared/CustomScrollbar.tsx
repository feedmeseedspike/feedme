"use client";

import React, { useEffect } from "react";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";

interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export default function CustomScrollbar({
  children,
  className = "",
  style = { maxHeight: "100vh" },
}: CustomScrollbarProps) {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      * {
        scrollbar-width: none; /* Firefox */
      }
      
      *::-webkit-scrollbar {
        display: none; /* Chrome, Safari, Edge */
      }
      
      /* For SimpleBar scrollbars */
      .simplebar-scrollbar::before {
        background-color: #1B6013 !important;
        opacity: 0.5 !important;
      }
      
      .simplebar-scrollbar.simplebar-visible::before {
        opacity: 0.7 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <SimpleBar
      style={style}
      autoHide={false}
      className={`custom-scrollbar ${className}`.trim()}
    >
      {children}
    </SimpleBar>
  );
}
