"use client";

import { useState, useTransition } from "react";
import { Share2, Copy, Check, Loader2 } from "lucide-react";
import { createSharedCart } from "src/lib/actions/shared-cart.actions";
import { useToast } from "src/hooks/useToast";

interface ShareCartButtonProps {
  className?: string;
  /** Show an icon-only compact version (for the sidebar sheet) */
  compact?: boolean;
}

export default function ShareCartButton({
  className = "",
  compact = false,
}: ShareCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleShare = () => {
    startTransition(async () => {
      const result = await createSharedCart();

      if (!result.success) {
        showToast(result.error, "error");
        return;
      }

      try {
        if (
          typeof navigator !== "undefined" &&
          typeof (navigator as any).share === "function"
        ) {
          // Native share sheet on mobile
          await (navigator as any).share({
            title: "My FeedMe Cart 🛒",
            text: "Check out what I'm ordering from FeedMe!",
            url: result.url,
          });
        } else {
          // Fallback: clipboard copy
          await navigator.clipboard.writeText(result.url);
          setCopied(true);
          showToast("Cart link copied! Share it with anyone.", "success");
          setTimeout(() => setCopied(false), 3000);
        }
      } catch {
        // User cancelled share or clipboard failed – fallback
        try {
          await navigator.clipboard.writeText(result.url);
          setCopied(true);
          showToast("Cart link copied to clipboard!", "success");
          setTimeout(() => setCopied(false), 3000);
        } catch {
          showToast(`Share this link: ${result.url}`, "info");
        }
      }
    });
  };

  const icon = isPending ? (
    <Loader2 className="size-3.5 animate-spin" />
  ) : copied ? (
    <Check className="size-3.5 text-green-600" />
  ) : (
    <Share2 className="size-3.5" />
  );

  const label = isPending ? "Generating…" : copied ? "Copied!" : "Share cart";

  if (compact) {
    return (
      <button
        id="share-cart-btn"
        onClick={handleShare}
        disabled={isPending}
        title={label}
        className={`badge cursor-pointer w-fit select-none flex items-center gap-1.5 ${className}`}
      >
        {icon}
        {isPending ? "Generating…" : copied ? "Copied!" : "Share"}
      </button>
    );
  }

  return (
    <button
      id="share-cart-btn-full"
      onClick={handleShare}
      disabled={isPending}
      className={`flex items-center gap-2 text-sm font-bold text-[#1B6013] hover:text-[#1B6013]/80 disabled:opacity-60 transition-colors ${className}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
