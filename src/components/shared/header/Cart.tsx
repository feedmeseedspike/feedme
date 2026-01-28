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
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { useUser } from "src/hooks/useUser";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  cartQueryKey,
  ItemToUpdateMutation,
  usePrefetchCart,
  useAddToCartMutation,
} from "src/queries/cart";
import { getProducts } from "src/queries/products";
import { CartItem } from "src/lib/actions/cart.actions";
import { formatNaira } from "src/lib/utils";
import { Input } from "@components/ui/input";
import Link from "next/link";
import { useToast } from "src/hooks/useToast";
import { useVoucherValidationMutation } from "src/queries/vouchers";
import { createClient as createSupabaseClient } from "src/utils/supabase/client";
import { Tables } from "@utils/database.types";
import { getCustomerOrdersAction } from "src/lib/actions/user.action";
import { getDealMessages, BONUS_CONFIG, calculateCartDiscount, getAppliedDiscountLabel } from "src/lib/deals";

// Explicitly define ProductOption here to resolve 'Cannot find name' errors
interface ProductOption {
  name: string;
  price: number;
  image?: string;
  stockStatus?: string;
  measurement?: string;
  size?: string;
  label?: string;
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
    const groupName =
      productGroup.product?.name ||
      productGroup.bundle?.name ||
      productGroup.offer?.title ||
      "Product";

    return (
      <div key={productId} className="flex flex-col gap-4">
        <div className="flex items-center gap-2 px-1">
          <p className="font-bold text-base text-gray-900 tracking-tight">{groupName}</p>
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
    const baseName =
      item.products?.name ||
      item.bundles?.name ||
      item.offers?.title ||
      "Product";
    const productName = baseName;
    const productSlug =
      item.products?.slug ||
      item.product_id ||
      item.bundle_id ||
      item.offer_id ||
      "";

    const optionDescriptor = (() => {
      if (!productOption) return null;
      const enrichedOption = productOption as ProductOption & {
        measurement?: string;
        size?: string;
        label?: string;
        variant?: string;
      };
      return (
        enrichedOption.measurement ||
        enrichedOption.size ||
        enrichedOption.label ||
        enrichedOption.variant ||
        (enrichedOption.name !== baseName ? enrichedOption.name : null)
      );
    })();

    return (
      <React.Fragment>
        <div className="flex items-center gap-4 sm:gap-5 overflow-y-visible py-2 hover:bg-gray-50/80 transition-all duration-300 rounded-2xl px-3 -mx-3 group/item">
          <div className="flex-shrink-0">
            <Image
              width={56}
              height={56}
              src={
                productOption?.image ||
                item.products?.images?.[0] ||
                (item as any)?.meta?.image ||
                item.bundles?.thumbnail_url ||
                item.offers?.image_url ||
                "/placeholder.png"
              }
              alt={productName}
              className="h-[56px] w-[56px] rounded-[14px] bg-gray-50 border border-black/5 object-cover shadow-sm group-hover/item:shadow-md transition-shadow"
            />
          </div>
          <div className="flex flex-col gap-[6px] w-full">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                {/* <p className="h6-light !text-[14px] truncate">
                  {productName || (item as any)?.meta?.name}
                </p> */}
                {optionDescriptor && (
                  <p className="text-xs text-[#475467] truncate">
                    {optionDescriptor}
                  </p>
                )}
              </div>
              <Trash2Icon
                className="size-4 cursor-pointer flex-shrink-0 ml-2"
                onClick={() => handleRemoveItem(item as CartItem)}
                aria-label="Remove item"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[#101828] font-bold">
                {(() => {
                    const price = (() => {
                      if (item.offer_id && item.offers) {
                        return item.offers.price_per_slot || item.price || 0;
                      } else if (
                        isProductOption(item.option) &&
                        item.option.price !== undefined &&
                        item.option.price !== null
                      ) {
                        return item.option.price;
                      } else {
                        return item.price || 0;
                      }
                    })();
                    return price === 0 ? <span className="text-green-600 font-extrabold">FREE</span> : formatNaira(price);
                  })()}
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
                  className={`size-[9px] bg-[#1B6013] rounded-[4px] p-3 text-white ${item.price === 0 ? "opacity-30" : ""}`}
                  onClick={() => handleQuantityChange(item as CartItem, true)}
                  disabled={item.price === 0}
                  title={item.price === 0 ? "Cannot add more of a free prize item" : "Add one"}
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

const CartRecommendations = () => {
  const { data: products } = useQuery({
    queryKey: ["cart-recommendations"],
    queryFn: () => getProducts({ limit: 4, sortBy: "num_sales", sortOrder: "desc" }),
  });
  const addToCartMutation = useAddToCartMutation();
  const { showToast } = useToast();

  if (!products?.data || products.data.length === 0) return null;

  return (
    <div className="mt-6 px-1 border-t border-gray-100 pt-6">
      <h3 className="font-semibold text-gray-900 mb-4 text-sm">You might also like</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6">
        {products.data.map((product: Tables<'products'>) => (
          <div key={product.id} className="min-w-[120px] w-[120px] shrink-0 group">
            <Link href={`/product/${product.slug}`}>
              <div className="relative aspect-square mb-2 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                <Image
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
            </Link>
            <div className="space-y-1">
              <Link href={`/product/${product.slug}`} className="text-xs font-medium text-gray-900 line-clamp-1 block decoration-0">
                {product.name}
              </Link>
              <p className="text-xs text-gray-500 font-medium">{formatNaira(product.price)}</p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full h-7 text-[10px] mt-2 rounded-lg border-gray-200 hover:bg-primary hover:text-white hover:border-primary transition-colors"
                onClick={async () => {
                  try {
                    await addToCartMutation.mutateAsync({
                      product_id: product.id,
                      quantity: 1,
                    });
                    showToast("Added to cart", "success");
                  } catch (e) {
                    showToast("Failed to add", "error");
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
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
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    if (user?.user_id) {
       getCustomerOrdersAction(user.user_id).then((orders) => {
          if (orders && orders.length === 0) setIsFirstOrder(true);
          else setIsFirstOrder(false);
       });
    } else {
       setIsFirstOrder(false);
    }
  }, [user]);

  // Listen for anonymous cart updates
  useEffect(() => {
    if (!user) {
      const handleAnonymousCartUpdate = () => {
        setForceUpdate((prev) => prev + 1);
      };

      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === "feedme_anonymous_cart") {
          setForceUpdate((prev) => prev + 1);
        }
      };

      window.addEventListener(
        "anonymousCartUpdated",
        handleAnonymousCartUpdate
      );
      window.addEventListener("storage", handleStorageChange);
      return () => {
        window.removeEventListener(
          "anonymousCartUpdated",
          handleAnonymousCartUpdate
        );
        window.removeEventListener("storage", handleStorageChange);
      };
    }
  }, [user]);

  const [enrichedAnonItems, setEnrichedAnonItems] = useState<CartItem[]>([]);

  // Enrich anonymous cart items with offer/product/bundle data
  useEffect(() => {
    if (!user && anonymousCart.items && anonymousCart.items.length > 0) {
      const enrichItems = async () => {
        const supabase = createSupabaseClient();
        const enriched = await Promise.all(
          anonymousCart.items.map(async (anonItem) => {
            let offerData: any = null;
            let productData: any = null;
            let bundleData: any = null;

            // Fetch offer data if this is an offer item
            if (anonItem.offer_id) {
              try {
                const response = await fetch(
                  `/api/offers/${anonItem.offer_id}`
                );
                if (response.ok) {
                  const { offer } = await response.json();
                  offerData = offer;
                }
              } catch (error) {
                console.error(
                  `Failed to fetch offer data for ${anonItem.offer_id}:`,
                  error
                );
              }
            }

            // Fetch product data if product_id exists
            if (anonItem.product_id) {
              try {
                const { data } = await supabase
                  .from("products")
                  .select("id, name, slug, images")
                  .eq("id", anonItem.product_id)
                  .single();
                if (data) productData = data;
              } catch (error) {
                console.error(
                  `Failed to fetch product data for ${anonItem.product_id}:`,
                  error
                );
              }
            }

            // Fetch bundle data if bundle_id exists
            if (anonItem.bundle_id) {
              try {
                const { data } = await supabase
                  .from("bundles")
                  .select("id, name, thumbnail_url")
                  .eq("id", anonItem.bundle_id)
                  .single();
                if (data) bundleData = data;
              } catch (error) {
                console.error(
                  `Failed to fetch bundle data for ${anonItem.bundle_id}:`,
                  error
                );
              }
            }

            return {
              id: anonItem.id,
              product_id: anonItem.product_id,
              bundle_id: anonItem.bundle_id,
              offer_id: anonItem.offer_id || null,
              black_friday_item_id: anonItem.black_friday_item_id || null,
              quantity: anonItem.quantity,
              price: anonItem.price,
              option: anonItem.option,
              created_at: anonItem.created_at,
              user_id: null,
              cart_id: null,
              products: productData,
              bundles: bundleData,
              offers: offerData,
              black_friday_items: null,
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
      items.reduce((acc, item) => {
        let itemPrice = 0;

        if (item.offer_id && item.offers) {
          // For offers, use price_per_slot
          itemPrice = item.offers.price_per_slot || item.price || 0;
        } else if (
          isProductOption(item.option) &&
          item.option.price !== undefined &&
          item.option.price !== null
        ) {
          // For products with options, use option price
          itemPrice = item.option.price;
        } else {
          // For regular products and bundles, use item price
          itemPrice = item.price || 0;
        }

        return acc + itemPrice * item.quantity;
      }, 0),
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
      // CONFIRMATION FOR PRIZES
      if (itemToRemove.price === 0) {
          const confirmed = window.confirm("⚠️ Are you sure you want to remove this FREE prize?\n\nOnce removed, you may lose this reward forever!");
          if (!confirmed) return;
      }

      try {
        if (user) {
          // Authenticated user - use API
          if (itemToRemove.id) {
            await removeCartItemMutation.mutateAsync(itemToRemove.id);
            await queryClient.invalidateQueries({ queryKey: cartQueryKey });
            showToast(
              `${itemToRemove.products?.name || itemToRemove.bundles?.name || "Item"} removed from cart`,
              "info"
            );
          }
        } else {
          // Anonymous user - use local storage
          if (itemToRemove.id) {
            anonymousCart.removeItem(itemToRemove.id);
            setForceUpdate((prev) => prev + 1);
            showToast("Item removed from cart", "info");
          }
        }
      } catch (error: any) {
        console.error("Failed to remove item:", error);
        showToast(
          error.message || "We couldn’t remove that item. Please try again.",
          "error"
        );
      }
    },
    [removeCartItemMutation, user, anonymousCart, queryClient, showToast]
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
                  cartItem.bundle_id !== null &&
                  cartItem.bundle_id !== undefined;
                const isOffer =
                  cartItem.offer_id !== null && cartItem.offer_id !== undefined;

                return {
                  product_id:
                    isBundle || isOffer ? null : cartItem.product_id || "", // Set to null for bundles and offers
                  bundle_id: isBundle ? cartItem.bundle_id : null, // Set to bundle_id for bundles, null for others
                  offer_id: isOffer ? cartItem.offer_id : null, // Set to offer_id for offers, null for others
                  black_friday_item_id:
                    isBundle || isOffer
                      ? null
                      : (cartItem as any).black_friday_item_id || null,
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
            setForceUpdate((prev) => prev + 1);
          } catch (error: any) {
            console.error("Failed to update anonymous cart quantity:", error);
            showToast(error.message || "Failed to update quantity", "error");
          }
        }
      }
    },
    [
      items,
      removeCartItemMutation,
      updateCartMutation,
      queryClient,
      user,
      anonymousCart,
      showToast,
    ]
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
    if (user) {
      return items.reduce((acc, item) => acc + item.quantity, 0);
    }
    // For anonymous users, use the hook's counter to reflect updates instantly
    return anonymousCart.getItemCount();
  }, [items, user, anonymousCart]);

  const dealsDiscount = useMemo(
    () => calculateCartDiscount(subtotal, items, isFirstOrder, !!user?.user_id),
    [subtotal, items, isFirstOrder]
  );

  // Check if cart is loading (for authenticated users) or anonymous cart is loading
  const isCartLoading = useMemo(() => {
    if (user) {
      return isLoading;
    } else {
      return anonymousCart.isLoading;
    }
  }, [user, isLoading, anonymousCart.isLoading]);

  const totalAmount = useMemo(
    () => Math.max(0, subtotal - dealsDiscount - voucherDiscount),
    [subtotal, dealsDiscount, voucherDiscount]
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
                Cart (
                <div className="inline-block w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                )
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

        {/* Free Delivery Progress Bar - Brand Aligned Design */}
        {items.length > 0 &&
          (() => {
            if (!user) {
                 return (
                    <div className="mb-2 mt-2 px-1 bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <Icon icon="solar:lock-keyhole-minimalistic-bold" className="w-4 h-4 text-yellow-600" />
                            <p className="text-xs font-bold text-yellow-800">Log in to unlock rewards!</p>
                         </div>
                         <Button variant="link" size="sm" className="h-auto p-0 text-[#1B6013] font-bold text-xs" onClick={() => router.push('/login')}>
                            Login
                         </Button>
                    </div>
                 )
            }

            const spend = subtotal;
            let target = 0;
            let rewardName = "";
            let unlocked = false;

            // Define Milestones
            const FREE_DELIV = BONUS_CONFIG?.SUBSEQUENT_FREE_DELIVERY?.min_spend || 50000;
            const CASHBACK = BONUS_CONFIG?.CASHBACK_THRESHOLD?.spend || 100000;
            const LOYALTY_1 = BONUS_CONFIG?.LOYALTY_TIERS?.[0]?.threshold || 200000;

             if (spend < FREE_DELIV) {
                target = FREE_DELIV;
                rewardName = "Free Delivery";
             } else if (spend < CASHBACK) {
                target = CASHBACK;
                rewardName = "₦2,000 Cash Back";
             } else if (spend < LOYALTY_1) {
                target = LOYALTY_1;
                rewardName = "1 Loyalty Point";
             } else {
                 const nextTier = BONUS_CONFIG.LOYALTY_TIERS.find(t => t.threshold > spend);
                 if (nextTier) {
                     target = nextTier.threshold;
                     rewardName = `${nextTier.points} Loyalty Points`;
                 } else {
                     unlocked = true;
                     rewardName = "Max Rewards Unlocked!";
                     target = spend;
                 }
             }

            const remaining = Math.max(0, target - spend);
            const percent = unlocked ? 100 : Math.min(100, (spend / target) * 100);

            return (
              <div className="mb-2 mt-2 px-1 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-[#1B6013]">{unlocked ? "Legendary Status" : "Next Reward"}</h4>
                  <div className="flex items-center gap-2 bg-[#1B6013]/5 px-3 py-1.5 rounded-full border border-[#1B6013]/10">
                    <span className="text-[10px] font-bold text-[#1B6013] uppercase tracking-wider">
                      {unlocked ? "All Unlocked" : rewardName}
                    </span>
                  </div>
                </div>

                <div className="min-h-[1.5rem] flex items-center justify-between gap-4">
                   {unlocked ? (
                      <p className="text-[13px] font-bold text-[#1B6013] flex items-center gap-1.5">
                        <Icon icon="solar:star-rainbow-bold-duotone" className="w-4 h-4" />
                        You&apos;ve unlocked everything!
                      </p>
                   ) : (
                    <p className="text-[12px] font-medium text-gray-500 leading-tight">
                      Add <span className="font-bold text-gray-900">{formatNaira(remaining)}</span> to win <span className="text-[#1B6013] font-bold">{rewardName}</span>!
                    </p>
                   )}
                  <span className="text-[10px] font-black text-[#1B6013] tabular-nums bg-[#1B6013]/5 px-2 py-1 rounded-lg">
                    {Math.round(percent)}%
                  </span>
                </div>
                
                <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-[#1B6013] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(27,96,19,0.3)]"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })()}

        <div className="flex grow flex-col space-y-10 overflow-y-auto px-1 pt-4 custom-scrollbar">
          {isLoading && <p className="text-center py-8 text-gray-400">Loading cart...</p>}
          {isError && <p className="text-center py-8 text-red-400">Error loading cart: {error?.error}</p>}

          {!isLoading &&
          !isError &&
          items.length === 0 &&
          totalQuantity === 0 ? (
            <div className="text-center text-gray-500 mt-20 space-y-4">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Icon icon="solar:cart-cross-linear" className="w-8 h-8 text-gray-300" />
               </div>
              <p className="text-base font-bold text-gray-900">Your cart is empty.</p>
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
          {/* Recommendations in scrollable area */}
          {!isLoading && !isError && <CartRecommendations />}
        </div>

        {totalQuantity > 0 && (
          <SheetFooter className="mt-auto">
            <div className="w-full">
              <Separator className="my-2" />
              <div className="h4-light flex justify-between">
                <p>Subtotal</p>
                <p>{formatNaira(subtotal)}</p>
              </div>
              {dealsDiscount > 0 && (
                <div className="text-sm font-bold text-[#1B6013] flex justify-between mt-1">
                   <p>{getAppliedDiscountLabel(subtotal, items, isFirstOrder, !!user?.user_id)}</p>
                   <p>-{formatNaira(dealsDiscount)}</p>
                </div>
              )}
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
