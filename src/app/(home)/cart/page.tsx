"use client";

import Container from "@components/shared/Container";
import { Button } from "@components/ui/button";
import { Card } from "@components/ui/card";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import Image from "next/image";
import { Trash2Icon } from "lucide-react";
import { useDispatch } from "react-redux";
import { AiOutlineMinus, AiOutlinePlus } from "react-icons/ai";
import { formatNaira } from "src/lib/utils";
import { OrderItem } from "src/types";
import { removeItem, updateItem } from "src/store/features/cartSlice";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Link from "next/link";
import { Badge } from "@components/ui/badge";
import { useToast } from "src/hooks/useToast"; 

const CartPage = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const cart = useSelector((state: any) => state.cart);
  const { items, itemsPrice, shippingPrice, totalPrice } = cart;

  const handleQuantityChange = (item: OrderItem, increment: boolean) => {
    const newQuantity = increment ? item.quantity + 1 : item.quantity - 1;
    if (newQuantity > 0) {
      dispatch(updateItem({ item, quantity: newQuantity }));
      showToast(
        `${increment ? "Increased" : "Decreased"} quantity for ${item.name}`,
        "success"
      );
    } else {
      showToast(
        `Quantity cannot be less than 1`,
        "warning"
      );
    }
  };

  const handleRemoveItem = (item: OrderItem) => {
    dispatch(removeItem({ productId: item.product }));
    showToast(
      `${item.name} removed from cart`,
      "success"
    );
  };

  return (
    <main className="">
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
      <Container className="">
        <h1 className="text-2xl font-bold mb-10">
          Your Bag <span className="text-gray-400"> ({items.length})</span>
        </h1>

        {items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold">YouPr Bag is empty</h2>
              <p className="text-muted-foreground">
                Start adding some products!
              </p>
              <Button
                onClick={() => router.push("/")}
                className="rounded-full px-8 py-4 bg-[#1B6013]"
                size="lg"
              >
                Continue Shopping
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                {items.map((item: OrderItem) => (
                  <div key={item.product} className="border-b pb-6 last:border-0">
                    <div className="flex gap-4">
                      <Link
                        href={`/product/${item.slug}`}
                        className="relative size-16 flex-shrink-0"
                      >
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </Link>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <div>
                            <Link
                              href={`/product/${item.slug}`}
                              className="font-medium text-lg hover:underline"
                            >
                              {item.name}
                              <span className="">
                              {item.option?.name && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                  Option: {item.option.name}
                                </span>
                              )}
                              </span>
                            </Link>
                            {/* <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              {item.option?.name && (
                                <span className="ml-2 text-sm text-muted-foreground">
                                  Option: {item.option.name}
                                </span>
                              )}
                            </div> */}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap justify-between items-center gap-4 ">
                          <div className="text-sm font-semibold">
                            {formatNaira(item.price)}
                          </div>
                          <div className="flex gap-2 items-center">

                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 rounded-full border p-3 border-gray-600"
                            onClick={() => handleRemoveItem(item)}
                          >
                            <Trash2Icon className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center rounded-full border border-gray-300">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 !border-none !bg-transparent !shadow-transparent"
                              onClick={() => handleQuantityChange(item, false)}
                            >
                              <AiOutlineMinus className="size-2" />
                            </Button>
                            <span className="w-6 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 !border-none !bg-transparent !shadow-transparent"
                              onClick={() => handleQuantityChange(item, true)}
                            >
                              <AiOutlinePlus className="size-2" />
                            </Button>
                          </div>
                          </div>
                          
                          {/* <div className="text-lg font-medium">
                            Subtotal: {formatNaira(item.price * item.quantity)}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            <div className="w-full lg:w-96">
              <Card className="p-6 sticky top-6">
                <h2 className="text-xl font-bold mb-6">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {formatNaira(itemsPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee</span>
                    <span className="font-medium">
                      {formatNaira(shippingPrice || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-4 flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatNaira(totalPrice)}</span>
                  </div>
                </div>
                <Button
                  className="!bg-[#1B6013] !text-white hover:bg-[#1B6013]/90 hover:!text-white transition-all ease-in-out !rounded w-full mt-4 py-4"
                  onClick={() => {
                    showToast("Proceeding to checkout", "info");
                    router.push("/checkout");
                  }}
                >
                  Proceed to Checkout
                </Button>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  or{" "}
                  <button
                    onClick={() => router.push("/")}
                    className="text-primary hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              </Card>
            </div>
          </div>
        )}
      </Container>
    </main>
  );
};

export default CartPage;
