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

// Location data with costs
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

// Default shipping address values
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
  const { items, checkoutItems, itemsPrice, shippingAddress } = useSelector(
    (state: RootState) => state.cart
  );
  const [isPending, startTransition] = useTransition();

  // Voucher and purchase logic
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [isVoucherValid, setIsVoucherValid] = useState(false);

  // Location selection
  const [locationAddress, setLocationAddress] = useState("");
  const cost =
    locations.find((loc) => loc.value === locationAddress)?.cost || 2500;

  // Use checkoutItems if available, otherwise use all items
  const itemsToProcess = checkoutItems.length > 0 ? checkoutItems : items;

  // Calculate total based on checkout items
  const totalAmount =
    checkoutItems.length > 0
      ? checkoutItems.reduce((acc, item) => acc + item.price * item.quantity, 0)
      : itemsPrice;

  const totalAmountPaid =
    totalAmount + 0.075 * totalAmount + cost - voucherDiscount;

  // Shipping address form
  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
  });

  // Handle shipping address submission
  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    dispatch(setShippingAddress(values));
    toast.success("Shipping address saved successfully!");
  };

  // Handle voucher validation
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
    });
  };

  // Handle order submission
  const handleOrderSubmission = async () => {
    const isFormValid = await shippingAddressForm.trigger();
    if (!isFormValid) {
      toast.error("Please fill out all required fields correctly.");
      return;
    }

    if (!locationAddress) {
      toast.error("Please select a location.");
      return;
    }

    startTransition(async () => {
      const orderData = {
        userId: user._id,
        cartItems: itemsToProcess.map((item) => ({
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
        router.push("/order-success"); // Redirect to success page
      } else {
        toast.error(result.error || "Failed to create order.");
      }
    });
  };

  return (
    <main>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-4">
            <h1 className="font-bold text-2xl px-4 pt-8">Billing Details</h1>
            <Form {...shippingAddressForm}>
              <form
                onSubmit={shippingAddressForm.handleSubmit(
                  onSubmitShippingAddress
                )}
                className="space-y-6"
              >
                <div className="my-4 uppercase">
                  <div className="p-4 space-y-4">
                    <div className="flex flex-col gap-5 md:flex-row">
                      <FormField
                        control={shippingAddressForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter full name"
                                {...field}
                                className="rounded-full p-[1.2rem]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={shippingAddressForm.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter address"
                                {...field}
                                className="rounded-full p-[1.2rem]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-5 md:flex-row">
                      <FormField
                        control={shippingAddressForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Location</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                setLocationAddress(value);
                              }}
                            >
                              <SelectTrigger className="rounded-full p-[1.2rem] border">
                                <SelectValue placeholder="Select your location" />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map((location) => (
                                  <SelectItem
                                    key={location.value}
                                    value={location.value}
                                  >
                                    {location.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormField
                        control={shippingAddressForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Phone number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter phone number"
                                {...field}
                                className="rounded-full p-[1.2rem]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </div>
          <div className="lg:col-span-2 border rounded-[12px] lg:mt-20 p-4 h-fit">
            <h1 className="font-semibold pt-5 pb-3">Order Summary</h1>
            <Separator />
            <div className="flex flex-col gap-3 py-5">
              {itemsToProcess.length === 0 ? (
                <div className="flex justify-center items-center text-xl text-gray-500">
                  Your cart is empty.
                </div>
              ) : (
                itemsToProcess.map((item) => (
                  <div
                    className="flex items-center justify-between"
                    key={item.name}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative w-fit">
                        <Image
                          width={64}
                          height={64}
                          src={item.image}
                          alt={item.name}
                          className="h-[64px] rounded-[5px] border-[0.31px] border-[#DDD5DD] object-contain"
                        />
                        <p className="absolute -top-2 -right-2 bg-[#D0D5DD] px-[6px] py-[2px] rounded-full text-xs text-white">
                          {item.quantity}
                        </p>
                      </div>
                      <div>
                        <h4 className="h4-bold">{item.name}</h4>
                      </div>
                    </div>
                    <div>
                      <p className="h4-bold">
                        {formatNaira(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
};

export default CheckoutForm;
