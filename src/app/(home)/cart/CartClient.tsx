"use client";
import React, { useMemo, useCallback, useState, useEffect } from "react";
import { getDealMessages, calculateCartDiscount, getAppliedDiscountLabel } from "src/lib/deals";
import BonusProgressBar from "@components/shared/BonusProgressBar";
import Container from "@components/shared/Container";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2Icon, Truck, Minus, Plus, ShoppingBag, ArrowRight, Heart } from "lucide-react";
import { Icon } from "@iconify/react";
import { formatNaira } from "src/lib/utils";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Link from "next/link";
import { Badge } from "@components/ui/badge";
import { useToast } from "src/hooks/useToast";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import ProductSlider from "@components/shared/product/product-slider";
import { Separator } from "@components/ui/separator";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import {
  useRemoveFromCartMutation,
  useCartQuery,
  useUpdateCartItemQuantityMutation,
  useCartSubscription,
} from "src/queries/cart";
import { IProductInput } from "src/types";
import { createClient as createSupabaseClient } from "src/utils/supabase/client";
import { getCustomerOrdersAction } from "src/lib/actions/user.action";
import { motion, AnimatePresence } from "framer-motion";

interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  offer?: CartItem["offers"];
  options: Record<string, CartItem>;
}

interface CartClientProps {
  user: any | null;
  cartItems: CartItem[];
  purchasedProductIds: string[];
  allCategories: any[];
  recommendedProducts: IProductInput[];
}

function isProductOption(option: unknown): option is ProductOption {
  return (
    typeof option === "object" &&
    option !== null &&
    "price" in option &&
    typeof (option as any).price === "number"
  );
}

const getCartItemLabel = (item: CartItem) =>
  (item as any).products?.name ||
  (item as any).bundles?.name ||
  (item as any).offers?.title ||
  (item as any)?.meta?.name ||
  "Item";

const CartClient: React.FC<CartClientProps> = ({
  user,
  cartItems,
  purchasedProductIds,
  allCategories,
  recommendedProducts,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  console.log("CartClient user prop:", user);
  const anonymousCart = useAnonymousCart();

  useCartSubscription();
  const { data: serverCartItems } = useCartQuery();
  const updateItemQuantityMutation = useUpdateCartItemQuantityMutation();
  const removeCartItemMutation = useRemoveFromCartMutation();
  
  const [items, setItems] = useState<CartItem[]>(cartItems);
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
       getCustomerOrdersAction(user.user_id).then(orders => {
          if (orders && orders.length === 0) setIsFirstOrder(true);
          else setIsFirstOrder(false);
       });
    } else {
       setIsFirstOrder(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && serverCartItems) setItems(serverCartItems);
  }, [user, serverCartItems]);

  useEffect(() => {
     if (!user && anonymousCart.items) {
          const enrichItems = async () => {
             const supabase = createSupabaseClient();
             try {
               const enriched = await Promise.all(
                 anonymousCart.items.map(async (anonItem) => {
                   let offerData: any = null;
                   let productData: any = null;
                   let bundleData: any = null;

                   if ((anonItem as any).offer_id) {
                     try {
                       const response = await fetch(`/api/offers/${(anonItem as any).offer_id}`);
                       if (response.ok) {
                         const { offer } = await response.json();
                         offerData = offer;
                       }
                     } catch (e) {}
                   }

                   if (anonItem.product_id) {
                     try {
                       const { data } = await supabase.from("products").select("id, name, slug, images, price, list_price, is_published").eq("id", anonItem.product_id).single();
                       if (data) productData = data;
                     } catch (e) {}
                   }

                   if (anonItem.bundle_id) {
                      try {
                       const { data } = await supabase.from("bundles").select("id, name, thumbnail_url, price").eq("id", anonItem.bundle_id).single();
                       if (data) bundleData = data;
                     } catch (e) {}
                   }

                   return {
                     ...anonItem,
                     products: productData,
                     bundles: bundleData,
                     offers: offerData,
                     cart_id: null,
                     created_at: anonItem.created_at || new Date().toISOString(),
                   } as CartItem;
                 })
               );
               setItems(enriched);
             } catch (error) {
                console.error("Enrichment error", error);
             }
          };
          enrichItems();
     }
  }, [user, anonymousCart.items]);

  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc: Record<string, GroupedCartItem>, item: CartItem) => {
        let key: string;
        if (item.product_id) {
          key = `product-${item.product_id}`;
          if (!acc[key]) acc[key] = { product: (item as any).products, options: {} };
          const optionKey = item.option ? JSON.stringify(item.option) : "no-option";
          acc[key].options[optionKey] = item;
        } else if (item.bundle_id) {
          key = `bundle-${item.bundle_id}`;
          if (!acc[key]) acc[key] = { bundle: (item as any).bundles, options: {} };
          acc[key].options["bundle-item"] = item;
        } else if (item.offer_id) {
          key = `offer-${item.offer_id}`;
          if (!acc[key]) acc[key] = { offer: (item as any).offers, options: {} };
          acc[key].options["offer-item"] = item;
        } else {
             key = `unknown-${item.id}`;
             if (!acc[key]) acc[key] = { options: { "default": item } };
        }
        return acc;
      },
      {} as Record<string, GroupedCartItem>
    );
  }, [items]);

  const handleRemoveItem = useCallback(
    async (itemToRemove: CartItem) => {
      try {
        const itemLabel = getCartItemLabel(itemToRemove);
        if (user) {
          if (itemToRemove.id) {
            await removeCartItemMutation.mutateAsync(itemToRemove.id);
            setItems((prev) => prev.filter((i) => i.id !== itemToRemove.id));
            showToast(`${itemLabel} removed`, "info");
          }
        } else {
          if (itemToRemove.id) {
            anonymousCart.removeItem(itemToRemove.id);
            showToast(`${itemLabel} removed`, "info");
          }
        }
      } catch (error) {
        showToast("Failed to remove item", "error");
      }
    },
    [removeCartItemMutation, showToast, user, anonymousCart]
  );

  const handleQuantityChange = useCallback(
    async (itemToUpdate: CartItem, increment: boolean) => {
      const newQuantity = increment ? itemToUpdate.quantity + 1 : itemToUpdate.quantity - 1;
      if (newQuantity < 0) return;

      setItems(prev => prev.map(i => i.id === itemToUpdate.id ? { ...i, quantity: newQuantity } : i));

      if (newQuantity === 0) {
          handleRemoveItem(itemToUpdate);
          return;
      }

      if (user) {
         try {
             await updateItemQuantityMutation.mutateAsync({ cartItemId: itemToUpdate.id, quantity: newQuantity });
         } catch (error) {
             showToast("Failed to update quantity", "error");
         }
      } else {
         anonymousCart.updateQuantity(itemToUpdate.id, newQuantity);
      }
    },
    [handleRemoveItem, updateItemQuantityMutation, showToast, user, anonymousCart]
  );

  const totalQuantity = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => {
      let price = 0;
      if (item.offer_id && (item as any).offers) price = (item as any).offers.price_per_slot || 0;
      else if (item.bundle_id && (item as any).bundles) price = (item as any).bundles.price || 0;
      else if (item.product_id && (item as any).products) {
        const productOption = isProductOption(item.option) ? item.option : null;
        price = (productOption?.price !== undefined && productOption?.price !== null ? productOption.price : item.price) || 0;
      } else price = item.price || 0;
      return acc + price * item.quantity;
    }, 0);
  }, [items]);

  const dealsDiscount = useMemo(() => calculateCartDiscount(subtotal, items, isFirstOrder, !!user?.user_id), [subtotal, items, isFirstOrder, user?.user_id]);
  const dealMessages = useMemo(() => getDealMessages(subtotal, items, isFirstOrder, !!user?.user_id), [subtotal, items, isFirstOrder, user?.user_id]);
  const totalAmount = Math.max(0, subtotal - dealsDiscount);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900"> 
      <Container className="py-12 md:py-16">
        <AnimatePresence mode="wait">
          {totalQuantity === 0 ? (
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col items-center justify-center py-40 text-center"
            >
                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-5 h-5 text-slate-300" />
                </div>
                <h2 className="text-lg font-black tracking-tight mb-8 text-slate-400 uppercase tracking-[0.2em]">Basket Empty</h2>
                <Link href="/">
                  <Button className="bg-[#1B6013] text-white hover:bg-[#1B6013] opacity-90 h-10 px-8 rounded-full font-bold text-xs uppercase tracking-widest shadow-none transition-all border-0">
                    Start Shopping
                  </Button>
                </Link>
            </motion.div>
          ) : (
            <div className="space-y-12">
              {dealMessages.length > 0 && !user && (
                 <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Icon icon="solar:star-fall-minimalistic-bold" className="w-5 h-5 text-yellow-600" />
                       <p className="text-sm font-bold text-yellow-800">{dealMessages[0]}</p>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg border-yellow-200 text-yellow-800 hover:bg-yellow-100" onClick={() => router.push('/login')}>
                       Login Now
                    </Button>
                 </div>
              )}
              <h1 className="text-3xl font-black tracking-tight">Your Basket</h1>

              <div className="flex flex-col lg:flex-row gap-12 text-slate-900">
              {/* Simple Item List */}
              <div className="flex-1 space-y-10">
                <div className="space-y-6">
                    <div className="pb-4 border-b border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-400">Order Contents</span>
                        <span className="text-[10px] font-bold text-[#1B6013] bg-[#1B6013]/5 px-2 py-0.5 rounded-md">{totalQuantity} Items</span>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {Object.entries(groupedItems).map(([groupKey, productGroup]: [string, GroupedCartItem]) => (
                        Object.entries(productGroup.options).map(([optionKey, item]: [string, CartItem]) => {
                            const productOption = isProductOption(item.option) ? item.option : null;
                            const price = productOption?.price ?? (item.offers?.price_per_slot || item.price) ?? 0;
                            
                            return (
                            <div key={item.id} className="py-6 first:pt-0 group flex gap-6 items-start">
                                {/* Thumbnail */}
                                <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-slate-100 rounded-xl">
                                    <Image
                                        fill
                                        src={(item as any).option?.image || (item as any).products?.images?.[0] || (item as any).bundles?.thumbnail_url || (item as any).offers?.image_url || "/product-placeholder.png"}
                                        alt={getCartItemLabel(item)}
                                        className="object-cover"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 flex flex-col justify-between self-stretch">
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className="text-base font-bold text-slate-900 leading-tight tracking-tight">
                                                {getCartItemLabel(item)}
                                            </h4>
                                            <span className="text-base font-black text-[#1B6013] tabular-nums">
                                                {price === 0 ? "FREE" : formatNaira(price * item.quantity)}
                                            </span>
                                        </div>
                                        {productOption?.name && (
                                            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider font-mono">{productOption.name}</p>
                                        )}
                                        <p className="text-xs text-slate-400 font-medium">{formatNaira(price)}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3">
                                        {/* Simple Quantity Switcher */}
                                        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-lg border border-slate-100 shadow-sm">
                                            <button 
                                                onClick={() => handleQuantityChange(item, false)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-6 text-center text-xs font-black tabular-nums">{item.quantity}</span>
                                            <button 
                                                onClick={() => handleQuantityChange(item, true)}
                                                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                                disabled={price === 0}
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>

                                        <button 
                                            onClick={() => handleRemoveItem(item)}
                                            className="text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-red-500 transition-colors flex items-center gap-1"
                                        >
                                            <Trash2Icon size={11} />
                                            <span>Remove</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            );
                        })
                        ))}
                    </div>
                </div>

                {/* Integrated Rewards Status (Minimalist) */}
                <div className="pt-8 border-t border-slate-100">
                    <BonusProgressBar subtotal={subtotal} isFirstOrder={isFirstOrder} isAuthenticated={!!user?.user_id} />
                </div>
              </div>

              {/* Sidebar Summary (Neat & Clean) */}
              <div className="w-full lg:w-[380px]">
                <div className="bg-slate-50 rounded-xl p-8 space-y-8 sticky top-28 border border-slate-100 shadow-sm">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-slate-500 text-sm">
                            <span className="font-medium">Subtotal</span>
                            <span className="font-bold text-slate-900">{formatNaira(subtotal)}</span>
                        </div>
                        {dealsDiscount > 0 && (
                            <div className="flex justify-between items-center text-[#1B6013] text-sm bg-white/60 px-4 py-2 rounded-lg border border-[#1B6013]/5">
                                <span className="font-bold flex items-center gap-2">
                                    <Icon icon="solar:ticket-sale-bold" className="w-4 h-4" />
                                    {getAppliedDiscountLabel(subtotal, items, isFirstOrder, !!user?.user_id)}
                                </span>
                                <span className="font-black">-{formatNaira(dealsDiscount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-slate-500 text-sm">
                            <span className="font-medium">Shipping</span>
                            <span className="font-bold text-slate-400 italic text-xs text-right leading-tight">Calculated at<br/>checkout</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200/60 flex justify-between items-end">
                        <div className="space-y-0.5">
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Price</p>
                            <span className="text-2xl font-black tracking-tight text-slate-900">{formatNaira(totalAmount)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button
                            className="w-full h-14 bg-[#1B6013] hover:bg-[#1B6013] opacity-90 hover:opacity-100 text-white rounded-lg font-bold text-base tracking-tight shadow-none border-0 transition-all active:scale-[0.99]"
                            onClick={() => router.push("/checkout")}
                        >
                            Proceed to Checkout
                            <ArrowRight size={18} strokeWidth={2.5} />
                        </Button>
                        <div className="flex items-center justify-center gap-2 text-[#1B6013] opacity-60">
                             <Icon icon="solar:shield-check-bold" className="w-3.5 h-3.5" />
                             <span className="text-[8px] uppercase font-black tracking-[0.2em]">Secured checkout</span>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col gap-5">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-sm bg-[#1B6013] flex items-center justify-center shrink-0">
                                <Truck className="w-4 h-4 text-white" />
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 leading-relaxed uppercase">
                                LAGOS DOOR-STEP DELIVERY WITHIN 3 HOURS.
                            </p>
                        </div>
                    </div>
                    </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Minimalist recommendations */}
        {totalQuantity > 0 && recommendedProducts && recommendedProducts.length > 0 && (
          <div className="mt-24 pt-16 border-t border-slate-50">
             <div className="mb-10 flex items-end justify-between">
                <div className="space-y-1">
                    <h3 className="text-xl font-black tracking-tight text-slate-900">Recommended for you</h3>
                    <p className="text-slate-400 text-xs text-slate-900">Based on your current basket</p>
                </div>
             </div>
             <ProductSlider
                title=""
                products={recommendedProducts}
                hideDetails={false}
              />
          </div>
        )}
      </Container>
    </div>
  );
};

export default CartClient;
