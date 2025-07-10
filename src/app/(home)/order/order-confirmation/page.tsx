"use client";

import { Separator } from "@components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatNaira } from "src/lib/utils";
import { Badge } from "@components/ui/badge";

function OrderConfirmationClientWrapper({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const [orderId, setOrderId] = useState<string | undefined>(
    searchParams?.orderId
  );
  const [missingOrderId, setMissingOrderId] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let id = orderId;
    if (!id && typeof window !== "undefined") {
      id = localStorage.getItem("lastOrderId") || undefined;
      if (id) localStorage.removeItem("lastOrderId");
    }
    if (!id) {
      setMissingOrderId(true);
      setLoading(false);
      return;
    }
    setOrderId(id);
    setLoading(true);
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setOrder(data);
      })
      .catch(() => setError("Failed to load order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  console.log(order)

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (missingOrderId) {
    return (
      <div className="p-8 text-center text-red-600">
        We could not find your order. If you just completed a payment, please
        contact support.
      </div>
    );
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">{error}</div>;
  }
  if (!order) return null;

  if (order) {
    const isSuccess =
      ["Paid", "Confirmed", "order confirmed"].includes(order.status) &&
      order.payment_status === "Paid";
    if (!isSuccess) {
      return (
        <div className="max-w-xl mx-auto mt-16 bg-white rounded-lg shadow p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Payment Not Successful
          </h2>
          <p className="mb-6 text-gray-700">
            Your payment was not successful or is still processing. Please try
            again or contact support if you believe this is an error.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/" passHref>
              <button className="bg-[#1B6013] hover:bg-[#14510f] text-white font-semibold py-3 px-8 rounded-lg shadow transition-all duration-200">
                Continue Shopping
              </button>
            </Link>
            <Link href="/account/order" passHref>
              <button className="bg-white border border-[#1B6013] text-[#1B6013] font-semibold py-3 px-8 rounded-lg shadow transition-all duration-200 hover:bg-[#f6fef7]">
                View My Orders
              </button>
            </Link>
          </div>
        </div>
      );
    }
  }

  const items: any[] = order.order_items || [];
  const subtotal = items.reduce((acc: number, item: any) => {
    const itemPrice =
      (item.option?.price !== undefined && item.option?.price !== null
        ? item.option.price
        : item.price) || 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  const deliveryFee =
    order.delivery_fee !== undefined && order.delivery_fee !== null
      ? order.delivery_fee
      : 0;
  const voucherDiscount = 0;
  const totalAmountPaid =
    order.total_amount_paid || subtotal + deliveryFee - voucherDiscount;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="grid justify-center items-center">
        <Image
          src="/order-confirmation.gif"
          width={150}
          height={150}
          alt="Order Confirmation"
          className="mx-auto mb-4 rounded-full border-4 border-green-200 shadow-lg"
          priority
        />
        <h1 className="text-2xl md:text-3xl font-bold md:mb-2 text-center text-green-900">
          Your order is completed!
        </h1>
        <p className="mb-8 text-sm text-gray-500 text-center">
          Thank you. Your Order has been received.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="w-full">
          <div className="grid grid-cols-3 bg-[#1B6013] w-full rounded-md px-6 py-4 text-white mb-6 gap-4">
            <div className="grid gap-2 text-center md:text-left">
              <p className="font-semibold text-xs md:text-sm text-gray-300">
                Order ID
              </p>
              <p className="text-sm md:text-base font-mono tracking-wider">
                {order.id?.slice(-8)}
              </p>
            </div>
            <div className="grid gap-2 text-center md:text-left">
              <p className="font-semibold text-xs md:text-sm text-gray-300">
                Payment Method
              </p>
              <p className="text-sm md:text-base capitalize">
                {order.payment_method}
              </p>
            </div>
            <div className="grid gap-2 text-center md:text-left">
              <p className="font-semibold text-xs md:text-sm text-gray-300">
                Total Amount
              </p>
              <p className="text-sm md:text-base font-bold">
                {formatNaira(totalAmountPaid)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-8 flex flex-col items-center">
            <h2 className="text-md font-semibold py-4 text-center">
              Order Details
            </h2>
            <Separator />
            <div className="w-full overflow-x-auto">
              <Table className="border-none w-full mx-auto mt-4">
                <TableHeader>
                  <TableRow className="text-base border-b-0">
                    <TableHead className="font-semibold text-center">
                      Products
                    </TableHead>
                    <TableHead className="font-semibold text-center">
                      Quantity
                    </TableHead>
                    <TableHead className="font-bold text-center">
                      Price
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id} className="border-b-0">
                      <TableCell className="border-b-0 flex items-center gap-2 justify-center">
                        <Image
                          src={
                            Array.isArray(item.products?.images) &&
                            item.products?.images?.[0]
                              ? item.products.images[0]
                              : item.bundles?.thumbnail_url ||
                                "/placeholder.png"
                          }
                          alt={item.products?.name || item.bundles?.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                        <span>{item.products?.name || item.bundles?.name}</span>
                      </TableCell>
                      <TableCell className="border-b-0 text-center">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="border-b-0 text-center">
                        {formatNaira(
                          (item.option?.price !== undefined &&
                          item.option?.price !== null
                            ? item.option.price
                            : item.price) || 0
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="w-full mt-6 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatNaira(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{formatNaira(deliveryFee)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Voucher Discount</span>
                  <span>-{formatNaira(voucherDiscount)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{formatNaira(totalAmountPaid)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Centered button below the table */}
      <div className="flex justify-center mt-8 gap-4">
        <Link href="/" passHref>
          <button className="bg-[#1B6013] hover:bg-[#14510f] text-white font-semibold py-3 px-8 rounded-lg shadow transition-all duration-200">
            Continue Shopping
          </button>
        </Link>
        <Link href="/account/order" passHref>
          <button className="bg-white border border-[#1B6013] text-[#1B6013] font-semibold py-3 px-8 rounded-lg shadow transition-all duration-200 hover:bg-[#f6fef7]">
            View My Orders
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function PageWrapper(props: {
  searchParams: { orderId?: string };
}) {
  return <OrderConfirmationClientWrapper {...props} />;
}
