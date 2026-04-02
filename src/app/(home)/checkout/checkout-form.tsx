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
import { formatNaira, cn } from "src/lib/utils";

import { useVoucherValidationMutation, useUserVouchersQuery } from "src/queries/vouchers";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Truck, Leaf, Check, Pencil, Trash2, Loader2, ArrowLeft, ArrowRight, Search, MapPin, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { UserAddress, AddressWithId } from "src/lib/validator";

import { processWalletPayment } from "src/lib/actions/wallet.actions";
import { Label } from "@components/ui/label";
import { useToast } from "src/hooks/useToast";
import { useCartQuery } from "src/queries/cart";
import { CartItem, ProductOption } from "src/lib/actions/cart.actions";
import { createVoucher } from "src/lib/actions/voucher.actions";

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
  updateAddressAction,
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
import { Database } from "src/utils/database.types";
import { useLocation } from "@components/shared/header/Location";
import lagosAreas from "@/lib/lagos-areas.json";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";




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
        <div className="absolute top-0 right-0 bg-[#2A2A2A] text-white px-1.5 py-0.5 text-[9px] font-bold pointer-events-none">
          {item.quantity}×
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center min-w-0">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <h4 className="text-base   text-[#2A2A2A] line-clamp-1 leading-tight">
               {item.products?.name || item.bundles?.name || item.offers?.title || item.meta?.name || productOption?.name}
            </h4>
            {productOption?.name && productOption.name !== (item.products?.name || item.bundles?.name || item.offers?.title || item.meta?.name) ? (
              <p className="text-[9px] text-[#B07D62] font-bold uppercase tracking-wider">
                  Selection: {productOption.name}
              </p>
            ) : item.price === 0 ? (
                <p className="text-[9px] text-[#FF9900] font-bold uppercase tracking-wider flex items-center gap-1">
                   <Icon icon="solar:gift-bold" className="w-3 h-3" /> Spin Prize
                </p>
            ) : (
                null
            )}
          </div>
          <p className="text-sm font-bold text-[#2A2A2A] tabular-nums">
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
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors group/del"
                    title="Remove Item"
                >
                    <Trash2 size={16} className="group-hover/del:scale-110 transition-transform" />
                    <span className="sr-only">Remove</span>
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
        firstName: "Jeremiah",
        lastName: "Oyedele",
        street: "10, Yemisi Street",
        location: "Badagry",
        phone: "08144602273",
        additionalPhone: "",
        email: "",
      }
    : {
        firstName: "",
        lastName: "",
        street: "",
        location: "",
        phone: "",
        additionalPhone: "",
        email: "",
      };

interface OrderProcessingResult {
  success: boolean;
  error?: string;
  data?: any;
}


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
  const { currentLocationId, locationName: globalLocationName, deliveryPrice: globalDeliveryPrice, setCurrentLocation, locations: globalLocations } = useLocation();


  // console.log("CheckoutForm: User:", user);
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: cartItems } = useCartQuery();
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

  const [isVoucherPending, startTransition] = useTransition();
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
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);
  const [isNewAddressLocationPopoverOpen, setIsNewAddressLocationPopoverOpen] = useState(false);
  const [isGiftMode, setIsGiftMode] = [false, () => {}]; // Commented out for production: useState(false);
  const [senderName, setSenderName] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftErrors, setGiftErrors] = useState<{ senderName?: string; email?: string }>({});


  const { mutateAsync: validateVoucherMutation } =
    useVoucherValidationMutation();
  const clearCartMutation = useClearCartMutation();
  const { mutateAsync: removeAuthItem } = useRemoveFromCartMutation();

  const { showToast } = useToast();


  const { data: referralStatus, isLoading: isLoadingReferralStatus } =
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
      staleTime: 5 * 60 * 1000, // 5 minutes stability
    });

  const { data: userVouchers } = useUserVouchersQuery(user?.user_id);

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddressDefaultValues,
    mode: "onChange",
  });

  const [userAddresses, setUserAddresses] =
    useState<AddressWithId[]>(addresses);


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
      const fullName = selectedAddress.label || user?.display_name || "";
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Use setValue instead of reset to avoid clearing other form states unintentionally
      // and only update if the values are actually different to prevent unnecessary renders
      const currentLoc = shippingAddressForm.getValues("location");
      if (selectedAddress.city && currentLoc !== selectedAddress.city) {
         shippingAddressForm.setValue("location", selectedAddress.city);
      }
      
      shippingAddressForm.reset({
        firstName: firstName || "",
        lastName: lastName || "",
        street: selectedAddress.street || "",
        landmark: selectedAddress.zip || "",
        region: selectedAddress.state || "Lagos",
        location: selectedAddress.city || "",
        phone: selectedAddress.phone || "",
        additionalPhone: (selectedAddress as any).additionalPhone || "",
        email: user?.email || "",
      });

      // Synchronize saved address with global location
      if (selectedAddress.city) {
        const matchingLoc = globalLocations.find(l => l.name === selectedAddress.city);
        if (matchingLoc) {
          if (matchingLoc.id !== currentLocationId) {
            setCurrentLocation(matchingLoc);
          }
        }
      }
    }
  }, [selectedAddressId, selectedAddress?.id, user?.email, user?.display_name, currentLocationId, globalLocations, setCurrentLocation, shippingAddressForm]); // dependencies added while being mindful of potential loops

  // Removed aggressive location sync to prevent form overwrites
  // The location will be synced only when an address is explicitly selected below.


  // Load guest addresses
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem("guestAddresses");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUserAddresses(parsed);
            if (!selectedAddressId) {
                setSelectedAddressId(parsed[0].id);
            }
          }
        } catch (e) {}
      }
    }
  }, [user, selectedAddressId]);

  // Save guest addresses on change
  useEffect(() => {
    if (!user) {
      if (userAddresses.length > 0) {
        localStorage.setItem("guestAddresses", JSON.stringify(userAddresses));
      } else {
        localStorage.removeItem("guestAddresses");
      }
    }
  }, [user, userAddresses]);

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

  const hasFreePrize = useMemo(() => items.some(item => item.price === 0), [items]);

  const dealsDiscount = useMemo(() => {
    if (isVoucherValid || hasFreePrize) return 0;
    return calculateCartDiscount(subtotal, items, isFirstOrder, isAuthenticated);
  }, [subtotal, items, isFirstOrder, isAuthenticated, isVoucherValid, hasFreePrize]);
  
  const dealMessages = useMemo(() => {
    if (isVoucherValid || hasFreePrize) return [];
    return getDealMessages(subtotal, items, isFirstOrder, isAuthenticated);
  }, [subtotal, items, isFirstOrder, isAuthenticated, isVoucherValid, hasFreePrize]);
  
  const appliedDiscountLabel = useMemo(() => getAppliedDiscountLabel(subtotal, items, isFirstOrder, isAuthenticated), [subtotal, items, isFirstOrder, isAuthenticated]);

  // Free delivery logic: Per Doc V1.0, 50k+ spend awards free delivery on the NEXT order.
  // We only give 0 cost if a specific "Free Delivery" voucher is applied or if it's a special system override.
  const isFreeDeliveryVoucher = isVoucherValid && voucherCode.includes("FREE-DELIV");
  const qualifiesForFreeShipping = isFreeDeliveryVoucher;
  
  const cost = useMemo(() => {
    if (isGiftMode) return 1500; // Flat gift delivery fee
    if (qualifiesForFreeShipping) return 0;
    if (!formLocation) return 2500;

    // 1. Try exact match in delivery locations (LGAs or Specific Areas like Ajah)
    const exactLoc = locations.find((loc) => 
      loc.name.toLowerCase().replace(/[^a-z0-9]/g, "") === formLocation.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (exactLoc) return exactLoc.price;

    // 2. Try mapping from lagosAreas (Area -> LGA)
    const areaMapping = lagosAreas.find(area => 
      area.name.toLowerCase().trim() === formLocation.toLowerCase().trim()
    );
    
    if (areaMapping) {
      // Direct mapping check first (e.g. if Ajah is listed as LGA in JSON)
      const specificLoc = locations.find(loc => 
        loc.name.toLowerCase().trim() === areaMapping.name.toLowerCase().trim()
      );
      if (specificLoc) return specificLoc.price;

      // LGA Mapping Logic
      const lgaMap: Record<string, string> = {
        "Alimosho": "Alimosho",
        "Yaba": "Lagos Mainland",
        "Somolu": "Shomolu",
        "Ikoyi": "Eti-Osa",
        "Lekki": "Eti-Osa",
        "Iyana Ipaja": "Iyana Ipaja",
        "Ifako-Ijaiye": "Ifako/Ijaye",
        "Ketu": "Kosofe",
        "Maryland": "Ikeja",
        "Ebute Metta": "Lagos Mainland",
        "Berger": "Agege", // Fallback for Berger
      };

      const targetLga = lgaMap[areaMapping.lga] || areaMapping.lga;
      const lgaLoc = locations.find(loc => {
        const dbLga = loc.name.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const searchLga = targetLga.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        return dbLga === searchLga || dbLga.includes(searchLga) || searchLga.includes(dbLga);
      });
      
      if (lgaLoc) return lgaLoc.price;
    }

    // 3. Fallback to global or default
    return (formLocation === globalLocationName ? globalDeliveryPrice : 3500); // 3500 as standard fallback
  }, [qualifiesForFreeShipping, locations, formLocation, globalLocationName, globalDeliveryPrice, isGiftMode]);


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
    // No stacking: Staff discount is 0 if a voucher or free gift is present
    if (user?.is_staff && !isVoucherValid && !hasFreePrize) {
      return 0.1 * (subtotal - dealsDiscount);
    }
    return 0;
  }, [user, subtotal, dealsDiscount, isVoucherValid, hasFreePrize]);

  const totalAmount = subtotal; // Keeps track of gross
  const totalAmountPaid =
    subtotal - dealsDiscount + cost /*+ serviceCharge*/ - (isFreeDeliveryVoucher ? 0 : voucherDiscount) - staffDiscount;

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
      if (!user?.user_id || isVoucherValid || !subtotal || subtotal === 0 || hasFreePrize)
        return;

      // 1. Use the data from the query directly
      const isReferred =
        referralStatus?.data &&
        referralStatus.data.status === "applied" &&
        !referralStatus.data.referred_discount_given;

      if (isReferred) {
        // 2. Check if voucher already exists for this user
        const voucherCodeGuess = `REF-${user.user_id.slice(0, 8).toUpperCase()}`;
        
        // Use a faster check
        const supabase = createClient();
        const { data: voucherData } = await supabase
          .from('vouchers')
          .select('code, id, discount_type, discount_value')
          .ilike('code', voucherCodeGuess)
          .maybeSingle();

        let codeToApply = voucherData?.code;

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
            console.error("Failed to create referral voucher.");
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
          }
        }
      }
    };

    if (user && !isVoucherValid && !isLoadingReferralStatus && !autoAppliedReferralVoucher && !voucherFromUrl && !hasFreePrize && referralStatus) { 
      startTransition(() => {
        tryAutoApplyReferralVoucher().catch((error) => {
          console.error("Referral auto-apply catch:", error);
        });
      });
    }
  }, [
    user,
    isVoucherValid,
    subtotal,
    autoAppliedReferralVoucher,
    isLoadingReferralStatus,
    referralStatus,
    voucherFromUrl,
    hasFreePrize,
    validateVoucherMutation,
    showToast,
  ]);

  useEffect(() => {
      // Auto-Apply Voucher from URL if present
      const autoApplyUrlVoucher = () => {
          if (!voucherFromUrl) return;
          if (voucherValidationAttempted) return; // Prevent loop or re-attempt if already tried
          if (isVoucherValid && voucherCode === voucherFromUrl) return; // Already applied
          if (hasFreePrize) return; // Prevent voucher application with free item

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
  }, [voucherFromUrl, subtotal, isVoucherValid, validateVoucherMutation, startTransition, showToast, voucherValidationAttempted, voucherCode, hasFreePrize]);

  // Auto-apply Free Delivery if user has one and no voucher is applied
  // Auto-apply Free Delivery if user has one and no voucher is applied
  // useEffect(() => {
  //   if (userVouchers && userVouchers.length > 0 && !isVoucherValid && subtotal > 0 && !voucherFromUrl) {
  //     const freeDeliveryVoucher = userVouchers.find((v: Database["public"]["Tables"]["vouchers"]["Row"]) => v.code.includes("FREE-DELIV"));
  //     if (freeDeliveryVoucher) {
  //       startTransition(async () => {
  //          const result = await validateVoucherMutation({
  //            code: freeDeliveryVoucher.code,
  //            totalAmount: subtotal,
  //          });
  //          if (result.success && result.data) {
  //            setVoucherCode(freeDeliveryVoucher.code);
  //            setIsVoucherValid(true);
  //            setVoucherId(result.data.id);
  //            setVoucherDiscount(result.data.discountValue);
  //            // showToast("Free Delivery reward automatically applied!", "success");
  //          }
  //       });
  //     }
  //   }
  // }, [userVouchers, isVoucherValid, subtotal, voucherFromUrl, validateVoucherMutation, startTransition, showToast]);

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
        firstName: (selectedAddress as any).firstName || ((selectedAddress as any).label ? (selectedAddress as any).label.split(' ')[0] : user?.display_name?.split(' ')[0]) || "",
        lastName: (selectedAddress as any).lastName || ((selectedAddress as any).label ? (selectedAddress as any).label.split(' ').slice(1).join(' ') : user?.display_name?.split(' ').slice(1).join(' ')) || "",
        street: selectedAddress.street,
        location: selectedAddress.city,
        phone: selectedAddress.phone,
      });
    }
  };

  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    showToast("Shipping address saved successfully!", "success");
  };

  const handleVoucherValidation = async (externalCode?: string) => {
    if (!user) {
      showToast("Please log in to use voucher codes.", "error");
      return;
    }

    if (isGiftMode) {
      showToast("Vouchers cannot be used when buying as a gift link.", "error");
      return;
    }

    if (hasFreePrize) {
      showToast("Vouchers cannot be used with a free gift in your cart.", "error");
      return;
    }
    const codeToValidate = (externalCode || voucherCode)?.trim();
    
    if (!codeToValidate) {
      showToast("Please enter a voucher code.", "error");
      return;
    }

    startTransition(async () => {
      try {
        const result = await validateVoucherMutation({
          code: codeToValidate,
          totalAmount: subtotal,
        });
        if (result.success && result.data) {
          const { id, discountType, discountValue } = result.data;
          setIsVoucherValid(true);
          setVoucherId(id);
          setVoucherCode(codeToValidate); // Sync state if it was external
          const calculatedDiscount =
            discountType === "percentage"
              ? (discountValue / 100) * totalAmount
              : discountValue;
          const discount = Math.min(calculatedDiscount, subtotal);
          setVoucherDiscount(discount);
          // Persist voucher in localStorage
          localStorage.setItem("voucherCode", codeToValidate);
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
      
      if (isGiftMode) {
        const errors: any = {};
        if (!senderName.trim()) {
           errors.senderName = "Sender name is required.";
        }
        
        const giftEmailVal = (document.getElementById('giftEmail') as HTMLInputElement)?.value;
        if (!user && !giftEmailVal?.trim()) {
           errors.email = "Email is required for creating a gift link.";
        }

        if (Object.keys(errors).length > 0) {
           setGiftErrors(errors);
           showToast("Please fill in the required gift details.", "error");
           setIsSubmitting(false);
           return;
        }
        setGiftErrors({});
      } else {
        const isFormValid = await shippingAddressForm.trigger();

        // Manual check for guest email
        if (!user && !shippingAddressForm.getValues("email")) {
          showToast("Email is required for guest checkout.", "error");
          shippingAddressForm.setError("email", { 
             type: "manual", 
             message: "Email is required for guest checkout" 
          });
          setIsSubmitting(false);
          return;
        }

        if (!isFormValid) {
          showToast("Please fill out all required shipping fields.", "error");
          setIsSubmitting(false);
          return;
        }

        if (!selectedAddressId && userAddresses.length > 0) {
          showToast("Please select a delivery address.", "error");
          setIsSubmitting(false);
          return;
        }
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
          const email = user?.email || (isGiftMode ? (document.getElementById('giftEmail') as HTMLInputElement)?.value : formValues.email);
          const formLocation = isGiftMode ? "Lagos" : formValues.location;

          // Email check removed to allow optional emails
          const orderData = {
            userId: (user?.user_id || null) as any,
            cartItems: (items || []).map((item) => ({
              productId: item.product_id || "",
              bundleId: item.bundle_id || "",
              offerId: item.offer_id || "",
              quantity: item.quantity,
              price: item.price,
              option: item.option,
            })),
            shippingAddress: isGiftMode ? {
              isGiftLink: true,
              senderName: senderName,
              giftMessage: giftMessage,
              street: "Pending Gift Claim",
              location: "Pending Gift Claim",
              phone: "Pending Gift Claim",
              email: email
            } : {
              fullName: `${shippingAddressForm.getValues().firstName} ${shippingAddressForm.getValues().lastName}`,
              street: shippingAddressForm.getValues().street,
              location: shippingAddressForm.getValues().location,
              phone: shippingAddressForm.getValues().phone,
            },
            totalAmount,
            totalAmountPaid,
            deliveryFee: cost,
            local_government: formLocation,
            voucherId: isVoucherValid ? voucherId : null,
            voucherDiscount: voucherDiscount,
            paymentMethod: selectedPaymentMethod,
            note: isGiftMode && giftMessage ? `GIFT MESSAGE: ${giftMessage}` : orderNote,
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
                      userEmail: email,
                      adminOrderProps: {
                        orderNumber: result.data.orderNumber || result.data.reference || result.data.orderId,
                        customerName:
                          user.display_name ||
                          `${shippingAddressForm.getValues().firstName} ${shippingAddressForm.getValues().lastName}`,
                        customerPhone: shippingAddressForm.getValues().phone,
                        itemsOrdered: items.map((item) => ({
                          title:
                            item.products?.name ||
                            item.bundles?.name ||
                            item.offers?.title ||
                            (item as any).title ||
                            (item.option as any)?._title ||
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
                        discount: voucherDiscount + dealsDiscount + staffDiscount,
                        subtotal: subtotal,
                        voucherDiscount: voucherDiscount,
                        dealsDiscount: dealsDiscount,
                        staffDiscount: staffDiscount,
                        deliveryFee: cost,
                        totalAmount: totalAmountPaid,
                        orderNote: orderNote,
                        paymentMethod: selectedPaymentMethod,
                        isFirstOrder: isFirstOrder,
                        rewards: result.data.rewards, // Pass the rewards from the action result
                      },
                      userOrderProps: {
                        orderNumber: result.data.orderNumber || result.data.reference || result.data.orderId,
                        customerName:
                          user.display_name ||
                          `${shippingAddressForm.getValues().firstName} ${shippingAddressForm.getValues().lastName}`,
                        customerPhone: shippingAddressForm.getValues().phone,
                        itemsOrdered: items.map((item) => ({
                          title:
                            item.products?.name ||
                            item.bundles?.name ||
                            item.offers?.title ||
                            (item as any).title ||
                            (item.option as any)?._title ||
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
                        discount: voucherDiscount + dealsDiscount + staffDiscount, // Pass discount
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
              
              if (isGiftMode) {
                router.push(
                  `/order/gift-link?orderId=${result.data.orderId}`
                );
              } else {
                router.push(
                  `/order/order-confirmation?orderId=${result.data.orderId}`
                );
              }
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
                amount: Math.round(totalAmountPaid),
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
                user?.display_name || `${shippingAddressForm.getValues().firstName} ${shippingAddressForm.getValues().lastName}`,
              customerPhone: shippingAddressForm.getValues().phone,
              itemsOrdered: items.map((item) => ({
                title:
                  item.products?.name ||
                  item.bundles?.name ||
                  item.offers?.title ||
                  (item.option as any)?._title ||
                  "",
                image:
                   item.products?.images?.[0] ||
                   item.bundles?.thumbnail_url ||
                   item.offers?.image_url ||
                   undefined,
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
              voucherId: isVoucherValid ? voucherId : null,
              voucherDiscount: voucherDiscount,
              dealsDiscount: dealsDiscount,
              staffDiscount: staffDiscount,
              totalDiscount: voucherDiscount + dealsDiscount + staffDiscount,
              isFirstOrder: isFirstOrder,
              serviceCharge: /*serviceCharge*/ 0, // Service charge commented out
              subtotal: subtotal,
              orderNote: orderNote,
              isGift: isGiftMode,
            });
            if (response.data.authorization_url) {
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
               if (isGiftMode) {
                 router.push(`/order/gift-link?orderId=${orderResult.data.orderId}`);
               } else {
                 router.push(`/order/order-confirmation?orderId=${orderResult.data.orderId}`);
               }
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
    <main className="bg-gray-50 min-h-screen font-proxima pb-20">
      <Container>
        <div className="py-12 md:py-16 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="max-w-6xl mx-auto">
            {/* Brand Header */}
            <div className="mb-12 text-center space-y-2">
                 <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight  ">Checkout</h1>
                 <p className="text-xs uppercase tracking-[0.1em] text-[#1B6013] font-bold">SECURE CHECKOUT</p>
            </div>

             <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
            {/* Left Column - Checkout Form */}
            <div className="lg:w-[60%] w-full">
              <div className="space-y-12">
                  <section className="space-y-6">
                       <div className="pb-3 flex justify-between items-center border-b border-gray-100 mb-6">
                           
                           {/* <label className="relative inline-flex items-center cursor-pointer">
                             <input 
                               type="checkbox" 
                               className="sr-only peer" 
                               checked={isGiftMode} 
                               onChange={(e) => {
                                 const val = e.target.checked;
                                 setIsGiftMode(val);
                                 if (val && isVoucherValid) {
                                   setIsVoucherValid(false);
                                   setVoucherCode("");
                                   setVoucherDiscount(0);
                                   setVoucherId(null);
                                   localStorage.removeItem("voucherCode");
                                   localStorage.removeItem("voucherDiscount");
                                   showToast("Voucher removed as it cannot be used with Gift Mode.", "info");
                                 }
                               }} 
                             />
                             <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#1B6013]"></div>
                           </label> */}
                       </div>

                       {false && isGiftMode ? (
                           <div className="bg-green-50/50 p-6 rounded-2xl border border-[#1B6013]/20 space-y-6">
                               <div className="space-y-4">
                                   <div className="space-y-1">
                                       <Label className="text-xs font-semibold text-gray-700">Your Name (Sender)</Label>
                                       <Input
                                          placeholder="Enter your name"
                                          value={senderName}
                                          onChange={e => {
                                            setSenderName(e.target.value);
                                            if (giftErrors.senderName) setGiftErrors(prev => ({ ...prev, senderName: undefined }));
                                          }}
                                          className={`rounded-xl h-12 border-gray-200 bg-white ${giftErrors.senderName ? "border-red-500 ring-red-500" : ""}`}
                                       />
                                       {giftErrors.senderName && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{giftErrors.senderName}</p>}
                                   </div>
                                   {!user?.email && (
                                     <div className="space-y-1">
                                       <Label className="text-xs font-semibold text-gray-700">Your Email Address</Label>
                                       <Input
                                          id="giftEmail"
                                          type="email"
                                          placeholder="Enter email address"
                                          className={`rounded-xl h-12 border-gray-200 bg-white ${giftErrors.email ? "border-red-500 ring-red-500" : ""}`}
                                          onChange={() => {
                                            if (giftErrors.email) setGiftErrors(prev => ({ ...prev, email: undefined }));
                                          }}
                                       />
                                       {giftErrors.email && <p className="text-[10px] text-red-500 font-bold uppercase mt-1">{giftErrors.email}</p>}
                                     </div>
                                   )}
                                   <div className="space-y-1">
                                       <Label className="text-xs font-semibold text-gray-700">Gift Message (Optional)</Label>
                                       <Textarea
                                          placeholder="Write a nice message for them..."
                                          value={giftMessage}
                                          onChange={e => setGiftMessage(e.target.value)}
                                          className="rounded-xl border-gray-200 bg-white resize-none"
                                          rows={3}
                                       />
                                   </div>
                               </div>                                <div className="bg-white p-4 rounded-xl border border-green-100 flex gap-3 text-sm text-gray-600 shadow-sm relative overflow-hidden">
                                   <div className="absolute -right-2 -bottom-2 opacity-10 rotate-12">
                                     <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 64 64">
                                        <path fill="#076170" d="M31.9 30.3V62S45 52.8 54.2 50.1c0 0 .4-19.6 6.1-29.4z" />
                                        <path fill="#b3690e" d="M40.1 57.2s.5-28.1 1.5-29.5c1-1.5 9.6-3 9.6-3s-3.5 26.3-2.7 28c.1-.1-3.5 1.4-8.4 4.5" />
                                        <path fill="#3baacf" d="M31.9 62s-9.2-7.8-23.5-11.9c0 0 1.1-16.1-4.1-28.4l27.6 8.6z" />
                                        <path fill="#e9c243" d="M14.2 52.7s8.4 3.4 9 4.5s.6-28.3.6-28.3s-11.5-3.2-12.5-3.2c0 0 3.5 11.9 2.9 27" />
                                        <path d="M31.9 30.3v5.3l25.7-8.8c.7-2.2 1.6-4.3 2.6-6.1zM6.1 27.2c-.5-1.9-1.1-3.7-1.9-5.5l27.6 8.6v5.3z" opacity="0.3" />
                                        <path fill="#4fc7e8" d="m2 18.9l28.5 6.3L62 17.6l-30.9-1.7z" />
                                        <path fill="#3baacf" d="m2 18.9l2.3 6.3l26.2 7.4v-7.4z" />
                                        <path fill="#076170" d="M30.5 32.6s23.8-8.8 29.7-9.2c0 0 .4-3.5 1.8-5.7l-31.5 7.5z" />
                                        <g fill="#f0ae11">
                                            <path d="m10.5 20.8l5.8 5.5l6.4-2.9l9.3-2.8L43.6 22l6.1 1.2l4.9-3.8z" />
                                            <path d="m22.7 23.4l9.3-2.8L43.6 22l11-2.6l-23.2-2.2l-20.9 3.6z" />
                                        </g>
                                        <path fill="#f8d048" d="M10.5 20.8v7L22.2 31l.5-7.6z" />
                                        <path fill="#c47116" d="m43.6 22l.2 6.7l10-3l.8-6.3z" />
                                        <path fill="#ea9f07" d="M37.3 17.3s0-7 6.8-13.1c0 0-4.1 1.5-6.1 1.1c-2.4-.4-3.2-3.3-3.2-3.3S29 14.6 30.7 16.2c1.7 1.7 6.6 1.1 6.6 1.1" />
                                        <path fill="#f8d048" d="M28.4 21.4s-3.9-8-12.2-12.2c0 0 6.5-.6 8-1.4c1.9-.9 3-3.4 3-3.4s7.2 12.6 6.6 14.5s-5.4 2.5-5.4 2.5" />
                                        <path fill="#ea9f07" d="M32.6 20.5s-6.1 2.4-13.9 2.4C2.3 22.8 0 11 16.2 12.1c13.3 1 16.4 8.4 16.4 8.4" />
                                        <path fill="#f0ae11" d="M31.5 20.4s7.2.6 13.9-1.1c14-3.6 8.8-14.2-4.4-9.7c-10.8 3.7-9.5 10.8-9.5 10.8" />
                                        <g fill="#824000">
                                            <path d="M32.6 20.5S28.8 22 23.9 22c-10.2 0-11.7-7.4-1.6-6.7c8.3.6 10.3 5.2 10.3 5.2" />
                                            <path d="M32.6 20.5s5 .4 9.7-.8c9.8-2.5 6.1-9.9-3-6.8c-7.6 2.6-6.7 7.6-6.7 7.6" />
                                        </g>
                                     </svg>
                                   </div>
                                   <div className="z-10 flex gap-3">
                                       <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 64 64">
                                            <path fill="#076170" d="M31.9 30.3V62S45 52.8 54.2 50.1c0 0 .4-19.6 6.1-29.4z" />
                                            <path fill="#b3690e" d="M40.1 57.2s.5-28.1 1.5-29.5c1-1.5 9.6-3 9.6-3s-3.5 26.3-2.7 28c.1-.1-3.5 1.4-8.4 4.5" />
                                            <path fill="#3baacf" d="M31.9 62s-9.2-7.8-23.5-11.9c0 0 1.1-16.1-4.1-28.4l27.6 8.6z" />
                                            <path fill="#e9c243" d="M14.2 52.7s8.4 3.4 9 4.5s.6-28.3.6-28.3s-11.5-3.2-12.5-3.2c0 0 3.5 11.9 2.9 27" />
                                            <path d="M31.9 30.3v5.3l25.7-8.8c.7-2.2 1.6-4.3 2.6-6.1zM6.1 27.2c-.5-1.9-1.1-3.7-1.9-5.5l27.6 8.6v5.3z" opacity="0.3" />
                                            <path fill="#4fc7e8" d="m2 18.9l28.5 6.3L62 17.6l-30.9-1.7z" />
                                            <path fill="#3baacf" d="m2 18.9l2.3 6.3l26.2 7.4v-7.4z" />
                                            <path fill="#076170" d="M30.5 32.6s23.8-8.8 29.7-9.2c0 0 .4-3.5 1.8-5.7l-31.5 7.5z" />
                                            <g fill="#f0ae11">
                                                <path d="m10.5 20.8l5.8 5.5l6.4-2.9l9.3-2.8L43.6 22l6.1 1.2l4.9-3.8z" />
                                                <path d="m22.7 23.4l9.3-2.8L43.6 22l11-2.6l-23.2-2.2l-20.9 3.6z" />
                                            </g>
                                            <path fill="#f8d048" d="M10.5 20.8v7L22.2 31l.5-7.6z" />
                                            <path fill="#c47116" d="m43.6 22l.2 6.7l10-3l.8-6.3z" />
                                            <path fill="#ea9f07" d="M37.3 17.3s0-7 6.8-13.1c0 0-4.1 1.5-6.1 1.1c-2.4-.4-3.2-3.3-3.2-3.3S29 14.6 30.7 16.2c1.7 1.7 6.6 1.1 6.6 1.1" />
                                            <path fill="#f8d048" d="M28.4 21.4s-3.9-8-12.2-12.2c0 0 6.5-.6 8-1.4c1.9-.9 3-3.4 3-3.4s7.2 12.6 6.6 14.5s-5.4 2.5-5.4 2.5" />
                                            <path fill="#ea9f07" d="M32.6 20.5s-6.1 2.4-13.9 2.4C2.3 22.8 0 11 16.2 12.1c13.3 1 16.4 8.4 16.4 8.4" />
                                            <path fill="#f0ae11" d="M31.5 20.4s7.2.6 13.9-1.1c14-3.6 8.8-14.2-4.4-9.7c-10.8 3.7-9.5 10.8-9.5 10.8" />
                                            <g fill="#824000">
                                                <path d="M32.6 20.5S28.8 22 23.9 22c-10.2 0-11.7-7.4-1.6-6.7c8.3.6 10.3 5.2 10.3 5.2" />
                                                <path d="M32.6 20.5s5 .4 9.7-.8c9.8-2.5 6.1-9.9-3-6.8c-7.6 2.6-6.7 7.6-6.7 7.6" />
                                            </g>
                                          </svg>
                                       </div>
                                       <p>After payment, you will receive a unique link. Send it to your friend so they can claim this meal and enter their delivery details!</p>
                                   </div>
                                </div> 
                           </div>
                       ) : (
                         <>
                         <div className="pb-3">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">1. Delivery Destination</h3>
                         </div>

                       {/* Address Summary Card */}
                       {selectedAddress ? (
                         <div className="p-6 bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-12 h-12 bg-[#1B6013]/5 flex items-center justify-center">
                                <Icon icon="solar:map-point-wave-bold-duotone" className="w-6 h-6 text-[#1B6013]" />
                             </div>
                             <div className="flex justify-between items-start">
                                 <div className="space-y-4">
                                     <div className="space-y-1">
                                        <span className="text-[10px] font-bold text-[#1B6013] uppercase tracking-wider">Default Address</span>
                                        <p className="text-xl font-bold text-gray-900">{selectedAddress.label || (selectedAddress as any).fullName || "Street Address"}</p>
                                     </div>
                                     <div className="space-y-1">
                                         <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                             {selectedAddress.street}
                                         </p>
                                         <p className="text-sm text-gray-900 font-bold tracking-tight uppercase">{selectedAddress.city}</p>
                                         <p className="text-xs text-gray-400 font-bold">{selectedAddress.phone}</p>
                                     </div>
                                 </div>
                                 <button
                                     onClick={() => {
                                         setShowAddressModal(true);
                                         setShowAddNewForm(false);
                                     }}
                                     className="text-[10px] font-bold uppercase tracking-wider text-[#1B6013] border-b-2 border-[#1B6013]/20 pb-0.5 hover:border-[#1B6013] transition-colors"
                                 >
                                     Change
                                 </button>
                             </div>
                         </div>
                       ) : (
                         <div 
                           className="text-center py-10 px-6 bg-white rounded-xl border border-dashed border-gray-300 hover:border-[#1B6013] hover:bg-green-50/50 transition-all group cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.02)]" 
                           onClick={() => setShowAddressModal(true)}
                         >
                              <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-[#FF9900]/10 flex items-center justify-center mx-auto mb-4 transition-colors">
                                 <Icon icon="solar:map-point-add-bold-duotone" className="w-6 h-6 text-gray-400 group-hover:text-[#FF9900] transition-colors" />
                              </div>
                              <p className="text-sm font-bold text-gray-600 group-hover:text-[#FF9900] transition-colors uppercase tracking-wider">Select Delivery Address</p>
                              <p className="text-xs text-gray-400 mt-2">Add or choose where we should deliver your food</p>
                         </div>
                       )}

                    {/* Modal for address selection/addition */}
                    <Dialog
                      open={showAddressModal}
                      onOpenChange={setShowAddressModal}
                    >
                      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-3xl border-none shadow-2xl">
                        <DialogHeader className="p-6 pb-2">
                          <DialogTitle className="text-2xl font-bold text-gray-900 tracking-tight">Select Delivery Address</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
                        {!showAddNewForm ? (
                          <div
                            className="space-y-4"
                          >
                            {userAddresses && userAddresses.length > 0 ? (
                              <div className="space-y-4">
                                {userAddresses.map((address) => (
                                  <div
                                    key={address.id}
                                    className={`relative flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer group ${selectedAddressId === address.id ? "border-[#1B6013] bg-green-50/30" : "border-gray-100 bg-white hover:border-gray-200"}`}
                                    onClick={() => setSelectedAddressId(address.id)}
                                  >
                                    <div className="pt-1">
                                         <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedAddressId === address.id ? "border-[#1B6013]" : "border-gray-300"}`}>
                                            {selectedAddressId === address.id && <div className="w-2.5 h-2.5 rounded-full bg-[#1B6013]" />}
                                         </div>
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-bold text-gray-900 text-sm mb-1">
                                        {address.label || (address as any).fullName || user?.display_name}
                                      </div>
                                      <div className="text-xs text-gray-500 leading-relaxed">
                                        {address.street}, {address.city}
                                      </div>
                                      <div className="text-[10px] text-gray-400 mt-1 font-bold tracking-tight">{address.phone}</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                          type="button"
                                          className="p-1.5 text-gray-400 hover:text-[#1B6013] transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingAddress(address);
                                            setShowAddNewForm(true);
                                            shippingAddressForm.reset({
                                              firstName: address.label?.split(" ")[0] || "",
                                              lastName: address.label?.split(" ").slice(1).join("") || "",
                                              street: address.street,
                                              location: address.city,
                                              phone: address.phone,
                                              additionalPhone: (address as any).additionalPhone || "",
                                              email: address.email || "",
                                            });
                                          }}
                                        >
                                          <Pencil size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setAddressToDelete(address);
                                            setDeleteDialogOpen(true);
                                          }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-10 text-gray-400 text-sm ">
                                No saved addresses found.
                              </div>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setShowAddNewForm(true);
                                    setEditingAddress(null);
                                    shippingAddressForm.reset({
                                      firstName: "",
                                      lastName: "",
                                      street: "",
                                      location: "",
                                      phone: "",
                                      additionalPhone: "",
                                      email: "",
                                    });
                                }}
                                className="w-full h-12 rounded-xl border border-dashed border-gray-300 text-gray-700 font-semibold text-sm hover:border-[#1B6013] hover:text-[#1B6013] hover:bg-green-50/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                                Add New Address
                            </button>
                          </div>
                        ) : (
                           <div className="mt-2 p-6 bg-green-50/50 rounded-xl border border-green-100">
                             <Form {...shippingAddressForm}>
                               <form
                                 onSubmit={shippingAddressForm.handleSubmit(
                                   async (values) => {
                                     setIsAddingAddress(true);
                                     try {
                                       let address: any;
                                       const newDetails = {
                                           label: `${values.firstName} ${values.lastName}`.trim(),
                                           street: values.street,
                                           city: values.location,
                                           state: "Lagos", // Removed region field
                                           zip: "", // Removed landmark field
                                           country: "Nigeria",
                                           phone: values.phone,
                                           additionalPhone: values.additionalPhone || "",
                                       };

                                       if (user) {
                                          if (editingAddress) {
                                            address = await updateAddressAction(editingAddress.id, newDetails);
                                          } else {
                                            address = await addAddressAction(newDetails);
                                          }
                                        } else {
                                         address = {
                                             id: editingAddress ? editingAddress.id : `temp-${Date.now()}`,
                                             ...newDetails,
                                             email: values.email || "",
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
                                 className="space-y-6"
                               >
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <FormField
                                     control={shippingAddressForm.control}
                                     name="firstName"
                                     render={({ field }) => (
                                       <FormItem className="space-y-1">
                                         <FormLabel className="text-xs font-semibold text-gray-700">First Name <span className="text-red-500">*</span></FormLabel>
                                         <FormControl>
                                           <Input
                                             placeholder="Enter first name"
                                             {...field}
                                             className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all"
                                           />
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                   <FormField
                                     control={shippingAddressForm.control}
                                     name="lastName"
                                     render={({ field }) => (
                                       <FormItem className="space-y-1">
                                         <FormLabel className="text-xs font-semibold text-gray-700">Last Name <span className="text-red-500">*</span></FormLabel>
                                         <FormControl>
                                           <Input
                                             placeholder="Enter last name"
                                             {...field}
                                             className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all"
                                           />
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <FormField
                                     control={shippingAddressForm.control}
                                     name="phone"
                                     render={({ field }) => (
                                       <FormItem className="space-y-1">
                                         <FormLabel className="text-xs font-semibold text-gray-700">Phone Number <span className="text-red-500">*</span></FormLabel>
                                           <FormControl>
                                             <Input
                                               placeholder="8144602273"
                                               {...field}
                                               className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all flex-1"
                                             />
                                           </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                   {/* Additional phone hidden as per user request */}
                                   {/* 
                                   <FormField
                                     control={shippingAddressForm.control}
                                     name="additionalPhone"
                                     render={({ field }) => (
                                       <FormItem className="space-y-1">
                                         <FormLabel className="text-xs font-semibold text-gray-700">Additional Phone Number</FormLabel>
                                         <div className="flex">
                                           <div className="flex items-center justify-center bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg px-3 text-sm text-gray-500 font-medium h-12">
                                             +234
                                           </div>
                                           <FormControl>
                                             <Input
                                               placeholder="Secondary phone"
                                               {...field}
                                               className="rounded-none rounded-r-lg bg-white border-gray-300 h-12 flex-1 pt-2 focus-visible:ring-1 focus-visible:ring-orange-400"
                                             />
                                           </FormControl>
                                         </div>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                   */}
                                 </div>

                                 <FormField
                                   control={shippingAddressForm.control}
                                   name="street"
                                   render={({ field }) => (
                                     <FormItem className="space-y-1">
                                       <FormLabel className="text-xs font-semibold text-gray-700">Delivery Address <span className="text-red-500">*</span></FormLabel>
                                       <FormControl>
                                         <Input
                                           placeholder="Enter street address"
                                           {...field}
                                           className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all"
                                         />
                                       </FormControl>
                                       <FormMessage />
                                     </FormItem>
                                   )}
                                 />

                                 {/* Removed Landmark Field */}

                                 <div className="grid grid-cols-1">
                                   {/* Removed Region Field */}
                                    <FormField
                                      control={shippingAddressForm.control}
                                      name="location"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col space-y-1 w-full">
                                          <FormLabel className="text-xs font-semibold text-gray-700">City <span className="text-red-500">*</span></FormLabel>
                                        <Popover modal={true} open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                                            <PopoverTrigger asChild>
                                              <FormControl>
                                                <Button
                                                  variant="outline"
                                                  role="combobox"
                                                  className={cn(
                                                    "w-full justify-between rounded-lg bg-white border-gray-300 h-12 text-left font-normal pt-2 focus:ring-orange-400",
                                                    !field.value && "text-muted-foreground"
                                                  )}
                                                >
                                                  {field.value
                                                    ? field.value
                                                    : "Please select"}
                                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform" />
                                                </Button>
                                              </FormControl>
                                             </PopoverTrigger>
                                        <PopoverContent 
                                           className="w-[--radix-popover-trigger-width] p-0 z-[100] rounded-2xl shadow-2xl border-gray-100 animate-in fade-in zoom-in-95 duration-200" 
                                           align="start" 
                                           sideOffset={8} 
                                           side="bottom"
                                           style={{ display: "flex", flexDirection: "column" }}
                                         >
                                           <div className="flex items-center px-3 py-2 border-b">
                                             <Input
                                               placeholder="Search area..."
                                               className="h-8 border-none focus-visible:ring-0 bg-transparent"
                                               value={locationSearch}
                                               onChange={(e) => setLocationSearch(e.target.value)}
                                             />
                                           </div>
                                           <div style={{ maxHeight: "300px", overflowY: "auto" }} className="p-1 custom-scrollbar w-full">
                                             <div className="p-1 w-full">
                                               <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Official Zones</p>
                                               {deliveryLocations
                                                 .filter(loc => loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase()))
                                                 .map((loc) => (
                                                   <button
                                                     key={loc.id}
                                                     type="button"
                                                     className={cn(
                                                       "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                                                       field.value === loc.name ? "bg-[#1B6013] text-white" : "hover:bg-gray-100"
                                                     )}
                                                     onClick={() => {
                                                       field.onChange(loc.name);
                                                       setIsLocationPopoverOpen(false);
                                                     }}
                                                   >
                                                     {loc.name}
                                                     {field.value === loc.name && <Check className="h-4 w-4" />}
                                                   </button>
                                                 ))}
                                             </div>
                                           </div>
                                         </PopoverContent>
                                          </Popover>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                 </div>

                                 {!user?.email && (
                                   <FormField
                                     control={shippingAddressForm.control}
                                     name="email"
                                     render={({ field }) => (
                                       <FormItem className="space-y-1">
                                         <FormLabel className="text-xs font-semibold text-gray-700">Email Address <span className="text-red-500">*</span></FormLabel>
                                         <FormControl>
                                           <Input
                                             placeholder="Enter email address"
                                             {...field}
                                             className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all"
                                           />
                                         </FormControl>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                 )}

                                 <div className="flex items-center justify-end gap-6 pt-4 border-t border-gray-200">
                                   <button
                                     type="button"
                                     className="text-[#1B6013] font-bold text-sm hover:underline"
                                     onClick={() => {
                                       setShowAddNewForm(false);
                                       setEditingAddress(null);
                                     }}
                                   >
                                     Cancel
                                   </button>
                                   <Button
                                     type="submit"
                                     className="bg-[#1B6013] hover:bg-[#154d0f] text-white rounded-lg px-10 h-12 font-bold shadow-md transition-all active:scale-95"
                                     disabled={isAddingAddress}
                                   >
                                     {isAddingAddress ? (
                                       <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                     ) : null}
                                     {editingAddress ? "Update" : "Save"}
                                   </Button>
                                 </div>
                               </form>
                             </Form>
                            </div>
                        )}
                        </div>
                         {!showAddNewForm && (
                          <div className="p-6 pt-2 border-t border-gray-50 bg-gray-50/30">
                            <Button
                              type="button"
                              className="bg-[#1B6013] text-white w-full hover:bg-[#154d0f] rounded-xl h-14 font-bold shadow-lg shadow-green-100 transition-all active:scale-[0.98]"
                              onClick={() => setShowAddressModal(false)}
                            >
                              Confirm Selection
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* If no address is selected, show the form inline (first time user) */}
                    {userAddresses.length === 0 && (
                      <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">Add Delivery Address</h2>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Please enter your shipping details below</p>
                        </div>
                        <Form {...shippingAddressForm}>
                          <form
                            onSubmit={shippingAddressForm.handleSubmit(
                              async (values) => {
                                setIsAddingAddress(true);
                                try {
                                  let address: any;
                                  const newDetails = {
                                      label: `${values.firstName} ${values.lastName}`.trim(),
                                      street: values.street,
                                      city: values.location,
                                      state: "Lagos",
                                      zip: "",
                                      country: "Nigeria",
                                      phone: values.phone,
                                      additionalPhone: values.additionalPhone || "",
                                  };

                                  if (user) {
                                    if (editingAddress) {
                                      address = await updateAddressAction(editingAddress.id, newDetails);
                                    } else {
                                      address = await addAddressAction(newDetails);
                                    }
                                  } else {
                                    // Handle guest/anonymous user - local state only
                                    address = {
                                      id: editingAddress ? editingAddress.id : `temp-${Date.now()}`,
                                      ...newDetails,
                                      email: values.email || "",
                                      user_id: null
                                    };
                                  }

                                  if (editingAddress) {
                                    setUserAddresses((prev) =>
                                      prev.map((a) =>
                                        a.id === editingAddress.id ? address : a
                                      )
                                    );
                                  } else {
                                    setUserAddresses((prev) => [...prev, address]);
                                  }
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
                            className="space-y-6"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={shippingAddressForm.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">First Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter first name"
                                        {...field}
                                        disabled={isAddingAddress}
                                        className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={shippingAddressForm.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">Last Name <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter last name"
                                        {...field}
                                        disabled={isAddingAddress}
                                        className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <FormField
                                control={shippingAddressForm.control}
                                name="phone"
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">Phone Number <span className="text-red-500">*</span></FormLabel>
                                     <FormControl>
                                       <Input
                                         placeholder="8144602273"
                                         {...field}
                                         disabled={isAddingAddress}
                                         className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex-1"
                                       />
                                     </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                               {/* 
                                   <FormField
                                     control={shippingAddressForm.control}
                                     name="additionalPhone"
                                     render={({ field }) => (
                                       <FormItem className="space-y-1">
                                         <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">Additional Phone Number</FormLabel>
                                         <div className="flex">
                                           <div className="flex items-center justify-center bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg px-3 text-sm text-gray-500 font-medium h-14">
                                             +234
                                           </div>
                                           <FormControl>
                                             <Input
                                               placeholder="Secondary phone"
                                               {...field}
                                               disabled={isAddingAddress}
                                               className="rounded-none rounded-r-lg bg-white border-gray-200 h-14 flex-1 pt-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)] focus-visible:ring-1 focus-visible:ring-[#1B6013]/20"
                                             />
                                           </FormControl>
                                         </div>
                                         <FormMessage />
                                       </FormItem>
                                     )}
                                   />
                                   */}
                            </div>

                            <FormField
                              control={shippingAddressForm.control}
                              name="street"
                              render={({ field }) => (
                                <FormItem className="space-y-1">
                                  <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">Delivery Address <span className="text-red-500">*</span></FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter street address"
                                      {...field}
                                      disabled={isAddingAddress}
                                      className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
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
                                 <FormItem className="flex flex-col space-y-1">
                                   <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">City <span className="text-red-500">*</span></FormLabel>
                                   <Popover modal={true} open={isNewAddressLocationPopoverOpen} onOpenChange={setIsNewAddressLocationPopoverOpen}>
                                     <PopoverTrigger asChild>
                                       <FormControl>
                                         <Button
                                           variant="outline"
                                           role="combobox"
                                           disabled={isAddingAddress}
                                           className={cn(
                                             "w-full justify-between rounded-lg bg-white border-gray-200 h-14 text-left font-normal pt-2 shadow-[0_2px_10px_rgba(0,0,0,0.02)]",
                                             !field.value && "text-muted-foreground"
                                           )}
                                         >
                                           {field.value
                                             ? field.value
                                             : "Please select your area"}
                                           <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform" />
                                         </Button>
                                       </FormControl>
                                     </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[200px] p-0 z-[100] rounded-2xl overflow-hidden shadow-2xl border-gray-100 animate-in fade-in zoom-in-95 duration-200" align="start" sideOffset={8} side="bottom">
                                        <div className="flex flex-col max-h-[300px]">
                                          <div className="flex items-center px-3 py-2 border-b">
                                            <Input
                                              placeholder="Search area..."
                                              className="h-8 border-none focus-visible:ring-0 bg-transparent"
                                              value={locationSearch}
                                              onChange={(e) => setLocationSearch(e.target.value)}
                                            />
                                          </div>
                                          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                            <div className="p-1">
                                              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Official Zones</p>
                                              {deliveryLocations
                                                .filter(loc => loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase()))
                                                .map((loc) => (
                                                  <button
                                                    key={loc.id}
                                                    type="button"
                                                    className={cn(
                                                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between",
                                                      field.value === loc.name ? "bg-[#1B6013] text-white" : "hover:bg-gray-100"
                                                    )}
                                                    onClick={() => {
                                                      field.onChange(loc.name);
                                                      setIsNewAddressLocationPopoverOpen(false);
                                                    }}
                                                  >
                                                    {loc.name}
                                                    {field.value === loc.name && <Check className="h-4 w-4" />}
                                                  </button>
                                                ))}

                                            </div>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                   </Popover>
                                   <FormMessage />
                                 </FormItem>
                               )}
                             />

                            {!user?.email && (
                              <FormField
                                control={shippingAddressForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem className="space-y-1">
                                    <FormLabel className="text-xs font-semibold text-gray-700 mb-1 block">Email Address <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="Enter email address"
                                        {...field}
                                        disabled={isAddingAddress}
                                        className="rounded-xl border-gray-200 bg-gray-50 h-12 focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#1B6013] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            )}

                            <div className="pt-4">
                              <Button
                                type="submit"
                                className="bg-[#1B6013] hover:bg-[#154d0f] text-white rounded-xl w-full h-12 font-bold shadow-md hover:shadow-lg transition-all active:scale-95 text-base"
                                disabled={isAddingAddress}
                              >
                                {isAddingAddress ? (
                                  <Loader2 className="animate-spin mr-2 h-6 w-6" />
                                ) : null}
                                Save Address & Continue
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </div>
                    )}
                    </>
                    )}
                  </section>

                  <section className="space-y-6">
                       <div className="pb-3">
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">2. Payment Method</h3>
                        </div>

                         <div className="grid grid-cols-1 gap-6">
                        <div
                          className={`p-4 border transition-all cursor-pointer relative overflow-hidden rounded-xl ${
                            selectedPaymentMethod === "paystack"
                              ? "border-[#1B6013] bg-green-50 shadow-md"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                          }`}
                          onClick={() => setSelectedPaymentMethod("paystack")}
                        >
                           <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                    selectedPaymentMethod === "paystack" ? "bg-[#1B6013] text-white shadow-lg shadow-green-100" : "bg-gray-50 text-gray-400"
                                }`}>
                                    <Icon icon="solar:card-bold-duotone" className="w-7 h-7" />
                                </div>
                                <div className="space-y-0.5 flex-1">
                                    <h4 className={`font-bold text-lg uppercase tracking-tight ${selectedPaymentMethod === "paystack" ? "text-gray-900" : "text-gray-700"}`}>Debit Card / Transfer</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Secured payment via Paystack</p>
                                </div>
                                {selectedPaymentMethod === "paystack" && (
                                    <div className="bg-[#1B6013] text-white rounded-full p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                        <Check size={16} strokeWidth={4} />
                                    </div>
                                )}
                           </div>
                        </div>

                        {/* Wallet Card */}
                        <div
                          className={`p-4 border transition-all cursor-pointer relative overflow-hidden rounded-xl ${
                            selectedPaymentMethod === "wallet"
                              ? "border-[#1B6013] bg-green-50 shadow-md"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                          } ${!user || walletBalance < totalAmountPaid ? "opacity-60 grayscale cursor-not-allowed" : ""}`}
                          onClick={() => {
                             if (user && walletBalance >= totalAmountPaid) setSelectedPaymentMethod("wallet");
                          }}
                        >
                           <div className="flex items-center gap-5">
                                <div className={`w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                                    selectedPaymentMethod === "wallet" ? "bg-[#1B6013] text-white shadow-lg shadow-green-100" : "bg-gray-50 text-gray-400"
                                }`}>
                                    <Icon icon="solar:wallet-money-bold-duotone" className="w-7 h-7" />
                                </div>
                                <div className="space-y-0.5 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`font-bold text-lg uppercase tracking-tight ${selectedPaymentMethod === "wallet" ? "text-gray-900" : "text-gray-700"}`}>Wallet Balance</h4>
                                        <Badge className="bg-green-100 text-[#1B6013] border-none font-bold text-[10px] px-2 py-0">₦{walletBalance.toLocaleString()}</Badge>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Fast & direct payment from your balance</p>
                                </div>
                                {selectedPaymentMethod === "wallet" && (
                                    <div className="bg-[#1B6013] text-white rounded-full p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                        <Check size={16} strokeWidth={4} />
                                    </div>
                                )}
                           </div>
                        </div>
                      </div>
                  </section>

                    <section className="space-y-6">
                        <div className="pb-3">
                          <h3 className="text-xl font-bold text-gray-900 tracking-tight">3. Additional Instructions</h3>
                       </div>

                         <div className="space-y-8">
                             <div className="p-8 border border-gray-100 bg-white rounded-2xl flex items-start gap-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                 <div className="w-14 h-14 flex items-center justify-center text-[#1B6013] bg-green-50 rounded-2xl shrink-0">
                                     <Icon icon="solar:verified-check-bold-duotone" className="w-10 h-10" />
                                 </div>
                                 <div className="space-y-2">
                                      <h4 className="text-lg font-bold text-gray-900 uppercase tracking-tight">Order Readiness</h4>
                                      <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                         You are ordering <strong className="text-gray-900">{totalQuantity} {totalQuantity === 1 ? 'item' : 'items'}</strong> to be delivered to <strong className="text-gray-900">{selectedAddress?.city || 'your location'}</strong>.
                                      </p>
                                 </div>
                             </div>
                             
                             <div className="space-y-3">
                               <Label htmlFor="orderNote" className="text-xs font-semibold text-gray-700 mb-1 block">
                                 Special Delivery Instructions
                               </Label>
                               <Textarea
                                 id="orderNote"
                                 placeholder="E.g. Call upon arrival, Leave with security..."
                                 value={orderNote}
                                 onChange={(e) => setOrderNote(e.target.value)}
                                 className="resize-none h-28 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white focus:border-[#1B6013] focus:ring-1 focus:ring-[#1B6013] transition-all p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                               />
                             </div>
                         </div>
                   </section>

                 
              </div>
            </div>

            <div className="lg:w-[40%] w-full">
              <div className="sticky top-24">
                   <div className="bg-white rounded-2xl p-6 lg:p-8 space-y-6 shadow-[0px_4px_24px_rgba(0,0,0,0.06)] relative overflow-hidden border border-gray-200/60">
                    <div className="flex items-center justify-between">
                         <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                                Order Summary
                         </h3>
                         <span className="text-[10px] font-bold text-[#1B6013] bg-green-50 px-3 py-1 rounded-full uppercase tracking-wider border border-green-100">{totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}</span>
                    </div>
                    
                    <div className="pb-6 border-b border-gray-100">
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

                     <div className="space-y-6 pt-10 border-t border-slate-100 relative">
                        <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Subtotal</span>
                         <span className="font-bold text-slate-900">{formatNaira(subtotal)}</span>
                       </div>
                       <div className="flex justify-between items-center text-sm">
                         <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Delivery Fee</span>
                         <span className="font-bold text-slate-900">
                           {qualifiesForFreeShipping ? (
                                 <span className="text-[#1B6013] flex items-center gap-1 font-bold uppercase text-[10px] tracking-wider">
                                     <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                                     Free Delivery Reward
                                 </span>
                           ) : formLocation ? (
                             <span className="text-sm font-bold">{formatNaira(cost)}</span>
                           ) : (
                             <span className="text-slate-300 text-[10px] uppercase font-bold tracking-wider ">Calculated next</span>
                           )}
                         </span>
                       </div>
                      
                        {dealsDiscount > 0 && (
                         <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                           <div className="flex justify-between items-center text-sm">
                             <span className="text-[#1B6013] font-bold uppercase tracking-wider text-[10px]">{appliedDiscountLabel}</span>
                             <span className="font-bold text-[#1B6013]">-{formatNaira(dealsDiscount)}</span>
                           </div>
                         </div>
                       )}

                        {staffDiscount > 0 && (
                         <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100">
                           <span className="font-bold text-[#1B6013] text-[10px] uppercase tracking-wider">Staff Discount (10%)</span>
                           <span className="font-bold text-[#1B6013]">-{formatNaira(staffDiscount)}</span>
                         </div>
                       )}

                        {isVoucherValid && !isFreeDeliveryVoucher && (
                         <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border border-green-100">
                           <span className="font-bold text-[#1B6013] text-[10px] uppercase tracking-wider">Promo Applied</span>
                           <span className="font-bold text-[#1B6013]">-{formatNaira(voucherDiscount)}</span>
                         </div>
                       )}

                       <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                         <span className="text-lg font-bold text-slate-900 uppercase tracking-tight">Total to Pay</span>
                         <div className="text-right">
                              <div className="text-3xl font-bold text-[#1B6013] tracking-tighter tabular-nums drop-shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                 {formatNaira(totalAmountPaid)}
                              </div>
                         </div>

                      </div>

                      {/* PLACED ORDER BUTTON HERE */}
                      <div className="pt-6 mt-4 border-t border-gray-100">
                     <Button
                         onClick={handleOrderSubmission}
                         disabled={isSubmitting || items.length === 0}
                         className="rounded-xl bg-[#1B6013] hover:bg-[#154d0f] text-white px-8 h-12 font-bold text-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full active:scale-95"
                     >
                         {isSubmitting ? (
                             <Loader2 className="animate-spin h-5 w-5" />
                         ) : (
                             <Icon icon="solar:lock-password-bold" className="w-6 h-6" />
                         )}
                         {isSubmitting ? "Processing..." : "Place Order Now"}
                     </Button>
                 </div>
                    </div>

                     {/* Available Vouchers Section */}
                     {isAuthenticated && (userVouchers && userVouchers.length > 0) && (
                       <div className="pt-8 border-t border-slate-100 pb-2 animate-in fade-in slide-in-from-top-2 duration-500">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Icon icon="solar:gift-bold" className="w-3.5 h-3.5 text-[#1B6013]" />
                            Your Available Rewards
                          </h4>
                          <div className="flex flex-col gap-3">
                            {userVouchers.map((voucher: Database["public"]["Tables"]["vouchers"]["Row"]) => (
                              <button
                                key={voucher.id}
                                type="button"
                                disabled={isVoucherValid && voucherCode === voucher.code}
                                onClick={() => {
                                  handleVoucherValidation(voucher.code);
                                }}
                                className={cn(
                                  "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group/v",
                                  isVoucherValid && voucherCode === voucher.code
                                    ? "bg-green-50 border-[#1B6013] opacity-80"
                                    : "bg-white border-slate-100 hover:border-[#1B6013]/30 hover:shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    voucher.code.includes("FREE-DELIV") ? "bg-green-50 text-[#1B6013]" : "bg-green-50 text-[#1B6013]"
                                  )}>
                                    <Icon icon={voucher.code.includes("FREE-DELIV") ? "solar:delivery-bold" : "solar:ticket-bold"} className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 truncate uppercase tracking-tight">{voucher.description || voucher.code}</p>
                                    <p className="text-[9px] font-bold text-[#1B6013] uppercase tracking-wider truncate">{voucher.code}</p>
                                  </div>
                                </div>
                                {isVoucherValid && voucherCode === voucher.code ? (
                                  <div className="bg-[#1B6013] text-white rounded-full p-1">
                                    <Check className="w-3 h-3 stroke-[4]" />
                                  </div>
                                ) : (
                                  <div className="text-[9px] font-bold text-slate-300 opacity-0 group-hover/v:opacity-100 transition-opacity uppercase tracking-wider">
                                    Apply
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                       </div>
                    )}

                      <div className="pt-6 border-t border-slate-100">
                         <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Voucher Code</h4>
                         <div className="flex relative">
                            <Input
                              placeholder="ENTER CODE"
                              value={voucherCode}
                              onChange={(e) => {
                                setVoucherCode(e.target.value);
                                setVoucherValidationAttempted(false);
                              }}
                              className="flex-1 h-12 rounded-xl bg-gray-50 border-gray-200 font-semibold text-sm focus:bg-white focus:border-[#1B6013] transition-all uppercase pl-4 pr-24 shadow-[0_2px_10px_rgba(0,0,0,0.02)] tracking-wider"
                              disabled={isReferralVoucher || isSubmitting}
                            />
                            <Button 
                                onClick={() => handleVoucherValidation()}
                                disabled={!voucherCode || isVoucherPending || isSubmitting}
                                className="absolute right-1.5 top-1.5 bottom-1.5 h-auto px-5 rounded-lg font-bold text-xs uppercase tracking-wider bg-[#1B6013] text-white hover:bg-[#154d0f] transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-10 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {isVoucherPending ? (
                                    <Loader2 className="animate-spin h-3.5 w-3.5" />
                                ) : "Apply"}
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
         <DialogContent className="max-w-sm w-full rounded-2xl p-8">
           <DialogHeader>
             <DialogTitle className="text-xl font-bold tracking-tight">Delete Address</DialogTitle>
           </DialogHeader>
           <div className="py-6 text-gray-600 font-medium">
             Are you sure you want to remove this delivery location?
             <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm">
               {addressToDelete && (
                 <>
                   <div className="font-bold text-gray-900 uppercase tracking-tight mb-1">
                     {addressToDelete.label || (addressToDelete as any).fullName || user?.display_name}
                   </div>
                   <div className="text-gray-500 font-bold">
                     {addressToDelete.street}, {addressToDelete.city}
                   </div>
                   <div className="text-[#1B6013] font-bold mt-1 uppercase tracking-wider text-[10px]">
                     {addressToDelete.phone}
                   </div>
                 </>
               )}
             </div>
           </div>
           <DialogFooter className="flex-row gap-3">
             <Button
               type="button"
               variant="outline"
               className="flex-1 h-12 rounded-xl border-gray-200 font-bold uppercase tracking-wider text-[10px] hover:bg-gray-50 bg-white text-gray-400"
               onClick={() => setDeleteDialogOpen(false)}
             >
               Cancel
             </Button>
             <Button
               type="button"
               className="flex-1 h-12 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold uppercase tracking-wider text-[10px] shadow-lg shadow-red-100 active:scale-95 transition-all"
               disabled={isDeletingAddress}
               onClick={async () => {
                 if (addressToDelete) {
                   setIsDeletingAddress(true);
                   if (user && !addressToDelete.id.toString().startsWith("temp-")) {
                     try {
                       await deleteAddressAction(addressToDelete.id);
                     } catch (e) {
                       console.error(e);
                     }
                   }
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
               ) : "Delete"}
             </Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
    </main>
  );
};


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
