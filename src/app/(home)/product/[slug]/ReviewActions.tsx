"use client";

import { useState } from "react";
import { toast } from "sonner"; // Notification library

type ReviewActionsProps = {
  initialHelpfulCount?: number;
};

export default function ReviewActions({ initialHelpfulCount = 0 }: ReviewActionsProps) {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [isHelpful, setIsHelpful] = useState(false);
  const [reported, setReported] = useState(false);

  const handleHelpful = () => {
    if (isHelpful) {
      setHelpfulCount(helpfulCount - 1);
      toast.info("Removed from helpful");
    } else {
      setHelpfulCount(helpfulCount + 1);
      toast.success("Marked as helpful!");
    }
    setIsHelpful(!isHelpful);
  };

  const handleReport = () => {
    if (reported) return toast.warning("Already reported");
    const reason = prompt("Enter your report reason:");
    if (!reason) return;

    setReported(true);
    toast.success("Report submitted!");
  };

  return (
    <>
      <button
        className={`border border-[#188C8C] rounded-[100px] px-8 py-[6px] text-[13px] transition-colors ${
          isHelpful ? "bg-[#12B76A] text-white" : "hover:bg-[#12B76A] hover:text-white"
        }`}
        onClick={handleHelpful}
      >
        Helpful ({helpfulCount})
      </button>
      <div
        className={`h5-light cursor-pointer ${reported ? "text-red-500" : "hover:underline"}`}
        onClick={handleReport}
      >
        {reported ? "Reported" : "Report"}
      </div>
    </>
  );
}
