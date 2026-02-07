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
  const [isClicked, setIsClicked] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close when clicking outside and reset clicked state
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setIsClicked(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const showFlyout = !!FlyoutContent && open;

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => !isClicked && setOpen(true)}
      onMouseLeave={() => !isClicked && setOpen(false)}
      className="relative w-fit h-fit"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          const nextState = !isClicked;
          setIsClicked(nextState);
          setOpen(true); // Always ensure it's open when clicked, or toggle
          if (!nextState) setOpen(false); // If we are un-clicking, close it
        }}
        className="cursor-pointer"
      >
        <button
          type="button"
          className={className ? className : "relative text-white no-underline"}
          style={{ pointerEvents: "none" }} // Let the parent div handle the click for better hit area
        >
          {children}
        </button>
      </div>
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
            <FlyoutContent 
                {...flyoutProps} 
                closeFlyout={() => {
                    setOpen(false);
                    setIsClicked(false);
                }} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlyoutLink;
