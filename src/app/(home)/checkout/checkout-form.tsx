"use client";

console.log("CheckoutForm: Top of component file.");

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
import { ShippingAddress, UserData } from "src/types";
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
import { Loader2, Truck } from "lucide-react";
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
}

const CartProductGroupDisplay = React.memo(
  ({ productId, productGroup }: CartProductGroupDisplayProps) => {
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
  const productOption = item.option as unknown as ProductOption | null;

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
            "/placeholder.png"
          }
          alt={item.products?.name || item.bundles?.name || "Product image"}
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

const locations = [
  { value: "Agege", label: "Agege", cost: 2500 },
  { value: "Ajeromi-Ifelodun", label: "Ajeromi-Ifelodun", cost: 2500 },
  { value: "Alimosho", label: "Alimosho", cost: 2500 },
  { value: "Amuwo-Odofin", label: "Amuwo-Odofin", cost: 2500 },
  { value: "Apapa", label: "Apapa", cost: 4500 },
  { value: "Badagry", label: "Badagry", cost: 4500 },
  { value: "Epe", label: "Epe", cost: 4500 },
  { value: "Eti-Osa", label: "Eti-Osa", cost: 2500 },
  { value: "Ibeju-Lekki", label: "Ibeju-Lekki", cost: 2500 },
  { value: "Ifako/Ijaye", label: "Ifako/Ijaye", cost: 2500 },
  { value: "Ikeja", label: "Ikeja", cost: 2500 },
  { value: "Ikorodu", label: "Ikorodu", cost: 3000 },
  { value: "Iyana-Ipaja", label: "Iyana-Ipaja", cost: 3000 },
  { value: "Ajah", label: "Ajah", cost: 3000 },
  { value: "Kosofe", label: "Kosofe", cost: 2500 },
  { value: "Lagos Island", label: "Lagos Island", cost: 2500 },
  { value: "Lagos Mainland", label: "Lagos Mainland", cost: 2500 },
  { value: "Mushin", label: "Mushin", cost: 2500 },
  { value: "Ojo", label: "Ojo", cost: 4500 },
  { value: "Oshodi–Isolo", label: "Oshodi–Isolo", cost: 2500 },
  { value: "Shomolu", label: "Shomolu", cost: 2500 },
  { value: "Surulere", label: "Surulere", cost: 2500 },
];

const shippingAddressDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        fullName: "Jeremiah Oyedele",
        street: "10, Yemisi Street",
        location: "Badagry",
        phone: "+2348144602273",
      }
    : {
        fullName: "",
        street: "",
        location: "",
        phone: "",
      };

interface AppSidebarProps {
  user: UserData;
}

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

const CheckoutForm = ({ user }: AppSidebarProps) => {
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

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data: referralStatusData, isLoading: isLoadingReferralStatus } =
    useQuery({
      queryKey: ["referralStatus", user?.id],
      queryFn: async () => {
        if (!user?.id) return null;
        const response = await fetch(`/api/referral/status?userId=${user.id}`);
        if (!response.ok) throw new Error("Failed to fetch referral status");
        return response.json();
      },
      enabled: !!user?.id,
    });

  console.log("CheckoutForm: Component rendering.");
  console.log("CheckoutForm: User prop received:", user);
  console.log("CheckoutForm: isLoadingAddresses (before useQuery result log):");

  const { data: userAddresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ["userAddresses"],
    queryFn: getUserAddresses,
    enabled: !!user?.id,
  });

  useEffect(() => {
    console.log("CheckoutForm: isLoadingAddresses state:", isLoadingAddresses);
    console.log("CheckoutForm: userAddresses state:", userAddresses);
  }, [isLoadingAddresses, userAddresses]);

  const { data: walletBalance, isLoading: isLoadingWalletBalance } =
    useWalletBalanceQuery(user?.id);

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddressDefaultValues,
    mode: "onChange",
  });

  const formLocation = shippingAddressForm.watch("location");
  const cost =
    locations.find((loc) => loc.value === formLocation)?.cost || 2500;

  const subtotal = useMemo(
    () =>
      items.reduce((acc, item) => {
        let itemPrice = 0;
        if (item.bundle_id && item.bundles) {
          itemPrice = item.bundles.price || 0;
        } else if (item.product_id && item.products) {
          const productOption = item.option as unknown as ProductOption | null;
          itemPrice =
            (productOption?.price !== undefined && productOption?.price !== null
              ? productOption.price
              : item.price) || 0;
        }
        return acc + itemPrice * item.quantity;
      }, 0),
    [items]
  );

  const totalAmount = subtotal;
  const totalAmountPaid = subtotal + cost - voucherDiscount;

  useEffect(() => {
    const autoApplyReferralVoucher = async () => {
      const storedReferralCode = localStorage.getItem("referral_code");

      if (user?.id && storedReferralCode && !autoAppliedReferralVoucher) {
        console.log("Attempting to auto-apply referral voucher...");
        try {
          const response = await fetch("/api/referral", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              referrerEmail: storedReferralCode,
              referredUserId: user.id,
              referredUserEmail: user.email,
            }),
          });

          if (response.ok) {
            showToast(
              "Referral applied automatically! Check your email for a discount.",
              "success"
            );
            localStorage.removeItem("referral_code");
            setAutoAppliedReferralVoucher(true);

            queryClient.invalidateQueries({ queryKey: ["referralStatus"] });
            queryClient.invalidateQueries({ queryKey: ["referredUsers"] });
          } else {
            const errorData = await response.json();
            // Only show toast if it's not a 409 (conflict - already applied)
            if (response.status !== 409) {
              showToast(
                errorData.message || "Failed to auto-apply referral.",
                "error"
              );
            } else {
              // If 409, it means it was already applied, so just mark as applied
              localStorage.removeItem("referral_code");
              setAutoAppliedReferralVoucher(true);
              showToast("Referral already applied.", "info"); // Informational toast
            }
          }
        } catch (error: any) {
          console.error("Error during auto-referral application:", error);
          showToast("Failed to auto-apply referral due to an error.", "error");
          // Ensure autoAppliedReferralVoucher is reset on error if it wasn't a 409
          setAutoAppliedReferralVoucher(false);
        }
      }
    };

    if (user?.id && !isLoadingReferralStatus) {
      const hasReferralStatus = referralStatusData?.data !== null;

      if (!hasReferralStatus) {
        autoApplyReferralVoucher();
      }
    }

    const autoApplyExistingReferralVoucher = async () => {
      if (!user?.id || isVoucherValid || !subtotal || subtotal === 0) return;

      try {
        // First, check if there's an existing referral record for this referredUserId
        const existingReferralCheckResponse = await fetch(
          `/api/referral/status?referredUserId=${user.id}`
        );
        const existingReferralCheckData =
          await existingReferralCheckResponse.json();

        if (
          existingReferralCheckResponse.ok &&
          existingReferralCheckData.data &&
          existingReferralCheckData.data.status === "applied" &&
          !existingReferralCheckData.data.referred_discount_given
        ) {
          console.log("Found existing unredeemed referral for referred user.");

          const voucherResult = await createVoucher({
            userId: user.id,
            discountType: "fixed",
            discountValue: 1000,
            name: "Referral Sign-up Discount",
            description: "Discount for signing up via a referral",
            maxUses: 1,
          });

          if (voucherResult.success && voucherResult.voucherCode) {
            validateVoucherMutation({
              code: voucherResult.voucherCode,
              totalAmount: subtotal,
            });
            showToast(
              "Your referral discount has been automatically applied!",
              "success"
            );
            setAutoAppliedReferralVoucher(true);
          } else {
            console.error(
              "Failed to create voucher for referred user:",
              voucherResult.error
            );
            showToast("Failed to apply referral discount.", "error");
          }
        }
      } catch (error) {
        console.error("Error auto-applying existing referral voucher:", error);
      }
    };

    if (user && !isLoadingReferralStatus && !autoAppliedReferralVoucher) {
      startTransition(() => {
        autoApplyExistingReferralVoucher().catch((error) => {
          console.error("Error with autoApplyExistingReferralVoucher:", error);
          setVoucherCode("");
          setVoucherDiscount(0);
          setIsVoucherValid(false);
          setVoucherId(null);
          setAutoAppliedReferralVoucher(false);
        });
      });
    }
  }, [
    referralStatusData,
    user?.id,
    items,
    isVoucherValid,
    validateVoucherMutation,
    showToast,
    startTransition,
    subtotal,
    autoAppliedReferralVoucher, // Add autoAppliedReferralVoucher to dependencies
    queryClient,
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
        console.log(
          "totalAmount before calling getVoucher:",
          totalAmount,
          "Type:",
          typeof totalAmount
        );
        const result = await validateVoucherMutation({
          code: voucherCode,
          totalAmount,
        });
        console.log("Result from getVoucher server action:", result);
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
          showToast("Voucher applied successfully!", "success");
        } else {
          setIsVoucherValid(false);
          showToast(result.error || "Voucher validation failed.", "error");
        }
      } catch (error: any) {
        setIsVoucherValid(false);
        console.error("Error caught in handleVoucherValidation:", error);
        showToast(
          error.message || "An error occurred while validating the voucher.",
          "error"
        );
      }
    });
  };

  const handleOrderSubmission = async () => {
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
          const orderData = {
            userId: user.id,
            cartItems: (items || []).map((item) => ({
              productId: item.product_id || "",
              bundleId: item.bundle_id || "",
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
          } else if (selectedPaymentMethod === "paystack") {
            result = await processWalletPayment(orderData);
          }

          if (result.success) {
            showToast("Order created successfully!", "success");
            router.push(
              `/order/order-confirmation?orderId=${result.data.orderId}`
            );
          } else {
            showToast(result.error || "Failed to process order.", "error");
          }
        } catch (error: any) {
          console.error("Error in startTransition:", error);
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
      console.error("Error in handleOrderSubmission try block:", error);
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

                    {/* Saved Addresses Select */}
                    {isLoadingAddresses ? (
                      <p>Loading addresses...</p>
                    ) : (
                      userAddresses &&
                      userAddresses.length > 0 && (
                        <div className="mb-6">
                          <div className="space-y-2">
                            <Label className="text-gray-700">
                              Select a Saved Address
                            </Label>
                            <Select onValueChange={handleSelectSavedAddress}>
                              <SelectTrigger className="rounded-lg p-3 border-gray-300">
                                <SelectValue placeholder="Select a saved address" />
                              </SelectTrigger>
                              <SelectContent>
                                {userAddresses.map((address: AddressWithId) => (
                                  <SelectItem
                                    key={address.id}
                                    value={address.id}
                                    className="hover:bg-gray-100 px-4 py-2"
                                  >
                                    {`${address.street}, ${address.city}, ${address.country}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-gray-500 mt-2">
                              Or enter a new address below.
                            </p>
                          </div>
                        </div>
                      )
                    )}

                    <Form {...shippingAddressForm}>
                      <form
                        onSubmit={shippingAddressForm.handleSubmit(
                          onSubmitShippingAddress
                        )}
                        className="space-y-6"
                      >
                        <div className="grid grid-cols-1 gap-6">
                          <FormField
                            control={shippingAddressForm.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Full Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter full name"
                                    {...field}
                                    className="rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={shippingAddressForm.control}
                            name="street"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Address
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter street address"
                                    {...field}
                                    className="rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={shippingAddressForm.control}
                            name="location"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Location
                                </FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                  }}
                                  disabled={isSubmitting}
                                >
                                  <FormControl>
                                    <SelectTrigger className="rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent">
                                      <SelectValue placeholder="Select your location" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {locations.map((location) => (
                                      <SelectItem
                                        key={location.value}
                                        value={location.value}
                                        className="hover:bg-gray-100 px-4 py-2"
                                      >
                                        <div className="flex justify-between items-center">
                                          <span>{location.label}</span>
                                          <span className="text-sm text-gray-500">
                                            {formatNaira(location.cost)}
                                          </span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={shippingAddressForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-gray-700">
                                  Phone Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter phone number"
                                    {...field}
                                    className="rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                                    disabled={isSubmitting}
                                  />
                                </FormControl>
                                <FormMessage className="text-red-500" />
                              </FormItem>
                            )}
                          />
                        </div>
                      </form>
                    </Form>
                  </div>
                </Step>

                <Step label="Payment Method">
                  <>
                    {/* Payment Method Selection */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        Payment Method
                      </h3>
                      <div className="flex gap-2 items-end">
                        <div>
                          <p className="text-sm font-medium">Wallet Balance:</p>
                          {isLoadingWalletBalance ? (
                            <p>Loading...</p>
                          ) : walletBalance !== undefined &&
                            walletBalance !== null ? (
                            <p className="text-lg font-bold text-green-600">
                              {formatNaira(walletBalance)}
                            </p>
                          ) : (
                            <p className="text-gray-500">
                              Could not load balance.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Choose Method
                          </label>
                          <Select
                            value={selectedPaymentMethod}
                            onValueChange={setSelectedPaymentMethod}
                          >
                            <SelectTrigger className="mt-1 w-48 rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="paystack">Paystack</SelectItem>
                              <SelectItem value="wallet">Wallet</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
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
                            GroupedCartItem
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
                        {formLocation ? formatNaira(cost) : "Select location"}
                      </span>
                    </div>
                    {isVoucherValid && (
                      <div className="flex justify-between text-green-600">
                        <span>Voucher Discount</span>
                        <span>-{formatNaira(voucherDiscount)}</span>
                      </div>
                    )}
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
                      <h4 className="font-semibold mb-3">Apply Voucher</h4>
                      <div className="flex gap-2 mb-3">
                        <div className="space-y-4 w-full">
                          <Label
                            htmlFor="voucherCode"
                            className="font-semibold text-lg"
                          >
                            Voucher Code (Optional)
                          </Label>
                          <div className="relative flex gap-2">
                            <Input
                              id="voucherCode"
                              placeholder="Enter voucher code"
                              value={voucherCode}
                              onChange={(e) => setVoucherCode(e.target.value)}
                              className="flex-grow py-6 ring-1 ring-zinc-400 focus:ring-2 focus:ring-primary focus:border-transparent"
                              disabled={
                                isSubmitting ||
                                autoAppliedReferralVoucher !== null
                              }
                              readOnly={autoAppliedReferralVoucher !== null}
                            />
                            <ShimmerButton
                              type="button"
                              onClick={handleVoucherValidation}
                              className="px-6 py-3 text-sm font-medium"
                              shimmerColor="#1B6013" // Use your primary color for shimmer
                              shimmerSize="0.1em"
                              borderRadius="8px"
                              background="#1B6013"
                              disabled={
                                isSubmitting ||
                                isLoadingReferralStatus ||
                                autoAppliedReferralVoucher !== null
                              }
                            >
                              Apply
                            </ShimmerButton>
                          </div>
                          {isVoucherValid && voucherDiscount > 0 && (
                            <p className="text-sm text-green-600">
                              Discount Applied: {formatNaira(voucherDiscount)}
                            </p>
                          )}
                          {!isVoucherValid && voucherCode && (
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
                        className="text-green-600 hover:underline"
                      >
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
          className="rounded-lg bg-gray-200 !text-gray-700 hover:!bg-gray-300 px-6 py-3"
        >
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
          className="rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 px-6 py-3"
        >
          Review Order
        </Button>
      )}

      {isLastStep && (
        <Button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || items.length === 0}
          className="rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 px-6 py-3"
        >
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

export default CheckoutForm;
