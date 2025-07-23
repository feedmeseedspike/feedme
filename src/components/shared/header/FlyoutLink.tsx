import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface FlyoutLinkProps {
  children: React.ReactNode;
  href?: string;
  FlyoutContent: React.ComponentType<any>;
  flyoutProps?: any;
  className?: string;
  flyoutPosition?: "absolute" | "static";
  flyoutClassName?: string;
}

const FlyoutLink: React.FC<FlyoutLinkProps> = ({
  children,
  FlyoutContent,
  flyoutProps,
  className,
  flyoutPosition = "absolute",
  flyoutClassName,
}) => {
  const [open, setOpen] = useState(false);
  const showFlyout = !!FlyoutContent && open;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative w-fit h-fit"
    >
      <button
        type="button"
        className={className ? className : "relative text-white no-underline"}
      >
        {children}
      </button>
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={
              flyoutPosition === "absolute" && !flyoutClassName
                ? { translateX: "-50%" }
                : {}
            }
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={
              flyoutClassName
                ? flyoutClassName
                : flyoutPosition === "absolute"
                  ? "absolute left-1/2 top-12 bg-white text-black z-50 rounded-xl shadow-xl"
                  : "static bg-white text-black z-50 rounded-xl shadow-xl"
            }
          >
            {flyoutPosition === "absolute" && !flyoutClassName && (
              <div className="absolute -top-6 left-0 right-0 h-6 bg-transparent" />
            )}
            {flyoutPosition === "absolute" && !flyoutClassName && (
              <div className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white" />
            )}
            <FlyoutContent {...flyoutProps} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlyoutLink;
