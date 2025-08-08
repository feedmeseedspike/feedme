"use client";

import { AnimatePresence, motion, Variants } from "framer-motion";
import React, { ReactNode, useState, createContext, useContext } from "react";
import { cn } from "src/lib/utils";

interface ExpandableContextType {
  isExpanded: boolean;
  toggle: () => void;
}

const ExpandableContext = createContext<ExpandableContextType | undefined>(
  undefined
);

const useExpandable = () => {
  const context = useContext(ExpandableContext);
  if (!context) {
    throw new Error("useExpandable must be used within an ExpandableProvider");
  }
  return context;
};

interface ExpandableProps {
  children: ReactNode;
  className?: string;
  defaultExpanded?: boolean;
}

const Expandable: React.FC<ExpandableProps> = ({
  children,
  className,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggle = () => setIsExpanded(!isExpanded);

  return (
    <ExpandableContext.Provider value={{ isExpanded, toggle }}>
      <div className={cn("w-full", className)}>{children}</div>
    </ExpandableContext.Provider>
  );
};

interface ExpandableTriggerProps {
  children: ReactNode;
  className?: string;
}

const ExpandableTrigger: React.FC<ExpandableTriggerProps> = ({
  children,
  className,
}) => {
  const { toggle } = useExpandable();

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded",
        className
      )}
    >
      {children}
    </button>
  );
};

interface ExpandableContentProps {
  children: ReactNode;
  className?: string;
}

const expandVariants: Variants = {
  expanded: {
    height: "auto",
    opacity: 1,
    scale: 1,
    transition: {
      height: {
        type: "spring",
        bounce: 0.3,
        duration: 0.8,
      },
      opacity: {
        ease: "easeInOut" as const,
        duration: 0.5,
      },
      scale: {
        type: "spring",
        bounce: 0.5,
        duration: 0.3,
      },
    },
  },
  collapsed: {
    height: 0,
    opacity: 0,
    scale: 0.8,
    transition: {
      height: {
        type: "spring",
        bounce: 0.3,
        duration: 0.8,
      },
      opacity: {
        ease: "easeInOut" as const,
        duration: 0.3,
      },
      scale: {
        ease: "easeInOut" as const,
        duration: 0.2,
      },
    },
  },
};

const ExpandableContent: React.FC<ExpandableContentProps> = ({
  children,
  className,
}) => {
  const { isExpanded } = useExpandable();

  return (
    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          key="expandable-content"
          initial="collapsed"
          animate="expanded"
          exit="collapsed"
          variants={expandVariants}
          className={cn("overflow-hidden", className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { Expandable, ExpandableTrigger, ExpandableContent, useExpandable };