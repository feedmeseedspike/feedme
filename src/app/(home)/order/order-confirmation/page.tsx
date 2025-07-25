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
import { formatNaira, showToast } from "src/lib/utils";
import { Badge } from "@components/ui/badge";
import { clearCart } from "src/store/features/cartSlice";
import { useDispatch } from "react-redux";
import { useClearCartMutation } from "@/queries/cart";

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
  const dispatch = useDispatch();
    const clearCartMutation = useClearCartMutation();

  async function clearData(){
    await clearCartMutation.mutateAsync();
  }

  useEffect(()=>{
    console.log('removing carts')
    clearData()},[])

  useEffect(() => {
    let id = orderId;
    localStorage.removeItem("voucherCode");
    localStorage.removeItem("voucherDiscount");
    dispatch(clearCart());
    localStorage.removeItem("cart");
    showToast("Order created successfully!", "success");
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

  // Payment status badge logic
  let paymentStatusLabel = "Unknown";
  let paymentStatusColor = "bg-gray-400 text-white";
  if (order.payment_status === "Paid") {
    paymentStatusLabel = "Paid";
    paymentStatusColor = "bg-green-600 text-white";
  } else if (
    ["Pending", "Processing", "Awaiting Payment"].includes(order.payment_status)
  ) {
    paymentStatusLabel = "Pending";
    paymentStatusColor = "bg-yellow-500 text-white";
  } else if (
    ["Failed", "Declined", "Cancelled", "Error"].includes(order.payment_status)
  ) {
    paymentStatusLabel = "Failed";
    paymentStatusColor = "bg-red-600 text-white";
  } else if (order.payment_status) {
    paymentStatusLabel = order.payment_status;
    paymentStatusColor = "bg-gray-400 text-white";
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
        <p className="mb-2 text-sm text-gray-500 text-center">
          Thank you. Your Order has been received.
        </p>
        {/* Payment status badge */}
        <div className="flex justify-center mb-4">
          <span
            className={`inline-block px-4 py-1 rounded-full text-sm font-semibold ${paymentStatusColor}`}>
            {paymentStatusLabel}
          </span>
        </div>
        {/* Optionally, show a message for failed or pending payments */}
        {paymentStatusLabel !== "Paid" && (
          <div className="mb-4 text-center text-red-600 text-sm">
            {paymentStatusLabel === "Failed"
              ? "Your payment was not successful. Please try again or contact support."
              : paymentStatusLabel === "Pending"
                ? "Your payment is still processing. If you have any issues, please contact support."
                : null}
          </div>
        )}
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
              <Table className="border-none w-full mt-4">
                <TableHeader>
                  <TableRow className="text-base border-b-0">
                    <TableHead className="font-semibold !px-0">
                      Products
                    </TableHead>
                    <TableHead className="font-semibold !px-0">
                      Quantity
                    </TableHead>
                    <TableHead className="font-bold !px-0">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: any) => (
                    <TableRow key={item.id} className="border-b-0">
                      <TableCell className="border-b-0 flex items-center gap-2 ">
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
                      <TableCell className="border-b-0">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="border-b-0">
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
