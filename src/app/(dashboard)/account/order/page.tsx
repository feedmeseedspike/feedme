import ProductSortSelector from "@components/shared/product/product-sort-selector";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import Image from "next/image";
import React from "react";
import { products } from "src/lib/data";

const orderSortOptions = [
  { value: "date-newest", name: "Date: Newest first" },
  { value: "date-oldest", name: "Date: Oldest first" },
  { value: "total-amount-high-to-low", name: "Total Amount: High to low" },
  { value: "total-amount-low-to-high", name: "Total Amount: Low to high" },
  { value: "status-pending", name: "Status: Pending first" },
  { value: "status-shipped", name: "Status: Shipped first" },
  { value: "status-delivered", name: "Status: Delivered first" },
  { value: "status-canceled", name: "Status: Canceled first" },
];

const orders = [
  {
    orderId: "#123456",
    paymentMethod: "Credit Card",
    transactionId: "TX123456",
    status: "Delivered",
    date: "2023-10-15", 
    products: products.slice(5, 8),
  },
  {
    orderId: "#123457",
    paymentMethod: "PayPal",
    transactionId: "TX123457",
    status: "Shipped",
    date: "2023-10-12",
    products: products.slice(2, 5),
  },
  {
    orderId: "#123458",
    paymentMethod: "Credit Card",
    transactionId: "TX123458",
    status: "Pending",
    date: "2023-10-10",
    products: products.slice(0, 3),
  },
  {
    orderId: "#123459",
    paymentMethod: "PayPal",
    transactionId: "TX123459",
    status: "Canceled",
    date: "2023-10-08", 
    products: products.slice(3, 6),
  },
];

const Order = () => {
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "Delivered":
        return {
          badgeColor: "border-green-500 text-green-500 bg-green-200",
          message: "Your order has been delivered.",
          dateLabel: "Delivery Date",
        };
      case "Shipped":
        return {
          badgeColor: "border-blue-500 text-blue-500 bg-blue-200",
          message: "Your order has been shipped.",
          dateLabel: "Shipment Date",
        };
      case "Pending":
        return {
          badgeColor: "border-yellow-500 text-yellow-500 bg-yellow-200",
          message: "Your order is pending.",
          dateLabel: "Order Date",
        };
      case "Canceled":
        return {
          badgeColor: "border-red-500 text-red-500 bg-red-200",
          message: "Your order has been canceled.",
          dateLabel: "Cancellation Date",
        };
      default:
        return {
          badgeColor: "bg-gray-500 border-gray-500 text-gray-500",
          message: "Status unknown.",
          dateLabel: "Date",
        };
    }
  };

  return (
    <main className="px-4">
      <div className="">
        <h1 className="text-2xl font-semibold mb-4">Orders ({orders.length})</h1>
        {orders.map((order) => {
          const { badgeColor, message, dateLabel } = getStatusDetails(order.status);

          return (
            <div key={order.orderId} className="border rounded-3xl mb-6">
              <div className="grid grid-cols-5 bg-[#1B6013] w-full rounded-t-3xl px-6 py-4">
                <div className="grid gap-2">
                  <p className="font-semibold text-xs md:text-sm text-gray-300">
                    Order ID{" "}
                  </p>
                  <p className="">{order.orderId}</p>
                </div>
                <div className="grid gap-2">
                  <p className="font-semibold text-xs md:text-sm  text-gray-300">
                    Payment Method{" "}
                  </p>
                  <p className="">{order.paymentMethod}</p>
                </div>
                <div className="grid gap-2">
                  <p className="font-semibold text-xs md:text-sm  text-gray-300">
                    Transaction ID{" "}
                  </p>
                  <p className="">{order.transactionId}</p>
                </div>
                <div className="grid gap-2">
                  <p className="font-semibold text-xs md:text-sm  text-gray-300">
                    Status{" "}
                  </p>
                  <p className="">{order.status}</p>
                </div>
                <div className="grid gap-2">
                  <p className="font-semibold text-xs md:text-sm  text-gray-300">
                    {dateLabel}{" "}
                  </p>
                  <p className="">{order.date}</p>
                </div>
              </div>
              <div className="grid gap-3 p-4">
                {order.products.map((product) => (
                  <React.Fragment key={product._id}>
                    <div className="flex gap-2 items-center">
                      <Image
                        src={product.images[0]}
                        width={100}
                        height={120}
                        alt={product.name}
                        className="rounded-md object-cover"
                      />
                      <div className="">
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs">{product.price}</p>
                      </div>
                    </div>
                    <Separator className="my-2" />
                  </React.Fragment>
                ))}
                <div className="flex items-center gap-2">
                  <Badge className={`${badgeColor} px-2 py-1 border rounded-full text-xs`}>
                    {order.status}
                  </Badge>
                  <p className="text-sm text-gray-600">{message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
};

export default Order;