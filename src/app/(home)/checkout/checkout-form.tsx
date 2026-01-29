"use client";

import { Button } from "@components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import Container from "@components/shared/Container";
import { Separator } from "@components/ui/separator";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSupabaseUser } from "@components/supabase-auth-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { ShippingAddressSchema } from "src/lib/validator";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import { setShippingAddress } from "src/store/features/cartSlice";
import { RootState } from "src/store";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";
import { useAddPurchaseMutation } from "src/queries/orders";
import { useVoucherValidationMutation } from "src/queries/vouchers";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Truck, Leaf, Check, Pencil, Trash2, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUserAddresses } from "src/queries/addresses";
import { UserAddress, AddressWithId } from "src/lib/validator";
import { useWalletBalanceQuery } from "src/queries/wallet";
import { processWalletPayment } from "src/lib/actions/wallet.actions";
import { Label } from "@components/ui/label";
import { useToast } from "src/hooks/useToast";
import { useCartQuery } from "src/queries/cart";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import { createVoucher } from "src/lib/actions/voucher.actions";
import {
  Step,
  Stepper,
  useStepper,
  type StepItem,
} from "../../../components/ui/stepper";
import { ShimmerButton } from "@components/magicui/shimmer-button";
import type { ShippingAddress } from "src/types/index";
import { useUser } from "src/hooks/useUser";
import { createClient } from "@/utils/supabase/client";
import { DeliveryLocation } from "@/types/delivery-location";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import {
  addAddressAction,
  deleteAddressAction,
} from "@/app/(dashboard)/account/addresses/actions";
import { clearCart } from "src/store/features/cartSlice";
import { useClearCartMutation, useRemoveFromCartMutation } from "src/queries/cart";
import axios from "axios";
import { sendPushNotification } from "@/lib/actions/pushnotification.action";
import { useAnonymousCart } from "src/hooks/useAnonymousCart";
import { createClient as createSupabaseClient } from "src/utils/supabase/client";
import { calculateCartDiscount, getDealMessages, getAppliedDiscountLabel, BONUS_CONFIG } from "src/lib/deals";
import { getCustomerOrdersAction } from "src/lib/actions/user.action";
import BonusProgressBar from "@components/shared/BonusProgressBar";

interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  offer?: CartItem["offers"];
  options: Record<string, CartItem>;
}

interface CartProductGroupDisplayProps {
  productGroup: GroupedCartItem;
  productId: string;
  onRemove?: (id: string) => void;
}

const CartProductGroupDisplay = React.memo(
  ({ productId, productGroup, onRemove }: CartProductGroupDisplayProps) => {
    const title = productGroup.product?.name || productGroup.bundle?.name || productGroup.offer?.title;
    if (!title) return null;

    return (
      <div key={productId} className="flex flex-col gap-1">
        {Object.entries(productGroup.options).map(
          ([optionKey, item]: [string, CartItem]) => (
            <CartItemDisplay
              key={item.id}
              item={item}
              onRemove={onRemove}
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
  onRemove?: (id: string) => void;
}

const CartItemDisplay = React.memo(({ item, onRemove }: CartItemDisplayProps) => {
  const productOption = isProductOption(item.option) ? item.option : null;

  return (
    <div className="flex items-center gap-6 py-6 border-b border-[#F2F0E9] last:border-0 group">
      <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-[#F5F3EE] border border-[#D1D1D1]">
        <Image
          src={
            productOption?.image ||
            item.products?.images?.[0] ||
            item.bundles?.thumbnail_url ||
            item.offers?.image_url ||
            "/product-placeholder.png"
          }
          alt={
            item.products?.name ||
            item.bundles?.name ||
            item.offers?.title ||
            "Product image"
          }
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-0 right-0 bg-[#2A2A2A] text-white px-1.5 py-0.5 text-[9px] font-black pointer-events-none">
          {item.quantity}×
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h4 className="text-base font-serif italic text-[#2A2A2A] line-clamp-1 leading-tight">
               {productOption?.name || item.products?.name || item.bundles?.name || item.offers?.title}
            </h4>
            {productOption?.name ? (
              <p className="text-[9px] text-[#B07D62] font-black uppercase tracking-widest">
                  Selection: {productOption.name}
              </p>
            ) : item.price === 0 ? (
                <p className="text-[9px] text-[#1B6013] font-black uppercase tracking-widest flex items-center gap-1">
                   <Icon icon="solar:gift-bold" className="w-3 h-3" /> Spin Prize
                </p>
            ) : (
                null
            )}
          </div>
          <p className="text-sm font-black text-[#2A2A2A] tabular-nums">
            {formatNaira(
              ((productOption?.price !== undefined && productOption?.price !== null
                ? productOption.price
                : item.price) || 0) * item.quantity
            )}
          </p>
        </div>
         <div className="mt-4 flex items-center justify-between">
            {onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    className="text-[9px] font-black text-gray-300 hover:text-red-500 transition-colors uppercase tracking-[0.2em] flex items-center gap-1.5 group/del"
                >
                    <Trash2 size={10} className="group-hover/del:scale-110 transition-transform" />
                    Discard item
                </button>
            )}
        </div>
      </div>
    </div>
  );
});

CartItemDisplay.displayName = "CartItemDisplay";

function useDeliveryLocations() {
  const supabase = createClient();
  return useQuery({
    queryKey: ["delivery-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_locations")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });
}

const shippingAddressDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        fullName: "Jeremiah Oyedele",
        street: "10, Yemisi Street",
        location: "Badagry",
        phone: "08144602273",
        email: "",
      }
    : {
        fullName: "",
        street: "",
        location: "",
        phone: "",
        email: "",
      };

interface OrderProcessingResult {
  success: boolean;
  error?: string;
  data?: any;
}

const steps = [
  { label: "Shipping Information" },
  { label: "Payment Method" },
  { label: "Review Order" },
] satisfies StepItem[];

interface CheckoutFormProps {
  addresses: AddressWithId[];
  walletBalance: number;
  user: any; // Use the correct user type if available
  deliveryLocations: DeliveryLocation[];
}

const CheckoutForm = ({
  addresses,
  walletBalance,
  user: initialUser,
  deliveryLocations,
}: CheckoutFormProps) => {
  const supabaseUser = useSupabaseUser();
  const user = supabaseUser || initialUser;

  // console.log("CheckoutForm: User:", user);
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: cartItems, isLoading, isError, error } = useCartQuery();
  const anonymousCart = useAnonymousCart();
  const [enrichedAnonItems, setEnrichedAnonItems] = useState<CartItem[]>([]);

  // Initialize items - strictly use memoization to prevent loops
  const items: CartItem[] = useMemo(() => {
    if (user) return cartItems || [];
    return enrichedAnonItems;
  }, [user, cartItems, enrichedAnonItems]);

  // Enrich anonymous cart items
  useEffect(() => {
    if (!user && anonymousCart.items && anonymousCart.items.length > 0) {
      const enrichItems = async () => {
        const supabase = createSupabaseClient();
        const enriched = await Promise.all(
          anonymousCart.items.map(async (anonItem) => {
            let offerData: any = null;
            let productData: any = null;
            let bundleData: any = null;

            if (anonItem.offer_id) {
              try {
                const response = await fetch(`/api/offers/${anonItem.offer_id}`);
                if (response.ok) {
                  const { offer } = await response.json();
                  offerData = offer;
                }
              } catch (e) {
                console.error(e);
              }
            }

            if (anonItem.product_id) {
              try {
                const { data } = await supabase
                  .from("products")
                  .select("id, name, slug, images, price, list_price, is_published")
                  .eq("id", anonItem.product_id)
                  .single();
                if (data) productData = data;
              } catch (e) {
                console.error(e);
              }
            }

            if (anonItem.bundle_id) {
              try {
                const { data } = await supabase
                  .from("bundles")
                  .select("id, name, thumbnail_url, price")
                  .eq("id", anonItem.bundle_id)
                  .single();
                if (data) bundleData = data;
              } catch (e) {
                console.error(e);
              }
            }

            return {
              id: anonItem.id,
              product_id: anonItem.product_id ?? null,
              bundle_id: anonItem.bundle_id ?? null,
              offer_id: anonItem.offer_id ?? null,
              black_friday_item_id: (anonItem as any).black_friday_item_id || null,
              quantity: anonItem.quantity,
              price: anonItem.price,
              option: anonItem.option,
              created_at: anonItem.created_at,
              cart_id: null,
              products: productData,
              bundles: bundleData,
              offers: offerData,
              black_friday_items: null,
            } satisfies CartItem;
          })
        );
        // Only update if specific content changes to avoid render loops
        setEnrichedAnonItems(prev => {
           if (JSON.stringify(prev) === JSON.stringify(enriched)) return prev;
           return enriched;
        });
      };
      enrichItems();
    }
  }, [user, anonymousCart.items]);

  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [isVoucherValid, setIsVoucherValid] = useState(false);
  const [voucherId, setVoucherId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState("paystack");

  const [autoAppliedReferralVoucher, setAutoAppliedReferralVoucher] =
    useState<boolean>(false);
  const [orderNote, setOrderNote] = useState("");

  const { mutateAsync: addPurchaseMutation } = useAddPurchaseMutation();
  const { mutateAsync: validateVoucherMutation } =
    useVoucherValidationMutation();
  const clearCartMutation = useClearCartMutation();
  const { mutateAsync: removeAuthItem } = useRemoveFromCartMutation();

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralStatusData, isLoading: isLoadingReferralStatus } =
    useQuery({
      queryKey: ["referralStatus", user?.user_id],
      queryFn: async () => {
        if (!user?.user_id) return null;
        const response = await fetch(
          `/api/referral/status?userId=${user.user_id}`
        );
        if (!response.ok) throw new Error("Failed to fetch referral status");
        return response.json();
      },
      enabled: !!user?.user_id,
    });

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddressDefaultValues,
    mode: "onChange",
  });

  const [userAddresses, setUserAddresses] =
    useState<AddressWithId[]>(addresses);
  const isLoadingAddresses = false;
  const isLoadingWalletBalance = false;

  // New state for modal and address selection
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    userAddresses && userAddresses.length > 0 ? userAddresses[0].id : null
  );
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddNewForm, setShowAddNewForm] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressWithId | null>(
    null
  );

  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<AddressWithId | null>(
    null
  );
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // Get the selected address object
  const selectedAddress =
    userAddresses?.find((addr) => addr.id === selectedAddressId) || null;

  // When selectedAddressId changes, update the form values
  useEffect(() => {
    if (selectedAddress) {
      const currentValues = shippingAddressForm.getValues();
      shippingAddressForm.reset({
        fullName: selectedAddress.label || user?.display_name || currentValues.fullName || "",
        street: selectedAddress.street || currentValues.street || "",
        location: selectedAddress.city || currentValues.location || "",
        phone: selectedAddress.phone || currentValues.phone || "",
        email: currentValues.email || user?.email || "",
      });
    } else if (user?.email) {
      const currentEmail = shippingAddressForm.getValues("email");
      if (!currentEmail) {
        shippingAddressForm.setValue("email", user.email);
      }
    }
  }, [
    selectedAddressId,
    selectedAddress,
    shippingAddressForm,
    user?.display_name,
  ]);

  const isAuthenticated = !!user;
  const [isFirstOrder, setIsFirstOrder] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      getCustomerOrdersAction(user.user_id).then(orders => {
        if (orders && orders.length === 0) {
            setIsFirstOrder(true);
        } else {
            setIsFirstOrder(false);
        }
      });
    } else {
        setIsFirstOrder(false);
    }
  }, [user, isAuthenticated]);


  // Add effect to load form state from localStorage if no saved addresses
  useEffect(() => {
    if (!userAddresses || userAddresses.length === 0) {
      const savedForm = localStorage.getItem("checkoutAddressForm");
      if (savedForm) {
        try {
          const parsed = JSON.parse(savedForm);
          shippingAddressForm.reset(parsed);
        } catch {}
      }
    }
  }, [userAddresses, shippingAddressForm]);
  // Save form state to localStorage on change if no saved addresses
  useEffect(() => {
    if (!userAddresses || userAddresses.length === 0) {
      const subscription = shippingAddressForm.watch((values) => {
        localStorage.setItem("checkoutAddressForm", JSON.stringify(values));
      });
      return () => subscription.unsubscribe();
    }
  }, [userAddresses, shippingAddressForm]);

  const formLocation = shippingAddressForm.watch("location");
  const locations = deliveryLocations;
  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        let itemPrice = 0;
        const productOption = isProductOption(item.option) ? item.option : null;
        if (item.bundle_id && item.bundles) {
          itemPrice = item.bundles.price || 0;
        } else if (item.product_id && item.products) {
          itemPrice =
            (productOption?.price !== undefined && productOption?.price !== null
              ? productOption.price
              : item.price) || 0;
        } else if (item.offer_id && item.offers) {
          itemPrice = item.offers.price_per_slot || 0;
        }
        return acc + itemPrice * item.quantity;
      }, 0),
    [items]
  );

  const dealsDiscount = useMemo(() => calculateCartDiscount(subtotal, items, isFirstOrder, isAuthenticated), [subtotal, items, isFirstOrder, isAuthenticated]);
  const dealMessages = useMemo(() => getDealMessages(subtotal, items, isFirstOrder, isAuthenticated), [subtotal, items, isFirstOrder, isAuthenticated]);
  const appliedDiscountLabel = useMemo(() => getAppliedDiscountLabel(subtotal, items, isFirstOrder, isAuthenticated), [subtotal, items, isFirstOrder, isAuthenticated]);

  // Free delivery logic: Per Doc V1.0, 50k+ spend awards free delivery on the NEXT order.
  // We only give 0 cost if a specific "Free Delivery" voucher is applied or if it's a special system override.
  const isFreeDeliveryVoucher = isVoucherValid && voucherCode.includes("FREE-DELIV");
  const qualifiesForFreeShipping = isFreeDeliveryVoucher;
  
  const cost = qualifiesForFreeShipping
    ? 0
    : locations.find((loc) => loc.name === formLocation)?.price || 2500;

  // Service charge: 7.5% of subtotal (total orders), do not subtract delivery fee
  /*
  const serviceCharge = useMemo(() => {
    // Only apply service charge if subtotal > 0
    if (subtotal <= 0) return 0;
    // Service charge is 7.5% of subtotal (total order), do not include delivery fee
    return 0.075 * subtotal;
  }, [subtotal]);
  */


  const staffDiscount = useMemo(() => {
    if (user?.is_staff) {
      // 10% off subtotal + service charge (not delivery fee or voucher discount)
      // return 0.1 * (subtotal + serviceCharge);
      return 0.1 * (subtotal - dealsDiscount); // Discount applies after deals? or before? Usually stackable or not. Let's assume on remaining.
    }
    return 0;
  }, [user, subtotal, dealsDiscount /*, serviceCharge*/]);

  const totalAmount = subtotal; // Keeps track of gross
  const totalAmountPaid =
    subtotal - dealsDiscount + cost /*+ serviceCharge*/ - voucherDiscount - staffDiscount;

  const isReferralVoucher = isVoucherValid && voucherCode.startsWith("REF-");

  const [voucherValidationAttempted, setVoucherValidationAttempted] =
    useState(false);

  // Restore voucher from localStorage on mount
  useEffect(() => {
    const savedCode = localStorage.getItem("voucherCode");
    const savedDiscount = localStorage.getItem("voucherDiscount");
    if (savedCode) setVoucherCode(savedCode);
    if (savedDiscount) setVoucherDiscount(Number(savedDiscount));
  }, []);

  const searchParams = useSearchParams();
  const voucherFromUrl = searchParams.get('apply_voucher');

  useEffect(() => {
    // Always check for referral and voucher for referred users
    const tryAutoApplyReferralVoucher = async () => {
      if (!user?.user_id || isVoucherValid || !subtotal || subtotal === 0)
        return;

      // 1. Check if referral exists for this user
      const referralStatusRes = await fetch(
        `/api/referral/status?userId=${user.user_id}`
      );
      const referralStatus = referralStatusRes.ok
        ? await referralStatusRes.json()
        : null;
      const isReferred =
        referralStatus?.data &&
        referralStatus.data.status === "applied" &&
        !referralStatus.data.referred_discount_given;

      if (isReferred) {
        // 2. Check if voucher already exists for this user
        const voucherCodeGuess = `REF-${user.user_id.slice(0, 8).toUpperCase()}`;
        const voucherRes = await fetch(`/api/voucher?code=${voucherCodeGuess}`);
        const voucherData = voucherRes.ok ? await voucherRes.json() : null;

        let codeToApply = voucherData?.data?.code;

        if (!codeToApply) {
          // 3. Create voucher if not found
          const voucherResult = await createVoucher({
            userId: user.user_id,
            discountType: "fixed",
            discountValue: 1000,
            name: "Referral Sign-up Discount",
            description: "Discount for signing up via a referral",
            maxUses: 1,
          });
          if (voucherResult.success && voucherResult.voucherCode) {
            codeToApply = voucherResult.voucherCode;
          } else {
            showToast("Failed to create referral voucher.", "error");
            return;
          }
        }

        // 4. Validate/apply the voucher
        if (codeToApply) {
          const result = await validateVoucherMutation({
            code: codeToApply,
            totalAmount: subtotal,
          });
          if (result.success && result.data) {
            const data: any = result.data;
            setVoucherCode(codeToApply);
            setIsVoucherValid(true);
            setVoucherDiscount(
              data.discountType === "percentage"
                ? (data.discountValue / 100) * subtotal
                : (data.discountValue ?? 0)
            );
            setVoucherId(data.id ?? null);
            setAutoAppliedReferralVoucher(true);
            showToast("Referral discount applied!", "success");
          } else {
            showToast(
              result.error || "Failed to apply referral voucher.",
              "error"
            );
          }
        }
      }
    };



    if (user && !isLoadingReferralStatus && !autoAppliedReferralVoucher && !voucherFromUrl) { // Don't run referral logic if URL voucher is present
      startTransition(() => {
        tryAutoApplyReferralVoucher().catch((error) => {

          setVoucherCode("");
          setVoucherDiscount(0);
          setIsVoucherValid(false);
          setVoucherId(null);
          setAutoAppliedReferralVoucher(false);
        });
      });
    }
  }, [
    user,
    isVoucherValid,
    subtotal,
    autoAppliedReferralVoucher,
    isLoadingReferralStatus,
    validateVoucherMutation,
    showToast,
    startTransition,
    voucherFromUrl,
  ]);

  useEffect(() => {
      // Auto-Apply Voucher from URL if present
      const autoApplyUrlVoucher = () => {
          if (!voucherFromUrl) return;
          if (voucherValidationAttempted) return; // Prevent loop or re-attempt if already tried
          if (isVoucherValid && voucherCode === voucherFromUrl) return; // Already applied

          setVoucherCode(voucherFromUrl);
          
          // Trigger validation
          startTransition(async () => {
            try {
                const result = await validateVoucherMutation({
                  code: voucherFromUrl,
                  totalAmount: subtotal || 0, // Use subtotal (might be 0 during loading)
                });
                
                if (result.success && result.data) {
                  const { id, discountType, discountValue } = result.data;
                  setIsVoucherValid(true);
                  setVoucherId(id);
                  const calculatedDiscount = discountType === "percentage" 
                        ? (discountValue / 100) * (subtotal || 0)
                        : discountValue;
                  const discount = Math.min(calculatedDiscount, subtotal || 9999999);
                  setVoucherDiscount(discount);
                  
                  localStorage.setItem("voucherCode", voucherFromUrl);
                  localStorage.setItem("voucherDiscount", discount.toString());
                  showToast("Voucher from reward auto-applied!", "success");
                  
                  // Clear param from URL to keep it clean
                  const newUrl = new URL(window.location.href);
                  newUrl.searchParams.delete('apply_voucher');
                  window.history.replaceState({}, '', newUrl.toString());

                } else {
                   if ((subtotal || 0) > 0) {
                       showToast(result.error || "Failed to apply reward voucher.", "error");
                   }
                }
            } catch (e) {
                console.error("Auto-apply voucher error", e);
            }
          });
          setVoucherValidationAttempted(true);
      };

      if (voucherFromUrl && !isVoucherValid && subtotal > 0) {
          autoApplyUrlVoucher();
      }
  }, [voucherFromUrl, subtotal, isVoucherValid, validateVoucherMutation, startTransition, showToast, voucherValidationAttempted]);

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
          // For offers, use a consistent key for options
          acc[key].options["offer-item"] = item;
        }
        return acc;
      },
      {}
    );
  }, [items]);

  const handleSelectSavedAddress = (addressId: string) => {
    const selectedAddress = userAddresses?.find(
      (addr: AddressWithId) => addr.id === addressId
    );
    if (selectedAddress) {
      shippingAddressForm.reset({
        fullName: user?.display_name || "",
        street: selectedAddress.street,
        location: selectedAddress.city,
        phone: selectedAddress.phone,
      });
    }
  };

  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    showToast("Shipping address saved successfully!", "success");
  };

  const handleVoucherValidation = async () => {
    if (!voucherCode) {
      showToast("Please enter a voucher code.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const result = await validateVoucherMutation({
          code: voucherCode,
          totalAmount: subtotal,
        });
        if (result.success && result.data) {
          const { id, discountType, discountValue } = result.data;
          setIsVoucherValid(true);
          setVoucherId(id);
          const calculatedDiscount =
            discountType === "percentage"
              ? (discountValue / 100) * totalAmount
              : discountValue;
          const discount = Math.min(calculatedDiscount, subtotal);
          setVoucherDiscount(discount);
          // Persist voucher in localStorage
          localStorage.setItem("voucherCode", voucherCode);
          localStorage.setItem("voucherDiscount", discount.toString());
          showToast("Voucher applied successfully!", "success");
        } else {
          setIsVoucherValid(false);
          // Remove voucher from localStorage
          localStorage.removeItem("voucherCode");
          localStorage.removeItem("voucherDiscount");
          showToast(result.error || "Voucher validation failed.", "error");
        }
      } catch (error: any) {
        setIsVoucherValid(false);
        // Remove voucher from localStorage
        localStorage.removeItem("voucherCode");
        localStorage.removeItem("voucherDiscount");
        showToast(
          error.message || "An error occurred while validating the voucher.",
          "error"
        );
      }
    });
  };

  const handleRemoveItem = async (itemId: string) => {
    if (user) {
      try {
        await removeAuthItem(itemId);
        showToast("Item removed", "success");
      } catch (e) {
        showToast("Failed to remove item", "error");
      }
    } else {
      anonymousCart.removeItem(itemId);
      showToast("Item removed from cart", "success");
    }
  };

  const handleOrderSubmission = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const isFormValid = await shippingAddressForm.trigger();
      if (!isFormValid) {
        showToast("Please fill out all required fields correctly.", "error");
        setIsSubmitting(false);
        return;
      }

      if (!items || items.length === 0) {
        showToast("Your cart is empty.", "error");
        setIsSubmitting(false);
        return;
      }

      startTransition(async () => {
        try {
          // Check for email
          const formValues = shippingAddressForm.getValues();
          const email = user?.email || formValues.email;
          const formLocation = formValues.location;

          console.log("DEBUG: Submission Details", { email, formLocation, paymentMethod: selectedPaymentMethod });

          // Email check removed to allow optional emails
          const orderData = {
            userId: user?.user_id || null,
            cartItems: (items || []).map((item) => ({
              productId: item.product_id || "",
              bundleId: item.bundle_id || "",
              offerId: item.offer_id || "",
              quantity: item.quantity,
              price: item.price,
              option: item.option,
            })),
            shippingAddress: shippingAddressForm.getValues(),
            totalAmount,
            totalAmountPaid,
            deliveryFee: cost,
            local_government: formLocation,
            voucherId: isVoucherValid ? voucherId : null,
            paymentMethod: selectedPaymentMethod,
            note: orderNote,
          };

          let result: OrderProcessingResult = {
            success: false,
            error: "Payment method not handled.",
          };

          if (selectedPaymentMethod === "wallet") {
            if (
              walletBalance === undefined ||
              walletBalance === null ||
              walletBalance < totalAmountPaid
            ) {
              showToast("Insufficient wallet balance.", "error");
              return;
            }
            result = await processWalletPayment(orderData);
            if (result.success) {
              // After successful order, update referral record if needed
              if (autoAppliedReferralVoucher && user?.user_id) {
                try {
                  await fetch(`/api/referral/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.user_id,
                      status: "qualified",
                      referred_discount_given: true,
                    }),
                  });
                } catch (err) {
                  console.error(
                    "Failed to update referral status after order:",
                    err
                  );
                }
              }
              // Send order confirmation emails to admin and user
              try {
                const emailRes = await fetch(
                  "/api/email/send-order-confirmation",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      adminEmail: "orders.feedmeafrica@gmail.com",
                      userEmail: user.email,
                      adminOrderProps: {
                        orderNumber: result.data.reference || result.data.orderId,
                        customerName:
                          user.display_name ||
                          shippingAddressForm.getValues().fullName,
                        customerPhone: shippingAddressForm.getValues().phone,
                        itemsOrdered: items.map((item) => ({
                          title:
                            item.products?.name ||
                            item.bundles?.name ||
                            item.offers?.title ||
                            "",
                          price: item.price,
                          quantity: item.quantity,
                          optionName: isProductOption(item.option)
                            ? item.option.name
                            : undefined,
                          customizations: isProductOption(item.option)
                            ? (item.option as any).customizations
                            : undefined,
                        })),
                        deliveryAddress: shippingAddressForm.getValues().street,
                        localGovernment:
                          shippingAddressForm.getValues().location,
                        discount: voucherDiscount,
                        totalAmount: totalAmountPaid,
                        orderNote: orderNote,
                        paymentMethod: selectedPaymentMethod,
                        isFirstOrder: isFirstOrder,
                        rewards: result.data.rewards, // Pass the rewards from the action result
                      },
                      userOrderProps: {
                        orderNumber: result.data.reference || result.data.orderId,
                        customerName:
                          user.display_name ||
                          shippingAddressForm.getValues().fullName,
                        customerPhone: shippingAddressForm.getValues().phone,
                        itemsOrdered: items.map((item) => ({
                          title:
                            item.products?.name ||
                            item.bundles?.name ||
                            item.offers?.title ||
                            "",
                          price: item.price,
                          quantity: item.quantity,
                          optionName: isProductOption(item.option)
                            ? item.option.name
                            : undefined,
                          customizations: isProductOption(item.option)
                            ? (item.option as any).customizations
                            : undefined,
                        })),
                        deliveryAddress: shippingAddressForm.getValues().street,
                        deliveryFee: cost,
                        serviceCharge: /*serviceCharge*/ 0, // Service charge commented out
                        totalAmount: subtotal,
                        totalAmountPaid: totalAmountPaid,
                        discount: voucherDiscount, // Pass discount
                        userid: user.user_id,
                      },
                    }),
                  }
                );
                const emailData = await emailRes.json();
                if (emailRes.ok && emailData.success) {
                  showToast("Order confirmation email sent!", "success");
                } else {
                  showToast(
                    emailData.error ||
                      "Order placed, but failed to send confirmation email.",
                    "error"
                  );
                }
              } catch (err) {
                showToast(
                  "Order placed, but failed to send confirmation email.",
                  "error"
                );
              }
              await sendPushNotification(
                "Success",
                "Order created successfully!",
                user.user_id
              );
              // Clear voucher from localStorage after successful order
              localStorage.removeItem("voucherCode");
              localStorage.removeItem("voucherDiscount");
              dispatch(clearCart());
              localStorage.removeItem("cart");
              await clearCartMutation.mutateAsync();
              showToast("Order created successfully!", "success");
              
              // Trigger Spin & Win widget
              localStorage.setItem("triggerSpin", "true");
              
              router.push(
                `/order/order-confirmation?orderId=${result.data.orderId}`
              );
            } else {
              showToast(result.error || "Failed to process order.", "error");
            }
            setIsSubmitting(false);
            return;
          } else if (selectedPaymentMethod === "paystack") {
            // For Paystack, create the order first, then pass orderId to the payment initializer
     
            // Create the order in the backend (simulate processWalletPayment but for paystack)
            const orderRes = await fetch("/api/orders/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: email,
                amount: totalAmountPaid,
                orderDetails: orderData,
              }),
            });
            const orderResult = await orderRes.json();
            if (
              !orderRes.ok ||
              !orderResult.success ||
              !orderResult.data?.orderId
            ) {
              showToast(
                orderResult.error || "Failed to create order.",
                "error"
              );
              setIsSubmitting(false);
              return;
            }
            // Now initialize Paystack with the orderId
            
            const response = await axios.post("/api/wallet/initialize", {
              email: email,
              amount: Math.round(totalAmountPaid),
              type: "direct_payment",
              orderId: orderResult.data.orderId,
              // Additional data for webhook processing
              autoAppliedReferralVoucher: autoAppliedReferralVoucher,
              customerName:
                user?.display_name || shippingAddressForm.getValues().fullName,
              customerPhone: shippingAddressForm.getValues().phone,
              itemsOrdered: items.map((item) => ({
                title: item.products?.name || item.bundles?.name || "",
                price: item.price,
                quantity: item.quantity,
                optionName: isProductOption(item.option)
                  ? item.option.name
                  : undefined,
                customizations: isProductOption(item.option)
                  ? (item.option as any).customizations
                  : undefined,
              })),
              deliveryAddress: shippingAddressForm.getValues().street,
              localGovernment: shippingAddressForm.getValues().location,
              deliveryFee: cost,
              serviceCharge: /*serviceCharge*/ 0, // Service charge commented out
              subtotal: subtotal,
              orderNote: orderNote,
            });
            if (response.data.authorization_url) {
              console.log(orderResult.data);
              if (orderResult.data.orderId) {
                localStorage.setItem("lastOrderId", orderResult.data.orderId);
              }

              const paymentUrl = response.data.authorization_url;
              
              // Non-blocking GTM event
              if (typeof window !== 'undefined' && (window as any).gtag) {
                try {
                  (window as any).gtag('event', 'conversion_event_purchase_2');
                } catch (e) {
                  console.error("GTM Error:", e);
                }
              }
              
              // Trigger Spin & Win widget after payment success
              localStorage.setItem("triggerSpin", "true");
              
              // Redirect immediately
              window.location.href = paymentUrl;
              
              setIsSubmitting(false);
              return; // Stop further execution
            } else if (response.data.is_free || response.data.success) {
               // Order is free or already succeeded
               showToast("Order placed successfully!", "success");
               localStorage.setItem("triggerSpin", "true");
               localStorage.setItem("lastOrderId", orderResult.data.orderId);
               router.push(`/order/order-confirmation?orderId=${orderResult.data.orderId}`);
               setIsSubmitting(false);
               return;
            } else {
              showToast(
                response.data.message ||
                  "Failed to initialize Paystack payment.",
                "error"
              );
              setIsSubmitting(false);
              return;
            }
          }
        } catch (error: any) {
          showToast(
            `Order processing error: ${
              error.message || "An unknown error occurred."
            }`,
            "error"
          );
        } finally {
          setIsSubmitting(false);
        }
      });
    } catch (error: any) {
      showToast(error.message || "An unexpected error occurred.", "error");
      setIsSubmitting(false);
    }
  };

  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="bg-[#F9FAFB] min-h-screen">
      <Container>
        <div className="py-12 md:py-16 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="max-w-6xl mx-auto">
            {/* Brand Header */}
            <div className="mb-12 text-center space-y-2">
                 <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Checkout</h1>
                 <p className="text-xs uppercase tracking-[0.2em] text-[#1B6013] font-bold">Secure your delivery</p>
            </div>

             <div className="flex flex-col lg:flex-row gap-16 items-start">
            {/* Left Column - Checkout Steps */}
            <div className="lg:w-[60%] w-full">
              <div className="space-y-6">
                <Stepper orientation="vertical" initialStep={0} steps={steps} className="checkout-stepper-new">
                  <Step label="Delivery Details">
                    <div className="mt-12 space-y-10">
                      <div className="pb-4 border-b border-[#D1D1D1]">
                         <h3 className="text-[12px] uppercase tracking-[0.25em] font-black text-[#2A2A2A]">1. Identification & Destination</h3>
                      </div>

                      {/* Address Summary Card */}
                      {selectedAddress ? (
                        <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-[#1B6013]/5 flex items-center justify-center">
                               <Icon icon="solar:map-point-wave-bold-duotone" className="w-6 h-6 text-[#1B6013]" />
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                       <span className="text-[10px] font-bold text-[#1B6013] uppercase tracking-wider">Delivery Destination</span>
                                       <p className="text-xl font-bold text-gray-900">{selectedAddress.label || selectedAddress.fullName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            {selectedAddress.street}
                                        </p>
                                        <p className="text-sm text-gray-900 font-bold tracking-tight uppercase">{selectedAddress.city}</p>
                                        <p className="text-xs text-gray-400 font-medium">{selectedAddress.phone}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowAddressModal(true);
                                        setShowAddNewForm(false);
                                    }}
                                    className="text-[10px] font-bold uppercase tracking-wider text-[#1B6013] border-b border-[#1B6013] pb-0.5 hover:text-green-700 transition-colors"
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-200 hover:border-green-200 transition-colors group cursor-pointer" onClick={() => setShowAddressModal(true)}>
                             <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-green-50 transition-colors">
                                <Icon icon="solar:map-point-add-bold-duotone" className="w-6 h-6 text-gray-400 group-hover:text-green-600 transition-colors" />
                             </div>
                             <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">No address selected</p>
                             <Button className="bg-[#1B6013] text-white rounded-xl shadow-lg shadow-green-100 h-10 px-6 font-bold text-xs uppercase tracking-widest">Add New Address</Button>
                        </div>
                      )}

                    {/* Modal for address selection/addition */}
                    <Dialog
                      open={showAddressModal}
                      onOpenChange={setShowAddressModal}
                    >
                      <DialogContent className="max-w-md w-full max-h-[90vh] rounded-3xl p-6">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">Select Delivery Address</DialogTitle>
                        </DialogHeader>
                        {!showAddNewForm ? (
                          <div
                            className="space-y-4 overflow-y-auto pr-2 custom-scrollbar"
                            style={{ maxHeight: "60vh" }}
                          >
                            {userAddresses && userAddresses.length > 0 ? (
                              <div className="space-y-3">
                                {userAddresses.map((address) => (
                                  <label
                                    key={address.id}
                                    className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${selectedAddressId === address.id ? "border-[#1B6013] bg-[#1B6013]/5 ring-1 ring-[#1B6013]" : "border-gray-100 hover:border-gray-200 bg-white"}`}
                                  >
                                    <div className="pt-1">
                                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAddressId === address.id ? "border-[#1B6013]" : "border-gray-300"}`}>
                                            {selectedAddressId === address.id && <div className="w-2.5 h-2.5 rounded-full bg-[#1B6013]" />}
                                         </div>
                                    </div>
                                    <input
                                      type="radio"
                                      checked={selectedAddressId === address.id}
                                      onChange={() =>
                                        setSelectedAddressId(address.id)
                                      }
                                      className="sr-only"
                                    />
                                    <div className="flex-1">
                                      <div className="font-bold text-gray-900 text-sm mb-1">
                                        {address.label || user?.display_name}
                                      </div>
                                      <div className="text-xs text-gray-500 leading-relaxed font-medium">
                                        {address.street}, {address.city}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1 font-medium">{address.phone}</div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <button
                                          type="button"
                                          className="p-2 text-gray-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingAddress(address);
                                            setShowAddNewForm(true);
                                            shippingAddressForm.reset({
                                              fullName: address.label || "",
                                              street: address.street,
                                              location: address.city,
                                              phone: address.phone,
                                            });
                                          }}
                                          title="Edit"
                                        >
                                          <Pencil size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAddressToDelete(address);
                                            setDeleteDialogOpen(true);
                                          }}
                                          title="Delete"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-gray-400 text-sm">
                                No saved addresses found.
                              </div>
                            )}
                            <button
                              className="w-full mt-2 py-3 border border-dashed border-gray-300 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2"
                              onClick={() => {
                                setShowAddNewForm(true);
                                setEditingAddress(null);
                                shippingAddressForm.reset({
                                  fullName: "",
                                  street: "",
                                  location: "",
                                  phone: "",
                                });
                              }}
                            >
                              <Icon icon="solar:add-circle-bold" className="w-4 h-4" />
                              Add New Address
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2">
                            <Form {...shippingAddressForm}>
                              <form
                                onSubmit={shippingAddressForm.handleSubmit(
                                  async (values) => {
                                    setIsAddingAddress(true);
                                    try {
                                      let address: any;
                                      const newDetails = {
                                          label: values.fullName || "Home",
                                          street: values.street,
                                          city: values.location,
                                          state: "",
                                          zip: "",
                                          country: "",
                                          phone: values.phone,
                                      };

                                      if (user) {
                                        // Authenticated: Use Server Action
                                        // Note: Logic implies creating new address even for edits (as per original code)
                                        address = await addAddressAction(newDetails);
                                      } else {
                                        // Anonymous: Local Object
                                        address = {
                                            id: editingAddress ? editingAddress.id : `temp-${Date.now()}`,
                                            ...newDetails,
                                            user_id: null
                                        };
                                      }

                                      if (editingAddress) {
                                        setUserAddresses((prev) =>
                                          prev.map((a) =>
                                            a.id === editingAddress.id
                                              ? address
                                              : a
                                          )
                                        );
                                      } else {
                                        setUserAddresses((prev) => [
                                          ...prev,
                                          address,
                                        ]);
                                      }
                                      setSelectedAddressId(address.id);
                                      showToast(
                                        editingAddress
                                          ? "Address updated!"
                                          : "Address added!",
                                        "success"
                                      );
                                      setShowAddNewForm(false);
                                      setShowAddressModal(false);
                                      setEditingAddress(null);
                                      localStorage.removeItem(
                                        "checkoutAddressForm"
                                      );
                                    } catch (err: any) {
                                      showToast(
                                        err.message || "Failed to add address",
                                        "error"
                                      );
                                    } finally {
                                      setIsAddingAddress(false);
                                    }
                                  }
                                )}
                                className="space-y-4"
                              >
                                <FormField
                                  control={shippingAddressForm.control}
                                  name="fullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter full name"
                                          {...field}
                                          className="rounded-xl bg-gray-50 border-gray-200"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                  <FormField
                                  control={shippingAddressForm.control}
                                  name="email"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter email address"
                                          {...field}
                                          required
                                          className="rounded-xl bg-gray-50 border-gray-200 focus:ring-green-500"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={shippingAddressForm.control}
                                  name="street"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter street address"
                                          {...field}
                                          className="rounded-xl bg-gray-50 border-gray-200"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={shippingAddressForm.control}
                                  name="location"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200">
                                            <SelectValue placeholder="Select your location" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {deliveryLocations.map((location) => (
                                            <SelectItem
                                              key={location.name}
                                              value={location.name}
                                            >
                                              {location.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={shippingAddressForm.control}
                                  name="phone"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter phone number"
                                          {...field}
                                          className="rounded-xl bg-gray-50 border-gray-200"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => {
                                      setShowAddNewForm(false);
                                      setEditingAddress(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    type="submit"
                                    className="bg-[#1B6013] text-white rounded-xl"
                                    disabled={isAddingAddress}
                                  >
                                    {isAddingAddress ? (
                                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    ) : null}
                                    {editingAddress
                                      ? "Update Address"
                                      : "Save Address"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </div>
                        )}
                        {!showAddNewForm && (
                          <DialogFooter>
                            <Button
                              type="button"
                              className="bg-[#1B6013] text-white w-full hover:bg-[#1B6013]/90 rounded-xl h-12 font-bold shadow-lg shadow-green-100"
                              onClick={() => setShowAddressModal(false)}
                            >
                              Confirm Selection
                            </Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* If no address is selected, show the form inline (first time user) */}
                    {userAddresses.length === 0 && (
                      <div className="mt-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Add Delivery Address</h3>
                        </div>
                        <Form {...shippingAddressForm}>
                          <form
                            onSubmit={shippingAddressForm.handleSubmit(
                              async (values) => {
                                setIsAddingAddress(true);
                                try {
                                  let address: any;
                                  if (user) {
                                    address = await addAddressAction({
                                      label: values.fullName || "Home",
                                      street: values.street,
                                      city: values.location,
                                      state: "",
                                      zip: "",
                                      country: "",
                                      phone: values.phone,
                                    });
                                  } else {
                                    // Handle guest/anonymous user - local state only
                                    address = {
                                      id: `temp-${Date.now()}`,
                                      label: values.fullName || "Guest",
                                      street: values.street,
                                      city: values.location,
                                      state: "",
                                      zip: "",
                                      country: "",
                                      phone: values.phone,
                                    };
                                  }

                                  setUserAddresses((prev) => [
                                    ...prev,
                                    address,
                                  ]);
                                  setSelectedAddressId(address.id);
                                  showToast("Address added!", "success");
                                  setShowAddNewForm(false);
                                  setShowAddressModal(false);
                                  setEditingAddress(null);
                                  localStorage.removeItem(
                                    "checkoutAddressForm"
                                  );
                                } catch (err: any) {
                                  showToast(
                                    err.message || "Failed to add address",
                                    "error"
                                  );
                                } finally {
                                  setIsAddingAddress(false);
                                }
                              }
                            )}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                control={shippingAddressForm.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                     <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                        placeholder="Enter full name"
                                        {...field}
                                        disabled={isAddingAddress}
                                        className="rounded-xl bg-gray-50 border-gray-200"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={shippingAddressForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Email Address <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                        placeholder="Enter email address"
                                        {...field}
                                        required
                                        disabled={isAddingAddress || !!user?.email}
                                        className="rounded-xl bg-gray-50 border-gray-200 focus:ring-green-500"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <FormField
                              control={shippingAddressForm.control}
                              name="street"
                              render={({ field }) => (
                                <FormItem>
                                   <FormLabel>Address <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter street address"
                                      {...field}
                                      disabled={isAddingAddress}
                                      className="rounded-xl bg-gray-50 border-gray-200"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                control={shippingAddressForm.control}
                                name="location"
                                render={({ field }) => (
                                    <FormItem>
                                     <FormLabel>Location <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        disabled={isAddingAddress}
                                    >
                                        <FormControl>
                                        <SelectTrigger className="rounded-xl bg-gray-50 border-gray-200">
                                            <SelectValue placeholder="Select your location" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {deliveryLocations.map((location) => (
                                            <SelectItem
                                            key={location.name}
                                            value={location.name}
                                            >
                                            {location.name}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <FormField
                                control={shippingAddressForm.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                     <FormLabel>Phone Number <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                        placeholder="Enter phone number"
                                        {...field}
                                        disabled={isAddingAddress}
                                        className="rounded-xl bg-gray-50 border-gray-200"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                            </div>
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="bg-[#1B6013] text-white rounded-xl h-12 px-8 font-bold uppercase tracking-widest shadow-lg shadow-green-100 w-full md:w-auto"
                                    disabled={isAddingAddress}
                                >
                                    {isAddingAddress ? (
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    ) : null}
                                    Save Address to Continue
                                </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    )}
                  </div>
                </Step>

                  <Step label="Secure Payment">
                    <div className="mt-8 space-y-8">
                       <div className="mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Payment Method</h3>
                            <p className="text-sm text-gray-500 mt-1">Select a secure payment method</p>
                        </div>

                         <div className="grid grid-cols-1 gap-6">
                        <div
                          className={`p-6 border-2 transition-all cursor-pointer relative overflow-hidden rounded-2xl ${
                            selectedPaymentMethod === "paystack"
                              ? "border-[#1B6013] bg-[#1B6013]/5 ring-1 ring-[#1B6013]"
                              : "border-gray-100 bg-white hover:border-gray-300"
                          }`}
                          onClick={() => setSelectedPaymentMethod("paystack")}
                        >
                            {selectedPaymentMethod === "paystack" && (
                                 <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-[#1B6013] text-white rounded-full p-1">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                 </div>
                            )}
                           <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 ${
                                    selectedPaymentMethod === "paystack" ? "bg-[#1B6013] text-white" : "bg-gray-50 text-gray-400"
                                }`}>
                                    <Icon icon="solar:card-bold-duotone" className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-lg text-gray-900">Debit Card / Transfer</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Powered by Paystack</p>
                                </div>
                           </div>
                        </div>

                        {/* Wallet Card */}
                        <div
                          className={`p-6 border-2 transition-all cursor-pointer relative overflow-hidden rounded-2xl ${
                            selectedPaymentMethod === "wallet"
                              ? "border-[#1B6013] bg-[#1B6013]/5 ring-1 ring-[#1B6013]"
                              : "border-gray-100 bg-white hover:border-gray-300"
                          } ${walletBalance < totalAmountPaid ? "opacity-60 grayscale cursor-not-allowed" : ""}`}
                          onClick={() => {
                             if (walletBalance >= totalAmountPaid) setSelectedPaymentMethod("wallet");
                          }}
                        >
                             {selectedPaymentMethod === "wallet" && (
                                 <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-[#1B6013] text-white rounded-full p-1">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                 </div>
                            )}
                           <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 ${
                                    selectedPaymentMethod === "wallet" ? "bg-[#1B6013] text-white" : "bg-gray-50 text-gray-400"
                                }`}>
                                    <Icon icon="solar:wallet-bold-duotone" className="w-7 h-7" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-baseline justify-between">
                                        <h4 className="font-bold text-lg text-gray-900">Personal Wallet</h4>
                                        <span className="font-bold text-lg text-gray-900">{formatNaira(walletBalance || 0)}</span>
                                    </div>
                                    
                                    {walletBalance < totalAmountPaid ? (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-red-50 text-red-600 text-[9px] px-2 py-0.5 font-bold uppercase tracking-widest rounded">Low Balance</span>
                                            <Link href="/account/wallet" className="text-[10px] font-bold text-[#1B6013] hover:underline uppercase tracking-widest">Recharge</Link>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Available Credit</p>
                                    )}
                                </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  </Step>

                   <Step label="Review Order">
                    <div className="mt-12 space-y-10">
                       <div className="pb-4 border-b border-gray-100">
                         <h3 className="text-sm uppercase tracking-wider font-bold text-gray-900">Step 3. Confirm Summary</h3>
                      </div>

                        <div className="space-y-8">
                            <div className="p-8 border border-gray-100 bg-white rounded-2xl flex items-start gap-6 shadow-sm">
                                <div className="w-12 h-12 flex items-center justify-center text-[#1B6013] bg-[#1B6013]/5 rounded-full shrink-0">
                                    <Icon icon="solar:verified-check-bold-duotone" className="w-8 h-8" />
                                </div>
                                <div className="space-y-2">
                                     <h4 className="text-lg font-bold text-gray-900">Order Readiness</h4>
                                     <p className="text-sm text-gray-500 leading-relaxed">
                                        You are ordering <strong className="text-gray-900">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</strong> to be delivered to <strong className="text-gray-900">{selectedAddress?.city}</strong>.
                                     </p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                              <Label htmlFor="orderNote" className="text-xs font-bold text-gray-700 uppercase tracking-wider pl-1">
                                Delivery Instructions
                              </Label>
                              <Textarea
                                id="orderNote"
                                placeholder="E.g. Call upon arrival, Leave with security..."
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                className="resize-none h-32 rounded-xl border-gray-200 text-sm focus:border-[#1B6013] focus:ring-[#1B6013] transition-all bg-white p-5 shadow-sm"
                              />
                            </div>
                        </div>
                    </div>
                  </Step>
                <Footer
                  shippingAddressForm={shippingAddressForm}
                  showToast={showToast}
                  isSubmitting={isSubmitting}
                  setIsSubmitting={setIsSubmitting}
                  handleOrderSubmission={handleOrderSubmission}
                  items={items}
                />
              </Stepper>
            </div>
          </div>

            <div className="lg:w-[40%] w-full">
              <div className="sticky top-24">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 space-y-10 shadow-none relative overflow-hidden group">
                    <div className="flex items-center justify-between">
                         <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              Order Summary
                         </h3>
                         <span className="text-[10px] font-bold text-[#1B6013] bg-[#1B6013]/5 px-2 py-0.5 rounded-md">{totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}</span>
                    </div>
                    
                    <div className="pb-6 border-b border-slate-200/60">
                        <BonusProgressBar subtotal={subtotal} isFirstOrder={isFirstOrder} isAuthenticated={isAuthenticated} />
                    </div>

                    <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar -mx-2 px-2">
                      {items.length === 0 ? (
                         <div className="py-12 text-center text-slate-400 text-sm font-medium">
                           Your cart is currently empty
                         </div>
                      ) : (
                        Object.entries(groupedItems).map(([productId, productGroup]: [string, GroupedCartItem]) => (
                          <CartProductGroupDisplay
                            key={productId}
                            productId={productId}
                            productGroup={productGroup}
                            onRemove={handleRemoveItem}
                          />
                        ))
                      )}
                    </div>

                    <div className="space-y-6 pt-10 border-t border-slate-200/60 relative">
                       <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
                        <span className="font-bold text-slate-900">{formatNaira(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Delivery Fee</span>
                        <span className="font-bold text-slate-900">
                          {qualifiesForFreeShipping ? (
                             <span className="text-[#1B6013] flex items-center gap-1 font-black uppercase text-[10px] tracking-wider">
                                <Icon icon="solar:check-circle-bold" className="w-3.5 h-3.5" />
                                Complimentary
                            </span>
                          ) : formLocation ? (
                            <span className="text-sm font-bold">{formatNaira(cost)}</span>
                          ) : (
                            <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider italic">Calculated next</span>
                          )}
                        </span>
                      </div>
                      
                       {dealsDiscount > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-slate-100">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-[#1B6013] font-bold uppercase tracking-wider text-[10px]">{appliedDiscountLabel}</span>
                            <span className="font-bold text-[#1B6013]">-{formatNaira(dealsDiscount)}</span>
                          </div>
                        </div>
                      )}

                       {isVoucherValid && (
                        <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-slate-100">
                          <span className="font-bold text-[#1B6013] text-[10px] uppercase tracking-wider">Promo Applied</span>
                          <span className="font-black text-[#1B6013]">-{formatNaira(voucherDiscount)}</span>
                        </div>
                      )}

                      <div className="pt-8 border-t border-slate-200/60 flex justify-between items-end">
                        <span className="text-lg font-bold text-slate-900">Final Total</span>
                        <div className="text-right">
                             <div className="text-3xl font-black text-[#1B6013] tracking-tighter leading-none tabular-nums">
                                {formatNaira(totalAmountPaid)}
                             </div>
                        </div>
                      </div>
                    </div>

                     <div className="pt-4 border-t border-slate-200/60">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Voucher Code</h4>
                        <div className="flex gap-2">
                           <Input
                             placeholder="ENTER CODE"
                             value={voucherCode}
                             onChange={(e) => {
                               setVoucherCode(e.target.value);
                               setVoucherValidationAttempted(false);
                             }}
                             className="flex-1 h-11 rounded-lg bg-white border-slate-200 font-bold text-sm focus:border-[#1B6013] focus:ring-0 transition-all uppercase px-4 shadow-none"
                             disabled={isReferralVoucher || isSubmitting}
                           />
                           <Button 
                               onClick={handleVoucherValidation}
                               disabled={!voucherCode || isSubmitting}
                               className="h-11 px-6 rounded-lg font-bold text-[10px] uppercase tracking-widest bg-slate-900 text-white hover:bg-black transition-all border-0 shadow-none"
                           >
                               Apply
                           </Button>
                        </div>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        </Container>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm w-full">
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-700">
            Are you sure you want to delete this address?
            <div className="mt-2 text-sm text-gray-500">
              {addressToDelete && (
                <>
                  <div className="font-semibold">
                    {addressToDelete.label || user?.display_name}
                  </div>
                  <div>
                    {addressToDelete.street}, {addressToDelete.city} |{" "}
                    {addressToDelete.phone}
                  </div>
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="bg-gray-100 text-gray-700 hover:bg-gray-200"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-[#1B6013]/90 text-white hover:bg-[#1B6013]"
              disabled={isDeletingAddress}
              onClick={async () => {
                if (addressToDelete) {
                  setIsDeletingAddress(true);
                  await deleteAddressAction(addressToDelete.id);
                  setUserAddresses((prev) =>
                    prev.filter((a) => a.id !== addressToDelete.id)
                  );
                  if (selectedAddressId === addressToDelete.id)
                    setSelectedAddressId(userAddresses[0]?.id || null);
                  showToast("Address deleted!", "success");
                  setDeleteDialogOpen(false);
                  setAddressToDelete(null);
                  setIsDeletingAddress(false);
                }
              }}
            >
              {isDeletingAddress ? (
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

interface FooterProps {
  shippingAddressForm: any; // Use the actual type for useForm return
  showToast: (message: string, type?: "success" | "error") => void;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  handleOrderSubmission: () => Promise<void>;
  items: CartItem[];
}

function Footer({
  shippingAddressForm,
  showToast,
  isSubmitting,
  setIsSubmitting,
  handleOrderSubmission,
  items,
}: FooterProps) {
  const { nextStep, prevStep, isLastStep, activeStep } = useStepper();

  const handleNext = async () => {
    if (activeStep === 0) {
      // Corresponds to Shipping Information
      const isFormValid = await shippingAddressForm.trigger();
      if (!isFormValid) {
        const errors = shippingAddressForm.formState.errors;
        const errorMessages = Object.values(errors)
          .map((err: any) => err.message)
          .filter(Boolean);
        
        showToast(
          errorMessages[0] || "Please fill out all required shipping fields correctly.",
          "error"
        );
        return;
      }
    }
    nextStep();
  };

  const handlePrev = () => {
    prevStep();
  };

  const handlePlaceOrder = async () => {
    await handleOrderSubmission();
  };

  return (
     <div className="flex w-full flex-col md:flex-row items-center justify-between mt-12 pt-8 border-t border-gray-100 gap-8">
      <div>
        {activeStep !== 0 && (
          <button
            onClick={handlePrev}
            className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-all flex items-center gap-2 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Previous
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
        {activeStep === 0 && (
            <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="rounded-2xl bg-[#1B6013] text-white hover:bg-[#15490e] px-10 h-16 font-bold text-lg tracking-tight shadow-lg shadow-green-100 transition-all flex gap-4 items-center w-full sm:w-auto justify-center"
            >
                Continue to Payment
                <ArrowRight size={20} />
            </Button>
        )}

        {activeStep === 1 && (
            <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="rounded-2xl bg-[#1B6013] text-white hover:bg-[#15490e] px-10 h-16 font-bold text-lg tracking-tight shadow-lg shadow-green-100 transition-all flex gap-4 items-center w-full sm:w-auto justify-center"
            >
                Review Order Details
                <ArrowRight size={20} />
            </Button>
        )}

        {isLastStep && (
            <Button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="rounded-2xl bg-[#1B6013] text-white hover:bg-[#15490e] px-10 h-16 font-bold text-lg tracking-tight shadow-lg shadow-green-100 flex items-center justify-center gap-4 transition-all w-full sm:w-auto"
            >
                {isSubmitting ? (
                    <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                    <Icon icon="solar:lock-password-bold" className="w-6 h-6" />
                )}
                {isSubmitting ? "Processing..." : "Place Order Now"}
            </Button>
        )}
      </div>
    </div>
  );
}

// Type guard for ProductOption
function isProductOption(option: unknown): option is ProductOption {
  return (
    typeof option === "object" &&
    option !== null &&
    "price" in option &&
    typeof (option as any).price === "number"
  );
}

export default CheckoutForm;
