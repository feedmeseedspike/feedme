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
    return (
      <div key={productId} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {productGroup.product?.name || productGroup.bundle?.name ? (
            <p className="h6-bold text-lg">
              {productGroup.product?.name || productGroup.bundle?.name}
            </p>
          ) : (
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
          )}
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

    return (
      <React.Fragment>
        <div className="flex items-center gap-3 sm:gap-4 overflow-y-visible">
          <Link href={`/product/${item.products?.slug}`}>
            <Image
              width={64}
              height={64}
              src={
                productOption?.image ||
                item.products?.images?.[0] ||
                item.bundles?.thumbnail_url ||
                "/placeholder.png"
              }
              alt={item.products?.name || item.bundles?.name || "Product image"}
              className="h-[64px] rounded-[5px] border-[0.31px] border-[#DDD5DD] object-contain"
            />
          </Link>
          <div className="flex flex-col gap-[6px] w-full">
            <div className="flex justify-between">
              {productOption?.name && (
                <p className="h6-light !text-[14px]">{productOption.name}</p>
              )}
              <Trash2Icon
                className="size-4 cursor-pointer"
                onClick={() => handleRemoveItem(item as CartItem)}
                aria-label="Remove item"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[#101828] font-bold">
                {formatNaira(
                  (isProductOption(item.option) &&
                  item.option.price !== undefined &&
                  item.option.price !== null
                    ? item.option.price
                    : item.price) || 0
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
  const user = useUser();
  const prefetchCart = usePrefetchCart();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false); 

  const items: CartItem[] = useMemo(() => cartItems || [], [cartItems]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (acc, item) =>
          acc +
          ((isProductOption(item.option) &&
          item.option.price !== undefined &&
          item.option.price !== null
            ? item.option.price
            : item.price) || 0) *
            item.quantity,
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
        if (itemToRemove.id) {
          await removeCartItemMutation.mutateAsync(itemToRemove.id);
        }
      } catch (error: any) {
        console.error("Failed to remove item:", error);
      }
    },
    [removeCartItemMutation]
  );

  const handleQuantityChange = useCallback(
    async (itemToUpdate: CartItem, increment: boolean) => {
      const newQuantity = increment
        ? itemToUpdate.quantity + 1
        : itemToUpdate.quantity - 1;

      if (newQuantity >= 0) {
        const existingItemInCart = items.find(
          (cartItem) => cartItem.id === itemToUpdate.id
        );

        if (!existingItemInCart) {
          console.error(
            "AddToCart: handleQuantityChange - Item not found in current cart data.",
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

              // Determine if it's a bundle or a product
              const isBundle =
                cartItem.bundle_id !== null && cartItem.bundle_id !== undefined;

              return {
                product_id: isBundle ? null : cartItem.product_id || "", // Set to null for bundles
                bundle_id: isBundle ? cartItem.bundle_id : null, // Set to bundle_id for bundles, null for products
                option: isBundle ? null : cartItem.option, // Set option to null for bundles
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
      }
    },
    [items, removeCartItemMutation, updateCartMutation, queryClient]
  );

  // Remove voucher from localStorage when clearing cart
  const handleClearCart = useCallback(async () => {
    try {
      await clearCartMutation.mutateAsync();
      localStorage.removeItem("voucherCode");
      localStorage.removeItem("voucherDiscount");
    } catch (error: any) {
      console.error("Failed to clear cart:", error);
    }
  }, [clearCartMutation]);

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

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

  if (asLink) {
    return (
      <div className="relative" onMouseEnter={prefetchCart}>
        <ShoppingCart className="size-[24px]" />
        {items.length > 0 && (
          <span
            className="absolute -top-2 -right-2 bg-[#D0D5DD] w-5 h-5 flex items-center justify-center rounded-full text-xs text-white font-semibold "
            style={{ minWidth: 20, minHeight: 20 }}
          >
            {totalQuantity}
          </span>
        )}
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
        {items.length > 0 && (
          <span
            className="absolute -top-2 -right-[6px] sm:-right-2 bg-[#D0D5DD] w-5 h-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs text-white font-semibold "
            style={{ minWidth: 20, minHeight: 20 }}
          >
            {totalQuantity}
          </span>
        )}
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
          {items.length > 0 && (
            <span
              className="absolute -top-2 -right-[6px] sm:-right-2 bg-[#D0D5DD] w-5 h-5 flex items-center justify-center rounded-full text-[10px] sm:text-xs text-white font-semibold "
              style={{ minWidth: 20, minHeight: 20 }}
            >
              {totalQuantity}
            </span>
          )}
        </div>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-4 md:!max-w-xl">
        <SheetHeader className="flex justify-between w-full items-center">
          <SheetClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100">
            <ArrowLeft className="size-[22px]" />
          </SheetClose>
          <SheetTitle className="h2-bold flex-1 text-center">
            Cart ({totalQuantity})
          </SheetTitle>
          {items.length > 0 && (
            <p
              className="badge cursor-pointer w-fit select-none"
              onClick={handleClearCart}
            >
              Clear Cart
            </p>
          )}
        </SheetHeader>

        <div className="flex grow flex-col space-y-5 overflow-y-auto pt-1">
          {isLoading && <p>Loading cart...</p>}
          {isError && <p>Error loading cart: {error?.error}</p>}

          {!isLoading && !isError && items.length === 0 ? (
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

        {items.length > 0 && (
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
              <button
                className="mt-3 w-full btn-primary"
                onClick={handleCheckout}
              >
                Checkout
              </button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
});

Cart.displayName = "Cart";

export default Cart;
