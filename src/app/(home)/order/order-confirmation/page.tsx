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
import { notFound } from "next/navigation";
import { fetchOrderById } from "src/queries/orders";
import { formatNaira } from "src/lib/utils";
import { Badge } from "@components/ui/badge";
import { Tables, Json } from "src/utils/database.types";
import Link from "next/link";

// If you need a client review form, import it here
// import ProductReviewForm from "./ProductReviewForm";

// Server component
export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  const orderId = searchParams?.orderId;
  if (!orderId) return notFound();

  let orderDetails: any = null;
  try {
    orderDetails = await fetchOrderById(orderId);
  } catch (err) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center text-red-500">
        Error loading order details.
      </div>
    );
  }
  if (!orderDetails) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto text-center">
        No order details found.
      </div>
    );
  }

  const items: any[] = orderDetails.order_items || [];
  const subtotal = items.reduce((acc: number, item: any) => {
    const itemPrice =
      (item.option?.price !== undefined && item.option?.price !== null
        ? item.option.price
        : item.price) || 0;
    return acc + itemPrice * item.quantity;
  }, 0);

  const deliveryFee =
    orderDetails.delivery_fee !== undefined &&
    orderDetails.delivery_fee !== null
      ? orderDetails.delivery_fee
      : 0;
  const voucherDiscount = 0;
  const totalAmountPaid =
    orderDetails.total_amount_paid || subtotal + deliveryFee - voucherDiscount;

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
          <div className="grid grid-cols-1 md:grid-cols-3 bg-[#1B6013] w-full rounded-md px-6 py-4 text-white mb-6 gap-4">
        <div className="grid gap-2 text-center md:text-left">
          <p className="font-semibold text-xs md:text-sm text-gray-300">
            Order ID
          </p>
          <p className="text-sm md:text-base font-mono tracking-wider">
            {orderDetails.id?.slice(-8)}
          </p>
        </div>
        <div className="grid gap-2 text-center md:text-left">
          <p className="font-semibold text-xs md:text-sm text-gray-300">
            Payment Method
          </p>
          <p className="text-sm md:text-base capitalize">
            {orderDetails.payment_method}
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
      <div className="flex justify-center mt-8">
        <Link href="/" passHref>
          <button className="bg-[#1B6013] hover:bg-[#14510f] text-white font-semibold py-3 px-8 rounded-lg shadow transition-all duration-200">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
}
