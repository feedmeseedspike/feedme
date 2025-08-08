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
import { useRouter } from "next/navigation";
import React, { useState, useTransition, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { setShippingAddress } from "src/store/features/cartSlice";
import { RootState } from "src/store";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";
import { useAddPurchaseMutation } from "src/queries/orders";
import { useVoucherValidationMutation } from "src/queries/vouchers";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Truck } from "lucide-react";
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
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { clearCart } from "src/store/features/cartSlice";
import { useClearCartMutation } from "src/queries/cart";
import axios from "axios";
import { sendPushNotification } from "@/lib/actions/pushnotification.action";

interface GroupedCartItem {
  product?: CartItem["products"];
  bundle?: CartItem["bundles"];
  offer?: CartItem["offers"];
  options: Record<string, CartItem>;
}

interface CartProductGroupDisplayProps {
  productGroup: GroupedCartItem;
  productId: string;
}

const CartProductGroupDisplay = React.memo(
  ({ productId, productGroup }: CartProductGroupDisplayProps) => {
    return (
      <div key={productId} className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {productGroup.product?.name || productGroup.bundle?.name || productGroup.offer?.title ? (
            <p className="h6-bold text-lg">
              {productGroup.product?.name || productGroup.bundle?.name || productGroup.offer?.title}
            </p>
          ) : (
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
          )}
        </div>
        {Object.entries(productGroup.options).map(
          ([optionKey, item]: [string, CartItem]) => (
            <CartItemDisplay key={item.id} item={item} />
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
}

const CartItemDisplay = React.memo(({ item }: CartItemDisplayProps) => {
  const productOption = isProductOption(item.option) ? item.option : null;

  return (
    <React.Fragment>
      <div className="flex items-center gap-3 sm:gap-4 overflow-y-visible">
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
          alt={item.products?.name || item.bundles?.name || item.offers?.title || "Product image"}
          className="h-[64px] rounded-[5px] border-[0.31px] border-[#DDD5DD] object-contain"
        />
        <div className="flex flex-col gap-[6px] w-full">
          <div className="flex justify-between">
            {productOption?.name && (
              <p className="h6-light !text-[14px]">{productOption.name}</p>
            )}
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[#101828] font-bold">
              {formatNaira(
                (productOption?.price !== undefined &&
                productOption?.price !== null
                  ? productOption.price
                  : item.price) || 0
              )}{" "}
            </p>
            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
          </div>
        </div>
      </div>
      <Separator />
    </React.Fragment>
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
      }
    : {
        fullName: "",
        street: "",
        location: "",
        phone: "",
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
  user,
  deliveryLocations,
}: CheckoutFormProps) => {
  // console.log("CheckoutForm: User:", user);
  // console.log("CheckoutForm: addresses:", addresses);
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: cartItems, isLoading, isError, error } = useCartQuery();
  const items: CartItem[] = useMemo(() => cartItems || [], [cartItems]);

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

  const { mutateAsync: addPurchaseMutation } = useAddPurchaseMutation();
  const { mutateAsync: validateVoucherMutation } =
    useVoucherValidationMutation();
  const clearCartMutation = useClearCartMutation();

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
      shippingAddressForm.reset({
        fullName: user?.display_name || selectedAddress.label || "",
        street: selectedAddress.street,
        location: selectedAddress.city,
        phone: selectedAddress.phone,
      });
    }
  }, [
    selectedAddressId,
    selectedAddress,
    shippingAddressForm,
    user?.display_name,
  ]);

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

  // Free shipping logic
  const FREE_SHIPPING_THRESHOLD = 50000;
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
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
      return 0.1 * subtotal; // Service charge commented out
    }
    return 0;
  }, [user, subtotal /*, serviceCharge*/]);

  const totalAmount = subtotal;
  const totalAmountPaid =
    subtotal + cost /*+ serviceCharge*/ - voucherDiscount - staffDiscount;

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

    if (user && !isLoadingReferralStatus && !autoAppliedReferralVoucher) {
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
          totalAmount,
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
          // GUARD: Ensure user.user_id is defined
          if (!user?.user_id) {
            showToast("User not found. Please log in again.", "error");
            setIsSubmitting(false);
            return;
          }
          const orderData = {
            userId: user.user_id, // now always a string
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
                        orderNumber: result.data.orderId,
                        customerName:
                          user.display_name ||
                          shippingAddressForm.getValues().fullName,
                        customerPhone: shippingAddressForm.getValues().phone,
                        itemsOrdered: items.map((item) => ({
                          title:
                            item.products?.name || item.bundles?.name || item.offers?.title || "",
                          price: item.price,
                          quantity: item.quantity,
                        })),
                        deliveryAddress: shippingAddressForm.getValues().street,
                        localGovernment:
                          shippingAddressForm.getValues().location,
                      },
                      userOrderProps: {
                        orderNumber: result.data.orderId,
                        customerName:
                          user.display_name ||
                          shippingAddressForm.getValues().fullName,
                        customerPhone: shippingAddressForm.getValues().phone,
                        itemsOrdered: items.map((item) => ({
                          title:
                            item.products?.name || item.bundles?.name || item.offers?.title || "",
                          price: item.price,
                          quantity: item.quantity,
                        })),
                        deliveryAddress: shippingAddressForm.getValues().street,
                        deliveryFee: cost,
                        serviceCharge: /*serviceCharge*/ 0, // Service charge commented out
                        totalAmount: subtotal,
                        totalAmountPaid: totalAmountPaid,
                        userid:user.user_id
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
              // await sendPushNotification(
              //   "Success",
              //   "Order created successfully!",
              //   user.user_id
              // );
              // Clear voucher from localStorage after successful order
              localStorage.removeItem("voucherCode");
              localStorage.removeItem("voucherDiscount");
              dispatch(clearCart());
              localStorage.removeItem("cart");
              await clearCartMutation.mutateAsync();
              showToast("Order created successfully!", "success");
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
            // GUARD: Ensure user.user_id is defined
            if (!user?.user_id) {
              showToast("User not found. Please log in again.", "error");
              setIsSubmitting(false);
              return;
            }
            // Create the order in the backend (simulate processWalletPayment but for paystack)
            const orderRes = await fetch("/api/orders/initialize", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: user.email,
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
            const userEmail =
              user && "email" in user && user.email ? user.email : undefined;
            if (!userEmail) {
              showToast("User email not found. Please log in again.", "error");
              setIsSubmitting(false);
              return;
            }
            const response = await axios.post("/api/wallet/initialize", {
              email: user.email,
              amount: Math.round(totalAmountPaid),
              type: "direct_payment",
              orderId: orderResult.data.orderId,
              // Additional data for webhook processing
              autoAppliedReferralVoucher: autoAppliedReferralVoucher,
              customerName:
                user.display_name || shippingAddressForm.getValues().fullName,
              customerPhone: shippingAddressForm.getValues().phone,
              itemsOrdered: items.map((item) => ({
                title: item.products?.name || item.bundles?.name || "",
                price: item.price,
                quantity: item.quantity,
              })),
              deliveryAddress: shippingAddressForm.getValues().street,
              localGovernment: shippingAddressForm.getValues().location,
              deliveryFee: cost,
              serviceCharge: /*serviceCharge*/ 0, // Service charge commented out
              subtotal: subtotal,
            });
            if (response.data.authorization_url) {
              // Store orderId for use after Paystack redirect (optional, for fallback)
              // await sendPushNotification(
              //   "Success",
              //   "Order created successfully!",
              //   user.user_id
              // );
              console.log(orderResult.data);
              if (orderResult.data.orderId) {
                localStorage.setItem("lastOrderId", orderResult.data.orderId);
              }
              window.location.href = response.data.authorization_url;
              setIsSubmitting(false);
              return; // Stop further execution
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

  return (
    <main className="bg-gray-50 min-h-screen py-8">
      <Container>
        <div className="">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Shipping Form / Payment Method / Voucher */}
            <div className="md:w-2/3">
              <Stepper orientation="vertical" initialStep={0} steps={steps}>
                <Step label="Shipping Information">
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Shipping Information
                    </h2>

                    {/* Address Summary Card */}
                    {selectedAddress ? (
                      <div className="border rounded-lg p-4 mb-6 bg-gray-50 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-green-600 font-semibold">
                            <span className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">
                              ✔
                            </span>
                            1. CUSTOMER ADDRESS
                          </span>
                          <button
                            className="text-blue-600 hover:underline text-sm"
                            onClick={() => {
                              setShowAddressModal(true);
                              setShowAddNewForm(false);
                            }}>
                            Change
                          </button>
                        </div>
                        <div className="mt-2">
                          <div className="font-semibold text-lg">
                            {selectedAddress.label || user?.display_name}
                          </div>
                          <div className="text-gray-700 text-sm">
                            {selectedAddress.street}, {selectedAddress.city} |{" "}
                            {selectedAddress.phone}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Modal for address selection/addition */}
                    <Dialog
                      open={showAddressModal}
                      onOpenChange={setShowAddressModal}>
                      <DialogContent className="max-w-md w-full max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Select Delivery Address</DialogTitle>
                        </DialogHeader>
                        {!showAddNewForm ? (
                          <div
                            className="space-y-4 overflow-y-auto"
                            style={{ maxHeight: "70vh" }}>
                            {userAddresses && userAddresses.length > 0 ? (
                              <div className="space-y-2">
                                {userAddresses.map((address) => (
                                  <label
                                    key={address.id}
                                    className={`flex items-start gap-2 p-2 rounded border cursor-pointer ${selectedAddressId === address.id ? "border-green-600 bg-green-50" : "border-gray-300"}`}>
                                    <input
                                      type="radio"
                                      checked={selectedAddressId === address.id}
                                      onChange={() =>
                                        setSelectedAddressId(address.id)
                                      }
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="font-semibold">
                                        {address.label || user?.display_name}
                                      </div>
                                      <div className="text-sm text-gray-700">
                                        {address.street}, {address.city} |{" "}
                                        {address.phone}
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      className="ml-2 text-blue-600 hover:text-blue-800"
                                      onClick={() => {
                                        setEditingAddress(address);
                                        setShowAddNewForm(true);
                                        shippingAddressForm.reset({
                                          fullName: address.label || "",
                                          street: address.street,
                                          location: address.city,
                                          phone: address.phone,
                                        });
                                      }}
                                      title="Edit">
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      className="ml-1 text-red-600 hover:text-red-800"
                                      onClick={() => {
                                        setAddressToDelete(address);
                                        setDeleteDialogOpen(true);
                                      }}
                                      title="Delete">
                                      <Trash2 size={16} />
                                    </button>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                No saved addresses found.
                              </div>
                            )}
                            <button
                              className="w-full mt-2 py-2 border border-dashed border-green-600 rounded text-green-700 hover:bg-green-50"
                              onClick={() => {
                                setShowAddNewForm(true);
                                setEditingAddress(null);
                                shippingAddressForm.reset({
                                  fullName: "",
                                  street: "",
                                  location: "",
                                  phone: "",
                                });
                              }}>
                              + Add New Address
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
                                      let address: AddressWithId;
                                      if (editingAddress) {
                                        // For now, just remove and re-add (implement updateAddressAction if needed)
                                        // address = await updateAddressAction(editingAddress.id, { ...values });
                                        // For demo, just add as new
                                        address = await addAddressAction({
                                          label: values.fullName || "Home",
                                          street: values.street,
                                          city: values.location,
                                          state: "",
                                          zip: "",
                                          country: "",
                                          phone: values.phone,
                                        });
                                        setUserAddresses((prev) =>
                                          prev.map((a) =>
                                            a.id === editingAddress.id
                                              ? address
                                              : a
                                          )
                                        );
                                      } else {
                                        address = await addAddressAction({
                                          label: values.fullName || "Home",
                                          street: values.street,
                                          city: values.location,
                                          state: "",
                                          zip: "",
                                          country: "",
                                          phone: values.phone,
                                        });
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
                                className="space-y-4">
                                <FormField
                                  control={shippingAddressForm.control}
                                  name="fullName"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Full Name</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter full name"
                                          {...field}
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
                                      <FormLabel>Address</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter street address"
                                          {...field}
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
                                      <FormLabel>Location</FormLabel>
                                      <Select
                                        value={field.value}
                                        onValueChange={field.onChange}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select your location" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {deliveryLocations.map((location) => (
                                            <SelectItem
                                              key={location.name}
                                              value={location.name}>
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
                                      <FormLabel>Phone Number</FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Enter phone number"
                                          {...field}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <DialogFooter>
                                  <Button
                                    type="submit"
                                    className="bg-[#1B6013]/90 text-white"
                                    disabled={isAddingAddress}>
                                    {isAddingAddress ? (
                                      <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                    ) : null}
                                    {editingAddress
                                      ? "Update Address"
                                      : "Save Address"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setShowAddNewForm(false);
                                      setEditingAddress(null);
                                    }}>
                                    Cancel
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
                              className="bg-gray-100 text-gray-700 w-full hover:bg-gray-200"
                              onClick={() => setShowAddressModal(false)}>
                              Use Selected Address
                            </Button>
                          </DialogFooter>
                        )}
                      </DialogContent>
                    </Dialog>

                    {/* If no address is selected, show the form inline (first time user) */}
                    {userAddresses.length === 0 && (
                      <div className="mt-2">
                        <Form {...shippingAddressForm}>
                          <form
                            onSubmit={shippingAddressForm.handleSubmit(
                              async (values) => {
                                setIsAddingAddress(true);
                                try {
                                  const address = await addAddressAction({
                                    label: values.fullName || "Home",
                                    street: values.street,
                                    city: values.location,
                                    state: "",
                                    zip: "",
                                    country: "",
                                    phone: values.phone,
                                  });
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
                            className="space-y-4">
                            <FormField
                              control={shippingAddressForm.control}
                              name="fullName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Full Name</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter full name"
                                      {...field}
                                      disabled={isAddingAddress}
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
                                  <FormLabel>Address</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter street address"
                                      {...field}
                                      disabled={isAddingAddress}
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
                                  <FormLabel>Location</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    disabled={isAddingAddress}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select your location" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {deliveryLocations.map((location) => (
                                        <SelectItem
                                          key={location.name}
                                          value={location.name}>
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
                                  <FormLabel>Phone Number</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter phone number"
                                      {...field}
                                      disabled={isAddingAddress}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="submit"
                                className="bg-[#1B6013]/90 text-white"
                                disabled={isAddingAddress}>
                                {isAddingAddress ? (
                                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                ) : null}
                                Save Address
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </div>
                    )}
                  </div>
                </Step>

                <Step label="Payment Method">
                  <>
                    {/* Payment Method Selection - Redesigned, No Icons */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Payment Method
                      </h3>
                      <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 items-stretch">
                        {/* Paystack Card */}
                        <button
                          type="button"
                          onClick={() => setSelectedPaymentMethod("paystack")}
                          className={`flex-1 border rounded-lg p-6 flex flex-col items-center gap-2 transition-all duration-150 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-600
                            ${selectedPaymentMethod === "paystack" ? "border-green-600 ring-2 ring-green-600 bg-green-50" : "border-gray-300 bg-white"}
                          `}>
                          <span className="font-semibold text-lg tracking-wide">
                            Paystack
                          </span>
                          <span className="text-gray-500 text-sm text-center">
                            Pay securely with card, bank, or USSD
                          </span>
                          {selectedPaymentMethod === "paystack" && (
                            <span className="mt-2 text-green-700 text-xs font-medium">
                              Selected
                            </span>
                          )}
                        </button>
                        {/* Wallet Card */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPaymentMethod("wallet");
                          }}
                          className={`flex-1 border rounded-lg p-6 flex flex-col items-center gap-2 transition-all duration-150 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-600
                            ${selectedPaymentMethod === "wallet" ? "border-green-600 ring-2 ring-green-600 bg-green-50" : "border-gray-300 bg-white"}
                          `}>
                          <span className="font-semibold text-lg tracking-wide">
                            Wallet
                          </span>
                          <span className="text-gray-500 text-sm text-center">
                            Use your FeedMe wallet balance
                          </span>
                          <span className="mt-2 text-green-700 text-xs font-medium">
                            Balance:{" "}
                            {walletBalance !== undefined &&
                            walletBalance !== null
                              ? formatNaira(walletBalance)
                              : "—"}
                          </span>
                          {walletBalance !== undefined &&
                            walletBalance !== null &&
                            walletBalance < totalAmountPaid && (
                              <>
                                <span className="text-xs text-red-600 mt-1">
                                  Insufficient balance
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push("/account/wallet");
                                  }}
                                  className="mt-2 px-4 py-2 rounded bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 text-xs font-medium transition">
                                  Fund Wallet
                                </button>
                              </>
                            )}
                          {selectedPaymentMethod === "wallet" &&
                            walletBalance !== undefined &&
                            walletBalance !== null &&
                            walletBalance >= totalAmountPaid && (
                              <span className="mt-2 text-green-700 text-xs font-medium">
                                Selected
                              </span>
                            )}
                        </button>
                      </div>
                    </div>
                  </>
                </Step>

                <Step label="Review Order">
                  <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Review Your Order
                    </h2>
                    <p className="text-gray-700 mb-4">
                      Please review your order details before placing your
                      order.
                    </p>
                    {/* You can add more detailed summary here if needed, 
                  e.g., display shipping address and payment method again */}
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

            {/* Right Column - Order Summary */}
            <div className="md:w-1/3">
              {/* Always visible but "Place Order" button only on step 3 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4">
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        Loading cart...
                      </div>
                    ) : items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Your cart is empty
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(groupedItems).map(
                          ([productId, productGroup]: [
                            string,
                            GroupedCartItem,
                          ]) => (
                            <CartProductGroupDisplay
                              key={productId}
                              productId={productId}
                              productGroup={productGroup}
                            />
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatNaira(subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">
                        {qualifiesForFreeShipping ? (
                          <span className="text-green-600 font-semibold">
                            Free
                          </span>
                        ) : formLocation ? (
                          formatNaira(cost)
                        ) : (
                          "Select location"
                        )}
                      </span>
                    </div>
                    {qualifiesForFreeShipping && (
                      <div className="text-green-600 text-sm mb-2">
                        🎉 Congratulations! You have unlocked{" "}
                        <b>free shipping</b>!
                      </div>
                    )}
                    {!qualifiesForFreeShipping && subtotal > 0 && (
                      <div className="text-[#F0800F] text-sm mb-2">
                        Add{" "}
                        <span className="font-bold">
                          {formatNaira(FREE_SHIPPING_THRESHOLD - subtotal)}
                        </span>{" "}
                        to your order to get <b>free shipping</b>!
                      </div>
                    )}
                    {isVoucherValid && (
                      <div className="flex justify-between text-green-600">
                        <span>Voucher Discount</span>
                        <span>-{formatNaira(voucherDiscount)}</span>
                      </div>
                    )}
                    {user?.is_staff && staffDiscount > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span>Staff Discount (10% off)</span>
                        <span>-{formatNaira(staffDiscount)}</span>
                      </div>
                    )}
                    {/* <div className="flex justify-between">
                      <span className="text-gray-600">Service Charge</span>
                      <span className="font-medium">
                        {formatNaira(serviceCharge)}
                      </span>
                    </div> */}
                  </div>

                  <Separator />

                  <div className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-xl font-bold text-primary">
                        {formLocation ? formatNaira(totalAmountPaid) : "—"}
                      </span>
                    </div>
                    <div className="py-4 border-t">
                      {/* <h4 className="font-semibold mb-3">Apply Voucher</h4> */}
                      <div className="flex gap-2 mb-3">
                        <div className="space-y-4 w-full">
                          <Label
                            htmlFor="voucherCode"
                            className="font-semibold text-lg">
                            Voucher Code
                          </Label>
                          <div className="relative flex gap-2">
                            <Input
                              id="voucherCode"
                              placeholder="Enter voucher code"
                              value={voucherCode}
                              onChange={(e) => {
                                setVoucherCode(e.target.value);
                                setVoucherValidationAttempted(false);
                              }}
                              className="flex-grow py-6 ring-1 ring-zinc-400 "
                              disabled={isReferralVoucher || isSubmitting}
                            />
                            <ShimmerButton
                              type="button"
                              onClick={() => {
                                setVoucherValidationAttempted(true);
                                handleVoucherValidation();
                              }}
                              className="px-6 py-3 text-sm font-medium"
                              shimmerColor="#1B6013"
                              shimmerSize="0.1em"
                              borderRadius="8px"
                              background="#1B6013"
                              disabled={
                                isReferralVoucher ||
                                isSubmitting ||
                                isLoadingReferralStatus
                              }>
                              Apply
                            </ShimmerButton>
                          </div>
                          {isReferralVoucher && (
                            <p className="text-sm text-blue-600">
                              Referral voucher applied. You cannot apply another
                              voucher.
                            </p>
                          )}
                          {isVoucherValid &&
                            voucherDiscount > 0 &&
                            !isReferralVoucher && (
                              <p className="text-sm text-green-600">
                                Discount Applied: {formatNaira(voucherDiscount)}
                              </p>
                            )}
                          {voucherValidationAttempted &&
                            !isVoucherValid &&
                            voucherCode &&
                            !isReferralVoucher && (
                              <p className="text-sm text-red-600">
                                Invalid or expired voucher.
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="mt-3 text-xs text-gray-500 text-center">
                      By placing your order, you agree to our{" "}
                      <Link
                        href="/return-policy"
                        className="text-green-600 hover:underline">
                        Return Policy
                      </Link>
                      .
                    </div>
                  </div>
                </CardContent>
              </Card>
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
              onClick={() => setDeleteDialogOpen(false)}>
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
              }}>
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
        showToast(
          "Please fill out all required shipping fields correctly.",
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
    <div className="flex w-full justify-end gap-2 mt-6">
      {activeStep !== 0 && ( // Only show Prev button if not on the first step
        <Button
          onClick={handlePrev}
          className="rounded-lg bg-gray-200 !text-gray-700 hover:!bg-gray-300 px-6 py-3">
          Prev
        </Button>
      )}

      {activeStep === 0 && (
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 px-6 py-3 ml-auto" // Added ml-auto to push to right
        >
          Continue to Payment
        </Button>
      )}

      {activeStep === 1 && (
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 px-6 py-3">
          Review Order
        </Button>
      )}

      {isLastStep && (
        <Button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || items.length === 0}
          className="rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 px-6 py-3">
          {isSubmitting ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Truck className="mr-2 h-4 w-4" />
          )}
          {isSubmitting ? "Processing..." : "Place Order"}
        </Button>
      )}
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
