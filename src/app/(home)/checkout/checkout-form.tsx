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
import React, { useState, useTransition } from "react";
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
import { toast } from "sonner";
import { addPurchase, getVoucher } from "../../../lib/actions/purchase.action";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import { Loader2, Truck } from "lucide-react";
import Link from "next/link";

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

const CheckoutForm = ({ user }: AppSidebarProps) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, itemsPrice, shippingAddress } = useSelector(
    (state: RootState) => state.cart
  );
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [isVoucherValid, setIsVoucherValid] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");

  const cost =
    locations.find((loc) => loc.value === locationAddress)?.cost || 2500;

  const totalAmount = itemsPrice;
  const totalAmountPaid =
    totalAmount + 0.075 * totalAmount + cost - voucherDiscount;

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
    mode: "onChange",
  });

  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    dispatch(setShippingAddress(values));
    toast.success("Shipping address saved successfully!");
  };

  const handleVoucherValidation = async () => {
    if (!voucherCode) {
      toast.error("Please enter a voucher code.");
      return;
    }
    if (totalAmount < 10000) {
      toast.error(
        "You need to purchase items worth at least ₦10,000 to use this voucher."
      );
      return;
    }

    startTransition(async () => {
      try {
        const result = await getVoucher(voucherCode);
        if (result.success) {
          const { isActive, usageLimit, code, discountValue, discountType } =
            result.data;
          if (isActive && usageLimit > 0) {
            if (code === "BEREKETE" && totalAmount < 75000) {
              setIsVoucherValid(false);
              toast.error(
                "You need to purchase items worth at least ₦75,000 to use this voucher."
              );
              return;
            }
            setIsVoucherValid(true);
            const discount =
              discountType === "percentage"
                ? (discountValue / 100) * totalAmount
                : discountValue;
            setVoucherDiscount(discount);
            toast.success("Voucher applied successfully!");
          } else {
            setIsVoucherValid(false);
            toast.error("Invalid or expired voucher.");
          }
        } else {
          setIsVoucherValid(false);
          toast.error(result.error || "Failed to validate voucher.");
        }
      } catch (error) {
        setIsVoucherValid(false);
        toast.error("An error occurred while validating the voucher.");
      }
    });
  };

  const handleOrderSubmission = async () => {
    try {
      setIsSubmitting(true);
      const isFormValid = await shippingAddressForm.trigger();
      if (!isFormValid) {
        toast.error("Please fill out all required fields correctly.");
        return;
      }

      if (!locationAddress) {
        toast.error("Please select a location.");
        return;
      }

      if (items.length === 0) {
        toast.error("Your cart is empty.");
        return;
      }

      startTransition(async () => {
        try {
          const orderData = {
            userId: user._id,
            cartItems: items.map((item) => ({
              productId: item.product,
              quantity: item.quantity,
            })),
            shippingAddress: shippingAddressForm.getValues(),
            totalAmount,
            totalAmountPaid,
            deliveryFee: cost,
            local_government: locationAddress,
            voucherCode: isVoucherValid ? voucherCode : "",
          };

          const result = await addPurchase(orderData);
          if (result.success) {
            toast.success("Order created successfully!");
            router.push("/order-success");
          } else {
            toast.error(result.error || "Failed to create order.");
          }
        } catch (error) {
          toast.error("An error occurred while creating your order.");
        }
      });
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-gray-50 min-h-screen py-8">
      <Container>
        <div className="">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Column - Shipping Form */}
            <div className="md:w-2/3">
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Shipping Information
                </h2>

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
                                setLocationAddress(value);
                              }}
                              disabled={isSubmitting}
                            >
                              <SelectTrigger className="rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent">
                                <SelectValue placeholder="Select your location" />
                              </SelectTrigger>
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

              {/* Voucher Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Apply Voucher
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter voucher code"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="rounded-lg p-3 border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent flex-1"
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    onClick={handleVoucherValidation}
                    disabled={isPending || isSubmitting}
                    className="rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90 px-6 py-3"
                  >
                    {isPending ? <Loader2 className="animate-spin" /> : "Apply"}
                  </Button>
                </div>
                {isVoucherValid && (
                  <div className="mt-3 text-green-600">
                    Voucher applied! You saved {formatNaira(voucherDiscount)}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="md:w-1/3">
              <Card className="border-0 shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4">
                    {items.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Your cart is empty
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div
                            key={item.name}
                            className="flex items-start gap-4"
                          >
                            <div className="relative">
                              <Image
                                width={64}
                                height={64}
                                src={item.image}
                                alt={item.name}
                                className="rounded-md border border-gray-200 object-cover h-16 w-16"
                              />
                              <Badge className="absolute -top-2 -right-2 bg-gray-800 text-white">
                                {item.quantity}
                              </Badge>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 line-clamp-1">
                                {item.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <div className="font-medium">
                              {formatNaira(item.price * item.quantity)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        {formatNaira(totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax (7.5%)</span>
                      <span className="font-medium">
                        {formatNaira(0.075 * totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium">
                        {locationAddress
                          ? formatNaira(cost)
                          : "Select location"}
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
                        {locationAddress ? formatNaira(totalAmountPaid) : "—"}
                      </span>
                    </div>

                    <Button
                      onClick={handleOrderSubmission}
                      disabled={isSubmitting || items.length === 0}
                      className="w-full py-6 rounded-lg bg-[#1B6013] !text-white hover:!bg-[#1B6013]/90"
                    >
                      {isSubmitting ? (
                        <Loader2 className="animate-spin mr-2" />
                      ) : (
                        <Truck className="mr-2 h-4 w-4" />
                      )}
                      {isSubmitting ? "Processing..." : "Place Order"}
                    </Button>

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

export default CheckoutForm;
