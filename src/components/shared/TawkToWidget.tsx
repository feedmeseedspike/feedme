"use client";

import { useEffect } from "react";

const TawkToWidget = () => {
  useEffect(() => {
    // Load TawkTo script
    const s1 = document.createElement("script");
    s1.async = true;
    s1.src = "https://embed.tawk.to/YOUR_TAWKTO_ID/default";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    document.head.appendChild(s1);

    return () => {
      // Cleanup script on unmount
      document.head.removeChild(s1);
    };
  }, []);

  return null;
};

export default TawkToWidget;
