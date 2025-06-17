"use client";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import {
  Package,
  Calendar,
  CreditCard,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
  Eye,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { UseQueryResult, useQuery, useQueries } from "@tanstack/react-query";
import { fetchUserOrders } from "../../../../queries/orders";
import { formatNaira } from "src/lib/utils";
import { Database, Tables } from "../../../../utils/database.types";
import { Json } from "../../../../utils/database.types";
import { useUser } from "src/hooks/useUser";
import { useSearchParams } from "next/navigation";
import PaginationBar from "@components/shared/pagination";
import { getProductById } from "../../../../queries/products";
import { fetchBundleByIdWithProducts } from "../../../../queries/bundles";

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

interface ProductOption {
  name: string;
  price: number;
  image?: string;
  stockStatus?: string;
}

interface ShippingAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  fullName?: string;
  phone?: string;
  email?: string;
  location?: string;
  [key: string]: Json | undefined; // Make it compatible with Json
}

// Define the type for items after enrichment, including full product/bundle data
interface EnrichedOrderItem {
  id: string;
  order_id: string | null;
  product_id: string | null;
  quantity: number;
  price: number | null;
  option: Json | null;
  bundle_id: string | null;
  products?: Tables<"products"> | null; // Full product type
  bundles?: (Tables<"bundles"> & { products: Tables<"products">[] }) | null; // Full bundle type
  vendor_id: string | null;
}

// UserOrder definition, pick all properties from Tables<'orders'>['Row']
// and then override/add custom fields.
type UserOrder = Pick<
  Tables<"orders">,
  | "id"
  | "created_at"
  | "updated_at"
  | "user_id"
  | "status"
  | "total_amount"
  | "voucher_id"
  | "delivery_fee"
  | "payment_method"
  | "payment_status"
  | "local_government"
  | "total_amount_paid"
> & {
  voucher_discount: number | null; // Add voucher_discount as it's not in Tables<'orders'>['Row']
  shipping_address: ShippingAddress | string | null; // Override shipping_address type
  order_items: Array<{
    id: string;
    order_id: string | null;
    product_id: string | null;
    quantity: number;
    price: number | null;
    option: Json | null;
    bundle_id: string | null;
    products?: { name: string | null; images: string[] | null } | null; // Initial shape of products
    bundles?: { name: string | null; thumbnail_url: string | null } | null; // Initial shape of bundles
    vendor_id: string | null;
  }> | null;
};

const getStatusDetails = (status: string | null) => {
  const statusConfig: {
    [key: string]: {
      badgeColor: string;
      icon: any;
      message: string;
      dateLabel: string;
    };
  } = {
    "order delivered": {
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      message: "Order delivered successfully",
      dateLabel: "Delivered On",
    },
    "In transit": {
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Truck,
      message: "Order is on the way",
      dateLabel: "Shipped On",
    },
    "order confirmed": {
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
      message: "Order is being processed",
      dateLabel: "Order Date",
    },
    Cancelled: {
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
      message: "Order was canceled",
      dateLabel: "Canceled On",
    },
  };

  return (
    statusConfig[status || ""] || {
      badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
      message: "Unknown status",
      dateLabel: "Date",
    }
  );
};

const formatShippingAddress = (
  address: ShippingAddress | string | null
): string => {
  if (!address) return "N/A";

  let parsedAddress: ShippingAddress;
  if (typeof address === "string") {
    try {
      parsedAddress = JSON.parse(address) as ShippingAddress;
    } catch {
      return address; // If parsing fails, return the original string
    }
  } else {
    parsedAddress = address;
  }

  const parts = [
    parsedAddress.street,
    parsedAddress.city,
    parsedAddress.state,
    parsedAddress.zip,
    parsedAddress.country,
  ].filter(Boolean);

  return parts.join(", ") || "N/A";
};

// Define ProductOrBundle type for useQueries results
type ProductOrBundle =
  | Tables<"products">
  | (Tables<"bundles"> & { products: Tables<"products">[] });

// New component for displaying a grouped product/bundle and its options
interface GroupedOrderItem {
  product?: Tables<"products"> | null; // Use full Tables type
  bundle?: (Tables<"bundles"> & { products: Tables<"products">[] }) | null; // Use full Tables type
  options: Record<string, EnrichedOrderItem>; // Use EnrichedOrderItem
}

// New component for individual order items
interface OrderItemDisplayProps {
  item: EnrichedOrderItem; // Use EnrichedOrderItem
  formatCurrency: (amount: number | null) => string;
}

const OrderItemDisplay = React.memo(
  ({ item, formatCurrency }: OrderItemDisplayProps) => {
    const productOption = item.option as ProductOption | null;

    return (
      <React.Fragment>
        <div className="flex items-center gap-3 sm:gap-4 overflow-y-visible">
          <Image
            width={64}
            height={64}
            src={
              productOption?.image ||
              (item.products?.images && item.products.images[0]) ||
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
                {formatCurrency(
                  (productOption?.price !== undefined &&
                  productOption?.price !== null
                    ? productOption.price
                    : item.price) || 0
                )}
              </p>
              <div className="flex items-center gap-2 sm:gap-4">
                <span>Qty: {item.quantity}</span>
              </div>
            </div>
          </div>
        </div>
        <Separator />
      </React.Fragment>
    );
  }
);

OrderItemDisplay.displayName = "OrderItemDisplay";

interface OrderProductGroupDisplayProps {
  productGroup: GroupedOrderItem;
  formatCurrency: (amount: number | null) => string;
}

const OrderProductGroupDisplay = React.memo(
  ({ productGroup, formatCurrency }: OrderProductGroupDisplayProps) => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          {productGroup.product?.name || productGroup.bundle?.name ? (
            <p className="text-lg font-semibold">
              {productGroup.product?.name || productGroup.bundle?.name}
            </p>
          ) : (
            <div className="h-6 w-32 bg-gray-200 animate-pulse rounded" />
          )}
        </div>
        {Object.entries(productGroup.options).map(
          ([optionKey, item]: [string, EnrichedOrderItem]) => (
            <OrderItemDisplay
              key={item.id}
              item={item}
              formatCurrency={formatCurrency}
            />
          )
        )}
      </div>
    );
  }
);

OrderProductGroupDisplay.displayName = "OrderProductGroupDisplay";

const OrderDetailsModal = ({
  order,
  isOpen,
  onClose,
}: {
  order: UserOrder;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [showAllProducts, setShowAllProducts] = useState(false);
  const user = useUser();

  const productBundleQueries = useMemo(() => {
    if (!order.order_items) return [];
    return order.order_items.flatMap((item) => {
      const queries = [];
      if (item.product_id) {
        queries.push({
          queryKey: ["product", item.product_id],
          queryFn: () => getProductById(item.product_id!),
        });
      }
      if (item.bundle_id) {
        queries.push({
          queryKey: ["bundle", item.bundle_id],
          queryFn: () => fetchBundleByIdWithProducts(item.bundle_id!),
        });
      }
      return queries;
    });
  }, [order.order_items]);

  const productBundleResults: UseQueryResult<ProductOrBundle>[] = useQueries({
    queries: productBundleQueries,
  });

  const enrichedOrderItems = useMemo(() => {
    let currentResultIndex = 0;
    return (order.order_items || []).map((item: Tables<"order_items">) => {
      let productData: Tables<"products"> | null = null;
      let bundleData:
        | (Tables<"bundles"> & { products: Tables<"products">[] })
        | null = null;

      const queryResult = productBundleResults[currentResultIndex];

      if (item.product_id) {
        // Type guard to check if queryResult.data is a product
        if (
          queryResult?.data &&
          "images" in queryResult.data &&
          "name" in queryResult.data
        ) {
          productData = queryResult.data as Tables<"products">;
        }
      } else if (item.bundle_id) {
        // Type guard to check if queryResult.data is a bundle
        if (
          queryResult?.data &&
          "thumbnail_url" in queryResult.data &&
          "name" in queryResult.data
        ) {
          bundleData = queryResult.data as Tables<"bundles"> & {
            products: Tables<"products">[];
          };
        }
      }
      currentResultIndex++;

      // Return the enriched item
      const enrichedItem: EnrichedOrderItem = {
        ...item,
        products: productData,
        bundles: bundleData,
      };
      return enrichedItem;
    });
  }, [order.order_items, productBundleResults]);

  const displayedProducts = showAllProducts
    ? enrichedOrderItems
    : enrichedOrderItems?.slice(0, 3);

  const groupedOrderItems = useMemo(() => {
    return (displayedProducts || []).reduce(
      (acc: Record<string, GroupedOrderItem>, item: EnrichedOrderItem) => {
        let key: string;
        if (item.product_id) {
          key = `product-${item.product_id}`;
          if (!acc[key]) {
            acc[key] = {
              product: item.products, // Use the already enriched product
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
              bundle: item.bundles, // Use the already enriched bundle
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
  }, [displayedProducts]);

  const formatCurrency = (amount: number | null) => {
    return amount ? formatNaira(amount) : "₦0.00";
  };

  const calculateSubtotal = () => {
    return (order.order_items || []).reduce(
      (sum: number, item: Tables<"order_items">) =>
        sum + (item.price || 0) * item.quantity,
      0
    );
  };

  const subtotal = calculateSubtotal();
  const totalAmount = order.total_amount || subtotal;

  const displayStatus = order.status || "";

  const {
    badgeColor,
    icon: StatusIcon,
    message,
    dateLabel,
  } = getStatusDetails(displayStatus);

  const handleDownloadInvoicePdf = (invoiceOrder: UserOrder) => {
    if (!invoiceOrder) {
      toast.error("Order details not available for invoice.");
      return;
    }

    const shippingAddress = formatShippingAddress(
      invoiceOrder.shipping_address
    );

    const invoiceContent = `
      <html>
      <head>
          <title>Invoice - Order #${invoiceOrder.id?.substring(0, 8)}</title>
          <style>
              body { font-family: 'Helvetica Neue', 'Helvetica', Arial, sans-serif; margin: 20px; color: #333; }
              .container { width: 80%; margin: 0 auto; border: 1px solid #eee; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
              h1, h2, h3 { color: #1B6013; }
              .header, .footer { text-align: center; margin-bottom: 20px; }
              .header img { max-width: 150px; margin-bottom: 10px; }
              .details, .items { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .details td, .details th, .items td, .items th { padding: 8px; border: 1px solid #ddd; text-align: left; }
              .items th { background-color: #f2f2f2; }
              .total { text-align: right; font-weight: bold; }
              .footer { font-size: 0.8em; color: #777; }
              .section-title { margin-top: 20px; margin-bottom: 10px; font-weight: bold; color: #1B6013; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Invoice</h1>
                  <p>Date: ${new Date().toLocaleDateString()}</p>
              </div>

              <div class="section-title">Order Details</div>
              <table class="details">
                  <tr>
                      <th>Order ID:</th>
                      <td>${invoiceOrder.id?.substring(0, 8) || "N/A"}</td>
                      <th>Order Date:</th>
                      <td>${
                        invoiceOrder.created_at
                          ? new Date(
                              invoiceOrder.created_at
                            ).toLocaleDateString()
                          : "N/A"
                      }</td>
                  </tr>
                  <tr>
                      <th>Payment Method:</th>
                      <td>${invoiceOrder.payment_method || "N/A"}</td>
                      <th>Payment Status:</th>
                      <td>${invoiceOrder.payment_status || "N/A"}</td>
                  </tr>
                  <tr>
                      <th>Shipping Address:</th>
                      <td colspan="3">${shippingAddress}</td>
                  </tr>
              </table>

              <div class="section-title">Order Items</div>
              <table class="items">
                  <thead>
                      <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Total</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${
                        // Use groupedOrderItems to generate invoice table
                        Object.values(groupedOrderItems)
                          .map((group: GroupedOrderItem) =>
                            Object.values(group.options)
                              .map((item: EnrichedOrderItem) => {
                                console.log("Account Order Page Item:", item);
                                const itemPrice =
                                  typeof item.price === "number"
                                    ? item.price
                                    : 0;
                                return `
                          <tr>
                              <td>
                                  ${
                                    item.products?.images?.[0]
                                      ? `<img src="${
                                          item.products.images[0]
                                        }" alt="${
                                          item.products.name ||
                                          item.bundles?.name ||
                                          "Product"
                                        }" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;"/>`
                                      : ""
                                  }
                                  ${
                                    item.products?.name ||
                                    item.bundles?.name ||
                                    "N/A"
                                  } ${
                                  item.option
                                    ? `(${JSON.stringify(item.option)})`
                                    : ""
                                }
                              </td>
                              <td>${item.quantity}</td>
                              <td>${formatCurrency(itemPrice)}</td>
                              <td>${formatCurrency(
                                item.quantity * itemPrice
                              )}</td>
                          </tr>
                      `;
                              })
                              .join("")
                          )
                          .join("") || '<tr><td colspan="4">No items</td></tr>'
                      }
                  </tbody>
              </table>

              <div class="total">
                  <p>Subtotal: ${formatCurrency(calculateSubtotal())}</p>
                  <p>Delivery Fee: ${formatCurrency(
                    invoiceOrder.delivery_fee
                  )}</p>
                  <p>Voucher Discount: -${formatCurrency(
                    invoiceOrder.voucher_discount
                  )}</p>
                  <h3>Total Amount: ${formatCurrency(
                    invoiceOrder.total_amount
                  )}</h3>
              </div>

              <div class="footer">
                  <p>&copy; ${new Date().getFullYear()} Feedme. All rights reserved.</p>
              </div>
          </div>
      </body>
      </html>
    `;
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(invoiceContent);
      newWindow.document.close();
      newWindow.print();
    } else {
      toast.error(
        "Failed to open new window for printing. Please allow pop-ups."
      );
    }
  };

  const shippingAddress = formatShippingAddress(order.shipping_address);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-gray-700 overflow-y-auto">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              Order ID: {order.id?.substring(0, 8) || "N/A"}
            </h3>
            <Badge className={badgeColor}>{order.status || "Unknown"}</Badge>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Summary</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>
                  Order Date:{" "}
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString()
                    : "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <CreditCard size={16} />
                <span>Payment Method: {order.payment_method || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1">
                <StatusIcon size={16} />
                <span>Status: {order.status || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={16} />
                <span>Payment Status: {order.payment_status || "Unknown"}</span>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <MapPin size={16} />
                <span>Shipping Address: {shippingAddress}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h4 className="font-semibold mb-2">Products</h4>
            <div className="grid gap-4">
              {Object.entries(groupedOrderItems).map(
                ([id, productGroup]: [string, GroupedOrderItem]) => (
                  <OrderProductGroupDisplay
                    key={id}
                    productGroup={productGroup}
                    formatCurrency={formatCurrency}
                  />
                )
              )}
            </div>
            {order.order_items && order.order_items.length > 3 && (
              <Button
                variant="link"
                onClick={() => setShowAllProducts(!showAllProducts)}
                className="mt-2 p-0"
              >
                {showAllProducts
                  ? "Show Less Products"
                  : `View All ${order.order_items.length} Products`}
              </Button>
            )}
          </div>

          <Separator />

          <div className="grid gap-2 text-sm font-semibold">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {order.delivery_fee && (
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            {order.voucher_discount && (
              <div className="flex justify-between">
                <span>Voucher Discount:</span>
                <span>-{formatCurrency(order.voucher_discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => handleDownloadInvoicePdf(order)}
            >
              <Download size={16} className="mr-2" /> Download Invoice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Order = () => {
  const [selectedOrder, setSelectedOrder] = useState<UserOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const user = useUser();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get("page")) || 1;
  const ordersPerPage = 5;

  const { data: ordersData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ["userOrders", user?.id, currentPage],
    queryFn: () =>
      user?.id
        ? fetchUserOrders(user.id, currentPage, ordersPerPage)
        : Promise.resolve({ data: [], count: 0 }),
    enabled: !!user?.id,
  });

  console.log(
    "Account Order Page - ordersData:",
    ordersData,
    "isLoadingOrders:",
    isLoadingOrders
  );

  const orders = useMemo(() => {
    return (ordersData?.data || []).map((order: Tables<"orders">) => ({
      // Spread existing properties from the fetched order (Tables<'orders'>['Row'])
      ...order,
      // Custom fields/overrides that might not be directly from Tables<'orders'>['Row']
      voucher_discount: order.voucher_id ? 0 : null, // Assuming voucher_discount is derived or set to null initially
      shipping_address: order.shipping_address as
        | ShippingAddress
        | string
        | null, // Cast as it's Json
      order_items: order.order_items as UserOrder["order_items"], // Cast
    })) as UserOrder[];
  }, [ordersData]);
  const totalOrdersCount = ordersData?.count || 0;
  const totalPages = Math.ceil(totalOrdersCount / ordersPerPage);

  const handleViewDetails = (order: UserOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDownloadInvoice = (orderId: string) => {
    toast.info(`Downloading invoice for order ${orderId}...`);
  };

  const formatCurrency = (amount: number | null) => {
    return amount ? formatNaira(amount) : "₦0.00";
  };

  if (isLoadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No orders found.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            console.log("Order ID:", order.id, "Status:", order.status);
            return (
              <Card key={order.id} className="shadow-sm">
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Order ID: {order.id?.substring(0, 8)}
                  </CardTitle>
                  <Badge className={getStatusDetails(order.status).badgeColor}>
                    {order.status || "Unknown"}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-4">
                    {formatCurrency(order.total_amount)}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Ordered on:{" "}
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                  <Separator className="my-4" />
                  <div className="grid gap-2">
                    <div className="flex items-center text-sm">
                      <Package className="mr-2 h-4 w-4 text-gray-500" />
                      Items: {order.order_items?.length || 0}
                    </div>
                    <div className="flex items-center text-sm">
                      <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                      Payment: {order.payment_method || "N/A"} ({" "}
                      {order.payment_status || "N/A"})
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                      Shipping Address:{" "}
                      {formatShippingAddress(order.shipping_address)}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="mr-2 h-4 w-4" /> View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(order.id)}
                    >
                      <Download className="mr-2 h-4 w-4" /> Invoice
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <PaginationBar page={currentPage} totalPages={totalPages} />
            </div>
          )}
        </div>
      )}

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Order;
