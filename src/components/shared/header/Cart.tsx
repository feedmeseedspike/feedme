"use client";

import React, { useEffect, useCallback } from "react";
import ShoppingCart from "@components/icons/cart.svg";
import { Button } from "@components/ui/button";
import { Separator } from "@components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@components/ui/sheet";
import { ArrowLeft, Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useUser } from "src/hooks/useUser";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  cartQueryKey,
  ItemToUpdateMutation,
  usePrefetchCart,
} from "src/queries/cart";
import { CartItem } from "src/lib/actions/cart.actions";
import { formatNaira } from "src/lib/utils";
import { Input } from "@components/ui/input";
import Link from "next/link";
import { useToast } from "src/hooks/useToast";
import { useVoucherValidationMutation } from "src/queries/vouchers";

// Explicitly define ProductOption here to resolve 'Cannot find name' errors
interface ProductOption {
  name: string;
  price: number;
  image?: string;
  stockStatus?: string;
}

// Define a more specific type for grouped items
interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  offer?: CartItem["offers"];
  options: Record<string, CartItem>;
}

// New component for displaying a grouped product/bundle and its options
interface CartProductGroupDisplayProps {
  productGroup: GroupedCartItem;
  productId: string;
  handleRemoveItem: (itemToRemove: CartItem) => Promise<void>;
  handleQuantityChange: (
    itemToUpdate: CartItem,
    increment: boolean
  ) => Promise<void>;
}

const CartProductGroupDisplay = React.memo(
  ({
    productId,
    productGroup,
    handleRemoveItem,
    handleQuantityChange,
  }: CartProductGroupDisplayProps) => {
    const groupName = productGroup.product?.name || productGroup.bundle?.name || productGroup.offer?.title || "Product";

    return (
      <div key={productId} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <p className="h6-bold text-lg">{groupName}</p>
        </div>
        {Object.entries(productGroup.options).map(
          ([optionKey, item]: [string, CartItem]) => (
            <CartItemDisplay
              key={item.id}
              item={item}
              handleRemoveItem={handleRemoveItem}
              handleQuantityChange={handleQuantityChange}
            />
          )
        )}
      </div>
    );
  }
);

CartProductGroupDisplay.displayName = "CartProductGroupDisplay";

// New component for individual cart items
interface CartItemDisplayProps {
  item: CartItem;
  handleRemoveItem: (itemToRemove: CartItem) => Promise<void>;
  handleQuantityChange: (
    itemToUpdate: CartItem,
    increment: boolean
  ) => Promise<void>;
}

const CartItemDisplay = React.memo(
  ({ item, handleRemoveItem, handleQuantityChange }: CartItemDisplayProps) => {
    const productOption = isProductOption(item.option) ? item.option : null;
    const productName = productOption?.name || item.products?.name || item.bundles?.name || item.offers?.title || "Product";
    const productSlug = item.products?.slug || item.product_id || item.bundle_id || item.offer_id || "";

    return (
      <React.Fragment>
        <div className="flex items-center gap-3 sm:gap-4 overflow-y-visible">
          <div>
            <Image
              width={64}
              height={64}
              src={
                productOption?.image ||
                item.products?.images?.[0] ||
                item.bundles?.thumbnail_url ||
                item.offers?.image_url ||
                "/placeholder.png"
              }
              alt={productName}
              className="h-[64px] rounded-[5px] border-[0.31px] border-[#DDD5DD] object-contain"
            />
          </div>
          <div className="flex flex-col gap-[6px] w-full">
            <div className="flex justify-between">
              <p className="h6-light !text-[14px]">{productName}</p>
              <Trash2Icon
                className="size-4 cursor-pointer"
                onClick={() => handleRemoveItem(item as CartItem)}
                aria-label="Remove item"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[#101828] font-bold">
                {formatNaira(
                  (() => {
                    if (item.offer_id && item.offers) {
                      return item.offers.price_per_slot || item.price || 0;
                    } else if (isProductOption(item.option) &&
                      item.option.price !== undefined &&
                      item.option.price !== null) {
                      return item.option.price;
                    } else {
                      return item.price || 0;
                    }
                  })()
                )}{" "}
              </p>
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-[9px] bg-[#D0D5DD] rounded-[4px] p-3 text-white"
                  onClick={() => handleQuantityChange(item as CartItem, false)}
                >
                  <AiOutlineMinus />
                </Button>
                <span>{item.quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-[9px] bg-[#1B6013] rounded-[4px] p-3 text-white"
                  onClick={() => handleQuantityChange(item as CartItem, true)}
                >
                  <AiOutlinePlus />
                </Button>
              </div>
            </div>
          </div>
        </div>
        <Separator />
      </React.Fragment>
    );
  }
);

CartItemDisplay.displayName = "CartItemDisplay";

// Type guard for ProductOption
function isProductOption(option: unknown): option is ProductOption {
  return (
    typeof option === "object" &&
    option !== null &&
    "price" in option &&
    typeof (option as any).price === "number"
  );
}

const Cart = React.memo(({ asLink = false }: { asLink?: boolean }) => {
  const router = useRouter();
  const { data: cartItems, isLoading, isError, error } = useCartQuery();
  const { user } = useUser();
  const anonymousCart = useAnonymousCart();
  const prefetchCart = usePrefetchCart();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for cart updates (both anonymous and authenticated)
  useEffect(() => {
    const handleCartUpdate = () => {
      setForceUpdate(prev => prev + 1);
      // Also invalidate the cart query for authenticated users
      if (user) {
        queryClient.invalidateQueries({ queryKey: ['cart'] });
      }
    };

    const handleAnonymousCartUpdate = () => {
      setForceUpdate(prev => prev + 1);
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'feedme_anonymous_cart') {
        setForceUpdate(prev => prev + 1);
      }
    };

    // Listen for cart updates from AI chat
    window.addEventListener('cartUpdated', handleCartUpdate);

    if (!user) {
      window.addEventListener('anonymousCartUpdated', handleAnonymousCartUpdate);
      window.addEventListener('storage', handleStorageChange);
    }

    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      if (!user) {
        window.removeEventListener('anonymousCartUpdated', handleAnonymousCartUpdate);
        window.removeEventListener('storage', handleStorageChange);
      }
    };
  }, [user, queryClient]);

  const [enrichedAnonItems, setEnrichedAnonItems] = useState<CartItem[]>([]);

  // Enrich anonymous cart items with offer data
  useEffect(() => {
    if (!user && anonymousCart.items && anonymousCart.items.length > 0) {
      const enrichItems = async () => {
        const enriched = await Promise.all(
          anonymousCart.items.map(async (anonItem) => {
            let offerData = null;

            // Fetch offer data if this is an offer item
            if (anonItem.offer_id) {
              try {
                const response = await fetch(`/api/offers/${anonItem.offer_id}`);
                if (response.ok) {
                  const { offer } = await response.json();
                  offerData = offer;
                }
              } catch (error) {
                console.error(`Failed to fetch offer data for ${anonItem.offer_id}:`, error);
              }
            }

            return {
              id: anonItem.id,
              product_id: anonItem.product_id,
              bundle_id: anonItem.bundle_id,
              offer_id: anonItem.offer_id || null,
              quantity: anonItem.quantity,
              price: anonItem.price,
              option: anonItem.option,
              created_at: anonItem.created_at,
              user_id: null,
              cart_id: null,
              products: null,
              bundles: null,
              offers: offerData
            } as CartItem;
          })
        );

        setEnrichedAnonItems(enriched);
      };

      enrichItems();
    } else if (!user) {
      setEnrichedAnonItems([]);
    }
  }, [user, anonymousCart.items, forceUpdate]);

  const items: CartItem[] = useMemo(() => {
    if (user) {
      return cartItems || [];
    } else {
      return enrichedAnonItems;
    }
  }, [user, cartItems, enrichedAnonItems]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc, item) => {
          let itemPrice = 0;

          if (item.offer_id && item.offers) {
            // For offers, use price_per_slot
            itemPrice = item.offers.price_per_slot || item.price || 0;
          } else if (isProductOption(item.option) &&
            item.option.price !== undefined &&
            item.option.price !== null) {
            // For products with options, use option price
            itemPrice = item.option.price;
          } else {
            // For regular products and bundles, use item price
            itemPrice = item.price || 0;
          }

          return acc + (itemPrice * item.quantity);
        },
        0
      ),
    [items]
  );

  // State for voucher
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [isVoucherValid, setIsVoucherValid] = useState(false);
  const [isVoucherPending, startVoucherTransition] = useTransition();
  const { showToast } = useToast();
  const { mutateAsync: validateVoucherMutation } =
    useVoucherValidationMutation();

  const isReferralVoucher = isVoucherValid && voucherCode.startsWith("REF-");

  // Restore voucher from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem("voucherCode");
    const savedDiscount = localStorage.getItem("voucherDiscount");
    if (savedCode) setVoucherCode(savedCode);
    if (savedDiscount) setVoucherDiscount(Number(savedDiscount));
  }, []);

  const handleVoucherValidation = useCallback(async () => {
    if (isReferralVoucher) {
      showToast(
        "Referral voucher already applied. Cannot apply another voucher.",
        "info"
      );
      return;
    }
    if (!voucherCode) {
      showToast("Please enter a voucher code.", "error");
      return;
    }

    startVoucherTransition(async () => {
      try {
        const result = await validateVoucherMutation({
          code: voucherCode,
          totalAmount: subtotal,
        });
        if (result.success && result.data) {
          const { discountType, discountValue, id } = result.data;
          setIsVoucherValid(true);
          const discount =
            discountType === "percentage"
              ? (discountValue / 100) * subtotal
              : discountValue;
          setVoucherDiscount(discount);
          // Persist voucher in localStorage
          localStorage.setItem("voucherCode", voucherCode);
          localStorage.setItem("voucherDiscount", discount.toString());
          showToast("Voucher applied successfully!", "success");
        } else {
          setIsVoucherValid(false);
          setVoucherDiscount(0);
          // Remove voucher from localStorage
          localStorage.removeItem("voucherCode");
          localStorage.removeItem("voucherDiscount");
          showToast(result.error || "Voucher validation failed.", "error");
        }
      } catch (error: any) {
        setIsVoucherValid(false);
        setVoucherDiscount(0);
        // Remove voucher from localStorage
        localStorage.removeItem("voucherCode");
        localStorage.removeItem("voucherDiscount");
        console.error("Error caught in handleVoucherValidation:", error);
        showToast(
          error.message || "An error occurred while validating the voucher.",
          "error"
        );
      }
    });
  }, [
    voucherCode,
    subtotal,
    showToast,
    validateVoucherMutation,
    isReferralVoucher,
  ]);

  const groupedItems = useMemo(() => {
    return items.reduce(
      (acc: Record<string, GroupedCartItem>, item: CartItem) => {
        let key: string;
        if (item.product_id) {
          key = `product-${item.product_id}`;
          if (!acc[key]) {
            acc[key] = {
              product: item.products,
              options: {},
            };
          }
          const optionKey = item.option
            ? JSON.stringify(item.option)
            : "no-option";
          acc[key].options[optionKey] = item;
        } else if (item.bundle_id) {
          key = `bundle-${item.bundle_id}`;
          if (!acc[key]) {
            acc[key] = {
              bundle: item.bundles,
              options: {},
            };
          }
          // For bundles, use a consistent key for options as there isn't a product option
          acc[key].options["bundle-item"] = item;
        } else if (item.offer_id) {
          key = `offer-${item.offer_id}`;
          if (!acc[key]) {
            acc[key] = {
              offer: item.offers,
              options: {},
            };
          }
          // For offers, use a consistent key for options as there isn't a product option
          acc[key].options["offer-item"] = item;
        }
        return acc;
      },
      {}
    );
  }, [items]);

  const updateCartMutation = useUpdateCartMutation();
  const removeCartItemMutation = useRemoveFromCartMutation();
  const clearCartMutation = useClearCartMutation();

  const handleCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  const handleRemoveItem = useCallback(
    async (itemToRemove: CartItem) => {
      try {
        if (user) {
          // Authenticated user - use API
          if (itemToRemove.id) {
            await removeCartItemMutation.mutateAsync(itemToRemove.id);
          }
        } else {
          // Anonymous user - use local storage
          if (itemToRemove.id) {
            anonymousCart.removeItem(itemToRemove.id);
            setForceUpdate(prev => prev + 1);
          }
        }
      } catch (error: any) {
        console.error("Failed to remove item:", error);
      }
    },
    [removeCartItemMutation, user, anonymousCart]
  );

  const handleQuantityChange = useCallback(
    async (itemToUpdate: CartItem, increment: boolean) => {
      const newQuantity = increment
        ? itemToUpdate.quantity + 1
        : itemToUpdate.quantity - 1;

      if (newQuantity >= 0) {
        if (user) {
          // Authenticated user - use API
          const existingItemInCart = items.find(
            (cartItem) => cartItem.id === itemToUpdate.id
          );

          if (!existingItemInCart) {
            console.error(
              "Cart: handleQuantityChange - Item not found in current cart data.",
              itemToUpdate
            );
            return;
          }

          if (newQuantity === 0) {
            if (existingItemInCart.id) {
              try {
                await removeCartItemMutation.mutateAsync(existingItemInCart.id);
              } catch (error: any) {
                console.error("Failed to remove item via quantity 0:", error);
              }
            }
          } else {
            const itemsForMutation: ItemToUpdateMutation[] = items
              .map((cartItem) => {
                const productOption = isProductOption(cartItem.option)
                  ? cartItem.option
                  : null;
                const priceToUse =
                  (productOption?.price !== undefined &&
                    productOption?.price !== null
                    ? productOption.price
                    : cartItem.price) || 0;

                // Determine if it's a bundle, offer, or product
                const isBundle =
                  cartItem.bundle_id !== null && cartItem.bundle_id !== undefined;
                const isOffer =
                  cartItem.offer_id !== null && cartItem.offer_id !== undefined;

                return {
                  product_id: isBundle || isOffer ? null : cartItem.product_id || "", // Set to null for bundles and offers
                  bundle_id: isBundle ? cartItem.bundle_id : null, // Set to bundle_id for bundles, null for others
                  offer_id: isOffer ? cartItem.offer_id : null, // Set to offer_id for offers, null for others
                  option: isBundle || isOffer ? null : cartItem.option, // Set option to null for bundles and offers
                  quantity:
                    cartItem.id === itemToUpdate.id
                      ? newQuantity
                      : cartItem.quantity,
                  price: priceToUse,
                };
              })
              .filter((item) => item.quantity > 0);

            try {
              await updateCartMutation.mutateAsync(itemsForMutation);
              // Invalidate and refetch cart data after successful update
              queryClient.invalidateQueries({ queryKey: cartQueryKey });
            } catch (error: any) {
              console.error("Failed to update cart item quantity:", error);
            }
          }
        } else {
          // Anonymous user - use local storage
          try {
            if (newQuantity === 0) {
              anonymousCart.removeItem(itemToUpdate.id);
            } else {
              await anonymousCart.updateQuantity(itemToUpdate.id, newQuantity);
            }
            setForceUpdate(prev => prev + 1);
          } catch (error: any) {
            console.error("Failed to update anonymous cart quantity:", error);
            showToast(error.message || "Failed to update quantity", "error");
          }
        }
      }
    },
    [items, removeCartItemMutation, updateCartMutation, queryClient, user, anonymousCart, showToast]
  );

  // Remove voucher from localStorage when clearing cart
  const handleClearCart = useCallback(async () => {
    try {
      if (user) {
        await clearCartMutation.mutateAsync();
      } else {
        anonymousCart.clearCart();
      }
      localStorage.removeItem("voucherCode");
      localStorage.removeItem("voucherDiscount");
    } catch (error: any) {
      console.error("Failed to clear cart:", error);
    }
  }, [clearCartMutation, user, anonymousCart]);

  const totalQuantity = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  // Check if cart is loading (for authenticated users) or anonymous cart is loading
  const isCartLoading = useMemo(() => {
    if (user) {
      return isLoading;
    } else {
      return anonymousCart.isLoading;
    }
  }, [user, isLoading, anonymousCart.isLoading]);

  const totalAmount = useMemo(
    () => subtotal - voucherDiscount,
    [subtotal, voucherDiscount]
  ); // Calculate total with discount

  // Add a state to track if device is mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Render logic
  if (asLink) {
    return (
      <div className="relative" onMouseEnter={prefetchCart}>
        <ShoppingCart className="size-[24px]" />
        {isCartLoading ? (
          <div
            className="absolute -top-2 -right-2 bg-gray-200 w-5 h-5 flex items-center justify-center rounded-full animate-pulse"
            style={{ minWidth: 20, minHeight: 20 }}
          >
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        ) : totalQuantity > 0 ? (
          <span
            className="absolute -top-2 -right-2 bg-[#D0D5DD] w-5 h-5 flex items-center justify-center rounded-full text-xs text-white font-semibold "
            style={{ minWidth: 20, minHeight: 20 }}
          >
            {totalQuantity}
          </span>
        ) : null}
      </div>
    );
  }

  // On mobile, clicking the cart icon navigates to /cart
  if (isMobile) {
    return (
      <div
        className="relative cursor-pointer"
        onClick={() => router.push("/cart")}
        onMouseEnter={prefetchCart}
      >
        <ShoppingCart className="size-[24px]" />
        {isCartLoading ? (
          <div
            className="absolute -top-2 -right-[6px] sm:-right-2 bg-gray-200 w-5 h-5 flex items-center justify-center rounded-full animate-pulse"
            style={{ minWidth: 20, minHeight: 20 }}
          >
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        ) : totalQuantity > 0 ? (
          <span
            className="absolute -top-2 -right-[6px] sm:-right-2 bg-[#D0D5DD] w-5 h-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs text-white font-semibold "
            style={{ minWidth: 20, minHeight: 20 }}
          >
            {totalQuantity}
          </span>
        ) : null}
      </div>
    );
  }

  // Desktop: show modal
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div
          className="relative cursor-pointer"
          onMouseEnter={prefetchCart}
          onClick={() => setOpen(true)}
        >
          <ShoppingCart className="size-[24px]" />
          {isCartLoading ? (
            <div
              className="absolute -top-2 -right-[6px] sm:-right-2 bg-gray-200 w-5 h-5 flex items-center justify-center rounded-full animate-pulse"
              style={{ minWidth: 20, minHeight: 20 }}
            >
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            </div>
          ) : totalQuantity > 0 ? (
            <span
              className="absolute -top-2 -right-[6px] sm:-right-2 bg-[#D0D5DD] w-5 h-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs text-white font-semibold "
              style={{ minWidth: 20, minHeight: 20 }}
            >
              {totalQuantity}
            </span>
          ) : null}
        </div>
      </SheetTrigger>

      <SheetContent className="flex flex-col gap-4 md:!max-w-xl">
        <SheetHeader className="flex justify-between w-full items-center">
          <SheetClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <ArrowLeft className="size-[22px]" />
          </SheetClose>
          <SheetTitle className="h2-bold flex-1 text-center">
            {isCartLoading ? (
              <>
                Cart (<div className="inline-block w-4 h-4 bg-gray-200 rounded animate-pulse"></div>)
              </>
            ) : (
              `Cart (${totalQuantity})`
            )}
          </SheetTitle>
          {totalQuantity > 0 && (
            <p
              className="badge cursor-pointer w-fit select-none"
              onClick={handleClearCart}
            >
              Clear Cart
            </p>
          )}
        </SheetHeader>

        {/* Free Shipping Progress Bar */}
        {items.length > 0 ? (
          <div
            className={`rounded border px-4 py-3 mb-2 ${subtotal >= 50000
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">📦</span>
              {subtotal >= 50000 ? (
                    <span className="font-semibold text-[14px] text-green-700">
                      Congratulations! You have unlocked <b>free shipping</b>!
                    </span>
                  ) : (
                    <span className="font-medium text-black">
                      Add{" "}
                      <span className="font-bold text-red-600">
                    {formatNaira(Math.max(0, 50000 - subtotal))}
                      </span>{" "}
                      to cart and get <b>free shipping</b>!
                    </span>
                  )}
                </div>
                <div className="w-full h-2 bg-red-100 rounded">
              <div
                className={`h-2 rounded transition-all duration-300 ${subtotal >= 50000 ? "bg-green-500" : "bg-red-500"
                  }`}
                style={{
                  width: `${Math.min(100, (subtotal / 50000) * 100)}%`,
                }}
              />
                </div>
              </div>
        ) : null}

        <div className="flex grow flex-col space-y-5 overflow-y-auto pt-1">
          {isLoading && <p>Loading cart...</p>}
          {isError && <p>Error loading cart: {error?.error}</p>}

          {!isLoading && !isError && items.length === 0 && totalQuantity === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              <p className="text-lg font-semibold">Your cart is empty.</p>
              <p className="text-sm text-gray-400">
                Start adding items to your cart!
              </p>
            </div>
          ) : (
            Object.entries(groupedItems).map(
              ([productId, productGroup]: [string, GroupedCartItem]) => (
                <CartProductGroupDisplay
                  key={productId}
                  productId={productId}
                  productGroup={productGroup}
                  handleRemoveItem={handleRemoveItem}
                  handleQuantityChange={handleQuantityChange}
                />
              )
            )
          )}
        </div>

        {totalQuantity > 0 && (
          <SheetFooter className="mt-auto">
            <div className="w-full">
              <Separator className="my-2" />
              <div className="h4-light flex justify-between">
                <p>Subtotal</p>
                <p>{formatNaira(subtotal)}</p>
              </div>
              {/* Voucher Section */}
              <div className="flex w-full items-center pt-[10px] gap-3">
                <Input
                  type="text"
                  placeholder="Discount Code"
                  className="h-10 placeholder:text-xs text-[#737373] placeholder:font-semibold"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  disabled={isReferralVoucher}
                />
                <Button
                  type="button"
                  className="btn-primary !text-[#B7CDB4] !bg-[#F2F4F7] h-10"
                  onClick={handleVoucherValidation}
                  disabled={isVoucherPending || isReferralVoucher}
                >
                  {isVoucherPending ? "Applying..." : "Apply"}
                </Button>
              </div>
              {isReferralVoucher && (
                <div className="mt-2 text-blue-600 text-sm">
                  Referral voucher applied. You cannot apply another voucher.
                </div>
              )}
              {isVoucherValid && ( // Display discount if valid
                <div className="mt-2 text-green-600 text-sm">
                  Voucher applied! You saved {formatNaira(voucherDiscount)}
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex justify-between text-[14px] text-[#101828]">
                <p>Total</p>
                <p>{formatNaira(totalAmount)}</p>
              </div>
              <p className="text-black">Delivery fees not included yet.</p>
              <div className="grid grid-cols-2 gap-2 w-full mt-3 ">
                <button
                  className="btn-primary !bg-[#D0D5DD] flex items-center justify-center !text-black"
                  onClick={() => {
                    setOpen(false);
                    router.push("/cart");
                  }}
                >
                  View cart
                </button>
                <button className="btn-primary" onClick={handleCheckout}>
                  Checkout
                </button>
              </div>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
});

Cart.displayName = "Cart";

export default Cart;



