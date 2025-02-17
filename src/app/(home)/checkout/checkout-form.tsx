"use client";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardFooter } from "@components/ui/card";
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
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import useIsMounted from "src/hooks/use-is-mounted";
import { ShippingAddress } from "src/types";
import { ShippingAddressSchema } from "src/lib/validator";
import { SubmitHandler, useForm } from "react-hook-form";
import { Input } from "@components/ui/input";
import { setShippingAddress } from "src/store/features/cartSlice";
import { RootState } from "src/store";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";

const shippingAddressDefaultValues =
  process.env.NODE_ENV === "development"
    ? {
        fullName: "Jeremiah Oyedele",
        street: "10, Yemisi Street",
        city: "Lagos",
        // province: '',
        phone: "+2348144602273",
        postalCode: "100276",
        country: "Nigeria",
      }
    : {
        fullName: "",
        street: "",
        city: "",
        province: "",
        phone: "",
        postalCode: "",
        country: "",
      };

const CheckoutForm = () => {
  // const { toast } = useToast()
  const router = useRouter();
  const dispatch = useDispatch();
  const {
    items,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    shippingAddress,
    deliveryDateIndex,
  } = useSelector((state: RootState) => state.cart);

  // const { site, availablePaymentMethods, defaultPaymentMethod, availableDeliveryDates } = useSelector((state) => state.settings)

  const isMounted = useIsMounted();

  const shippingAddressForm = useForm<ShippingAddress>({
    resolver: zodResolver(ShippingAddressSchema),
    defaultValues: shippingAddress || shippingAddressDefaultValues,
  });
  const onSubmitShippingAddress: SubmitHandler<ShippingAddress> = (values) => {
    setShippingAddress(values);
    setIsAddressSelected(true);
  };

  useEffect(() => {
    if (!isMounted || !shippingAddress) return;
    shippingAddressForm.setValue("fullName", shippingAddress.fullName);
    shippingAddressForm.setValue("street", shippingAddress.street);
    shippingAddressForm.setValue("city", shippingAddress.city);
    shippingAddressForm.setValue("country", shippingAddress.country);
    shippingAddressForm.setValue("postalCode", shippingAddress.postalCode);
    shippingAddressForm.setValue("province", shippingAddress.province);
    shippingAddressForm.setValue("phone", shippingAddress.phone);
  }, [items, isMounted, router, shippingAddress, shippingAddressForm]);

  const [isAddressSelected, setIsAddressSelected] = useState<boolean>(false);
  const [isPaymentMethodSelected, setIsPaymentMethodSelected] =
    useState<boolean>(false);
  const [isDeliveryDateSelected, setIsDeliveryDateSelected] =
    useState<boolean>(false);

  const handlePlaceOrder = async () => {};
  const handleSelectPaymentMethod = () => {
    setIsAddressSelected(true);
    setIsPaymentMethodSelected(true);
  };
  const handleSelectShippingAddress = () => {
    shippingAddressForm.handleSubmit(onSubmitShippingAddress)();
  };

  return (
    <main>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
          <div className="lg:col-span-4">
            <h1 className="font-bold text-2xl uppercase py-5">
              Shipping Address
            </h1>
            <Separator className="" />
            <div>
              <Form {...shippingAddressForm}>
                <form
                  method="post"
                  onSubmit={shippingAddressForm.handleSubmit(
                    onSubmitShippingAddress
                  )}
                  className="space-y-4"
                >
                  <div className="my-4 uppercase">
                    <div className="p-4 space-y-2">
                      <div className="flex flex-col gap-5 md:flex-row ">
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
                                <Input placeholder="Enter address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-5 md:flex-row">
                        <FormField
                          control={shippingAddressForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={shippingAddressForm.control}
                          name="province"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Province</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter province"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={shippingAddressForm.control}
                          name="country"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter country" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex flex-col gap-5 md:flex-row">
                        <FormField
                          control={shippingAddressForm.control}
                          name="postalCode"
                          render={({ field }) => (
                            <FormItem className="w-full">
                              <FormLabel>Postal Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter postal code"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <Button
                      type='submit'
                      className='rounded-full font-bold'
                      disabled={items.length === 0}
                    >
                      Ship to this address
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-[8px] lg:mt-20 p-4 h-fit">
            <h1 className="uppercase pt-5">order summary</h1>
            <Separator />
            <div className=" flex flex-col gap-3 py-5">
              {items.length === 0 ? (
                <div className="flex justify-center items-center text-xl text-gray-500">
                  Your cart is empty.
                </div>
              ) : (
                items.map((item) => (
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

              <Separator className="my-2" />
              <div className="flex w-full items-center space-x-2">
                <Input
                  type="email"
                  placeholder="Discount Code"
                  className="h-12"
                />
                <Button type="submit" className="btn-primary h-12">
                  Apply
                </Button>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <p className="">Subtotal</p>
                <p className="">{formatNaira(itemsPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
};

export default CheckoutForm;
