"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowRight, Package, Share2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatNaira } from "src/lib/utils";
import { Button } from "@components/ui/button";
import { useToast } from "src/hooks/useToast";
import { useAddToCartMutation } from "src/queries/cart";
import { SharedCartItem } from "src/lib/actions/shared-cart.actions";
import Container from "@components/shared/Container";
import { useUser } from "src/hooks/useUser";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";

interface SharedCartClientProps {
  items: SharedCartItem[];
  createdAt: string;
}

export default function SharedCartClient({
  items,
  createdAt,
}: SharedCartClientProps) {
  const { showToast } = useToast();
  const { user } = useUser();
  const anonymousCart = useAnonymousCart();
  const addToCartMutation = useAddToCartMutation();

  const [addingAll, setAddingAll] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  const subtotal = items.reduce(
    (acc, item) => acc + (item.price ?? 0) * item.quantity,
    0
  );

  const sharedDate = new Date(createdAt).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const addSingleItem = async (item: SharedCartItem, idx: number) => {
    try {
      if (user) {
        await addToCartMutation.mutateAsync({
          product_id: item.product_id ?? undefined,
          bundle_id: item.bundle_id ?? undefined,
          offer_id: item.offer_id ?? undefined,
          quantity: item.quantity,
          option: item.option as any,
        });
      } else {
        await anonymousCart.addItem(
          item.product_id ?? null,
          item.quantity,
          item.price ?? 0,
          item.option as any,
          item.bundle_id ?? null,
          item.offer_id ?? null,
          { name: item.name, slug: item.slug ?? "", image: item.image ?? undefined },
          item.black_friday_item_id ?? null
        );
      }
      setAddedIds((prev) => new Set(prev).add(idx));
      showToast(`${item.name} added to cart!`, "success");
    } catch (e: any) {
      showToast(e?.message || `Failed to add ${item.name}`, "error");
    }
  };

  const addAllToCart = async () => {
    setAddingAll(true);
    let successCount = 0;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (user) {
          await addToCartMutation.mutateAsync({
            product_id: item.product_id ?? undefined,
            bundle_id: item.bundle_id ?? undefined,
            offer_id: item.offer_id ?? undefined,
            quantity: item.quantity,
            option: item.option as any,
          });
        } else {
          await anonymousCart.addItem(
            item.product_id ?? null,
            item.quantity,
            item.price ?? 0,
            item.option as any,
            item.bundle_id ?? null,
            item.offer_id ?? null,
            { name: item.name, slug: item.slug ?? "", image: item.image ?? undefined },
            item.black_friday_item_id ?? null
          );
        }
        setAddedIds((prev) => new Set(prev).add(i));
        successCount++;
      } catch {
        // continue – individual failures shouldn't block the rest
      }
    }
    setAddingAll(false);
    if (successCount === items.length) {
      showToast("All items added to your cart! 🎉", "success");
    } else if (successCount > 0) {
      showToast(`${successCount} of ${items.length} items added.`, "info");
    } else {
      showToast("Could not add items. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Container className="py-12 md:py-16 max-w-3xl">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-10"
          >
            {/* Header */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1B6013]">
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  Shared Cart
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                Someone shared a cart with you
              </h1>
              <p className="text-sm text-slate-400">
                Shared on {sharedDate} · {items.length}{" "}
                {items.length === 1 ? "item" : "items"}
              </p>
            </div>

            {/* Add All CTA */}
            <div className="bg-[#1B6013]/5 border border-[#1B6013]/10 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="font-bold text-slate-900 text-sm">
                  Like what you see?
                </p>
                <p className="text-xs text-slate-500">
                  Add all {items.length} items straight to your cart in one tap.
                </p>
              </div>
              <Button
                id="add-all-to-cart-btn"
                onClick={addAllToCart}
                disabled={addingAll || addedIds.size === items.length}
                className="bg-[#1B6013] hover:bg-[#1B6013]/90 text-white h-11 px-6 rounded-xl font-bold text-sm shadow-none border-0 whitespace-nowrap flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                {addingAll ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Adding…
                  </>
                ) : addedIds.size === items.length ? (
                  <>All items added ✓</>
                ) : (
                  <>
                    Add all to cart
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </>
                )}
              </Button>
            </div>

            {/* Item List */}
            <div className="space-y-0 divide-y divide-slate-50">
              <div className="pb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">
                  Order Contents
                </span>
                <span className="text-[10px] font-bold text-[#1B6013] bg-[#1B6013]/5 px-2 py-0.5 rounded-md">
                  {items.reduce((a, i) => a + i.quantity, 0)} Items
                </span>
              </div>

              {items.map((item, idx) => {
                const isAdded = addedIds.has(idx);
                return (
                  <div
                    key={idx}
                    className="py-5 first:pt-2 flex gap-5 items-start"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-slate-100 rounded-xl">
                      {item.image ? (
                        <Image
                          fill
                          src={item.image}
                          alt={item.name}
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between self-stretch">
                      <div className="space-y-0.5">
                        <div className="flex justify-between items-start gap-3">
                          <h4 className="text-sm font-bold text-slate-900 leading-tight">
                            {item.slug ? (
                              <Link
                                href={`/product/${item.slug}`}
                                className="hover:text-[#1B6013] transition-colors"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              item.name
                            )}
                          </h4>
                          <span className="text-sm font-black text-[#1B6013] tabular-nums shrink-0">
                            {item.price != null
                              ? formatNaira((item.price ?? 0) * item.quantity)
                              : "—"}
                          </span>
                        </div>
                        {item.option && typeof item.option === "object" && (item.option as any).name && (
                          <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                            {(item.option as any).name}
                          </p>
                        )}
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-2">
                          <span>{item.price ? formatNaira(item.price) : "—"}</span>
                          <span className="text-slate-200">|</span>
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold">Qty {item.quantity}</span>
                        </p>
                      </div>

                      <div className="mt-3">
                        <button
                          id={`add-item-btn-${idx}`}
                          onClick={() => addSingleItem(item, idx)}
                          disabled={isAdded || addingAll}
                          className={`text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 ${
                            isAdded
                              ? "text-[#1B6013] cursor-default"
                              : "text-slate-400 hover:text-[#1B6013]"
                          }`}
                        >
                          {isAdded ? "Added ✓" : "+ Add to cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 flex justify-between items-end">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">
                  Cart Total (approx.)
                </p>
                <p className="text-2xl font-black tracking-tight">
                  {formatNaira(subtotal)}
                </p>
                <p className="text-[10px] text-slate-400">
                  Prices may have changed since sharing
                </p>
              </div>
              <Button
                onClick={addAllToCart}
                disabled={addingAll || addedIds.size === items.length}
                className="bg-[#1B6013] hover:bg-[#1B6013]/90 text-white h-10 px-5 rounded-lg font-bold text-xs shadow-none border-0 flex items-center gap-2 transition-all"
              >
                {addingAll ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <ShoppingBag size={14} />
                )}
                {addedIds.size === items.length ? "All added!" : "Add all"}
              </Button>
            </div>

            {/* Footer link */}
            <div className="text-center pt-4">
              <Link
                href="/"
                className="text-xs text-slate-400 hover:text-[#1B6013] font-bold transition-colors"
              >
                Browse more products on FeedMe →
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
}
