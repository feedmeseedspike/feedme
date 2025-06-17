import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FlyoutLinkProps {
  children: React.ReactNode;
  href?: string;
  FlyoutContent: React.ComponentType<any>;
  flyoutProps?: any;
}

const FlyoutLink: React.FC<FlyoutLinkProps> = ({
  children,
  href = "#",
  FlyoutContent,
  flyoutProps,
}) => {
  const [open, setOpen] = useState(false);
  const showFlyout = !!FlyoutContent && open;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative w-fit h-fit"
    >
      <a href={href} className="relative text-white no-underline">
        {children}
      </a>
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ translateX: "-50%" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute left-1/2 top-12 bg-white text-black z-50 rounded-xl shadow-xl"
          >
            <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
            <FlyoutContent {...flyoutProps} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlyoutLink;
