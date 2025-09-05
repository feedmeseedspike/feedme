"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { cn } from "src/lib/utils";

type NudgeKind = "product" | "bundle" | "offer";

interface AISmartNudgeProps {
  kind: NudgeKind;
  title?: string;
  productOrBundleName?: string;
  inSeason?: boolean | null;
}

const STORAGE_KEY = "ai_nudge_dismissed";

export default function AISmartNudge({ kind, title, productOrBundleName, inSeason }: AISmartNudgeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem(STORAGE_KEY);
      if (!dismissed) setVisible(true);
    } catch {}
  }, []);

  const { message, actions } = useMemo(() => {
    if (kind === "bundle") {
      return {
        message: `Want a quick meal plan for ${productOrBundleName || "this bundle"}?`,
        actions: [
          { label: "Generate recipes", prefill: `Generate 3 recipes using ${productOrBundleName || "this bundle"} with steps and timing.` },
          { label: "Cooking timeline", prefill: `Create a 30-minute cooking timeline for ${productOrBundleName || "this bundle"}.` },
        ],
      };
    }
    if (kind === "offer") {
      return {
        message: `Curious how much you save with this offer?`,
        actions: [
          { label: "Savings breakdown", prefill: `Show savings breakdown vs buying items separately for this offer.` },
          { label: "Compare options", prefill: `Compare this offer with similar bundles and products.` },
        ],
      };
    }
    // product default
    if (inSeason === false) {
      return {
        message: `${productOrBundleName || "This product"} is out of season. Want alternatives?`,
        actions: [
          { label: "Find alternatives", prefill: `Suggest in-season alternatives to ${productOrBundleName || "this product"} with prices.` },
          { label: "Substitutions", prefill: `What are good substitutions for ${productOrBundleName || "this product"}?` },
        ],
      };
    }
    return {
      message: `Want cooking tips for ${productOrBundleName || "this item"}?`,
      actions: [
        { label: "Cooking tips", prefill: `Give concise cooking tips for ${productOrBundleName || "this item"}.` },
        { label: "Pairings", prefill: `What pairs well with ${productOrBundleName || "this item"}?` },
      ],
    };
  }, [kind, productOrBundleName, inSeason]);

  if (!visible) return null;

  const dispatchPrefill = (prefill: string) => {
    try {
      window.dispatchEvent(new CustomEvent("aiPrefill", { detail: { message: prefill } }));
    } catch {}
  };

  const dismiss = () => {
    setVisible(false);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed left-3 bottom-3 z-40 w-[260px] sm:w-[300px]",
            "rounded-xl border border-green-200 bg-white shadow-md"
          )}
        >
          <div className="p-3 flex items-start gap-2">
            <div className="shrink-0 mt-0.5 text-green-600">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-800">{message}</p>
              <div className="mt-2 flex gap-2 flex-wrap">
                {actions.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => dispatchPrefill(a.prefill)}
                    className="text-xs px-2 py-1 rounded-md border border-green-300 text-green-700 hover:bg-green-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={dismiss} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}




