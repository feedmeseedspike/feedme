"use client";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import Image from "next/image";
import React, { useState, useMemo } from "react";
import { products } from "src/lib/data";
import {
  Package,
  Search,
  Filter,
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
  User,
  Phone,
  Mail,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

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
    status: "Delivered",
    date: "2023-10-15",
    totalAmount: 15750,
    estimatedDelivery: "2023-10-16",
    actualDelivery: "2023-10-16",
    trackingNumber: "TRK123456789",
    shippingAddress: {
      name: "John Doe",
      phone: "+234 801 234 5678",
      email: "john.doe@email.com",
      address: "123 Lagos Street, Victoria Island",
      city: "Lagos",
      state: "Lagos State",
      zipCode: "101001",
    },
    orderTimeline: [
      { status: "Order Placed", date: "2023-10-15 10:30 AM", completed: true },
      {
        status: "Payment Confirmed",
        date: "2023-10-15 10:35 AM",
        completed: true,
      },
      {
        status: "Order Processing",
        date: "2023-10-15 02:15 PM",
        completed: true,
      },
      { status: "Shipped", date: "2023-10-15 06:45 PM", completed: true },
      {
        status: "Out for Delivery",
        date: "2023-10-16 08:00 AM",
        completed: true,
      },
      { status: "Delivered", date: "2023-10-16 02:30 PM", completed: true },
    ],
    products: products.slice(5, 8).map((product) => ({
      ...product,
      quantity: Math.floor(Math.random() * 3) + 1,
      unitPrice: product.price,
    })),
  },
  {
    orderId: "#123457",
    paymentMethod: "PayPal",
    status: "Shipped",
    date: "2023-10-12",
    totalAmount: 8900,
    estimatedDelivery: "2023-10-14",
    trackingNumber: "TRK987654321",
    shippingAddress: {
      name: "Jane Smith",
      phone: "+234 802 345 6789",
      email: "jane.smith@email.com",
      address: "456 Abuja Avenue, Garki",
      city: "Abuja",
      state: "FCT",
      zipCode: "900001",
    },
    orderTimeline: [
      { status: "Order Placed", date: "2023-10-12 09:15 AM", completed: true },
      {
        status: "Payment Confirmed",
        date: "2023-10-12 09:20 AM",
        completed: true,
      },
      {
        status: "Order Processing",
        date: "2023-10-12 01:30 PM",
        completed: true,
      },
      { status: "Shipped", date: "2023-10-13 11:00 AM", completed: true },
      {
        status: "Out for Delivery",
        date: "2023-10-14 07:30 AM",
        completed: false,
      },
      { status: "Delivered", date: "Pending", completed: false },
    ],
    products: products.slice(2, 5).map((product) => ({
      ...product,
      quantity: Math.floor(Math.random() * 3) + 1,
      unitPrice: product.price,
    })),
  },
  {
    orderId: "#123458",
    paymentMethod: "Credit Card",
    status: "Pending",
    date: "2023-10-10",
    totalAmount: 12300,
    estimatedDelivery: "2023-10-13",
    trackingNumber: "TRK456789123",
    shippingAddress: {
      name: "Mike Johnson",
      phone: "+234 803 456 7890",
      email: "mike.johnson@email.com",
      address: "789 Port Harcourt Road, GRA",
      city: "Port Harcourt",
      state: "Rivers State",
      zipCode: "500001",
    },
    orderTimeline: [
      { status: "Order Placed", date: "2023-10-10 03:45 PM", completed: true },
      {
        status: "Payment Confirmed",
        date: "2023-10-10 03:50 PM",
        completed: true,
      },
      { status: "Order Processing", date: "Pending", completed: false },
      { status: "Shipped", date: "Pending", completed: false },
      { status: "Out for Delivery", date: "Pending", completed: false },
      { status: "Delivered", date: "Pending", completed: false },
    ],
    products: products.slice(0, 3).map((product) => ({
      ...product,
      quantity: Math.floor(Math.random() * 3) + 1,
      unitPrice: product.price,
    })),
  },
  {
    orderId: "#123459",
    paymentMethod: "PayPal",
    status: "Canceled",
    date: "2023-10-08",
    totalAmount: 6750,
    estimatedDelivery: "N/A",
    trackingNumber: "N/A",
    shippingAddress: {
      name: "Sarah Wilson",
      phone: "+234 804 567 8901",
      email: "sarah.wilson@email.com",
      address: "321 Kano Street, Sabon Gari",
      city: "Kano",
      state: "Kano State",
      zipCode: "700001",
    },
    orderTimeline: [
      { status: "Order Placed", date: "2023-10-08 11:20 AM", completed: true },
      {
        status: "Payment Confirmed",
        date: "2023-10-08 11:25 AM",
        completed: true,
      },
      {
        status: "Order Canceled",
        date: "2023-10-08 02:15 PM",
        completed: true,
      },
    ],
    products: products.slice(3, 6).map((product) => ({
      ...product,
      quantity: Math.floor(Math.random() * 3) + 1,
      unitPrice: product.price,
    })),
  },
];

const getStatusDetails = (status: string) => {
  const statusConfig = {
    Delivered: {
      badgeColor: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
      message: "Order delivered successfully",
      dateLabel: "Delivered On",
    },
    Shipped: {
      badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
      icon: Truck,
      message: "Order is on the way",
      dateLabel: "Shipped On",
    },
    Pending: {
      badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Clock,
      message: "Order is being processed",
      dateLabel: "Order Date",
    },
    Canceled: {
      badgeColor: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
      message: "Order was canceled",
      dateLabel: "Canceled On",
    },
  };

  return (
    statusConfig[status as keyof typeof statusConfig] || {
      badgeColor: "bg-gray-100 text-gray-800 border-gray-200",
      icon: AlertCircle,
      message: "Unknown status",
      dateLabel: "Date",
    }
  );
};

// Order Details Modal Component
const OrderDetailsModal = ({
  order,
  isOpen,
  onClose,
}: {
  order: (typeof orders)[0];
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { badgeColor, icon: StatusIcon } = getStatusDetails(order.status);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const calculateSubtotal = () => {
    return order.products.reduce(
      (sum, product) => sum + product.unitPrice * product.quantity,
      0
    );
  };

  const shippingFee = 1500;
  const tax = calculateSubtotal() * 0.075; // 7.5% VAT

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Package className="w-6 h-6 text-[#1B6013]" />
            Order Details - {order.orderId}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Order Status Header */}
          <Card className="border-l-4 border-l-[#1B6013]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusIcon className="w-6 h-6 text-[#1B6013]" />
                  <div>
                    <Badge className={`${badgeColor} text-sm`}>
                      {order.status}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-1">
                      Order placed on {order.date}
                    </p>
                  </div>
                </div>
                {order.trackingNumber !== "N/A" && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {order.trackingNumber}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            order.trackingNumber,
                            "Tracking number"
                          )
                        }
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="w-5 h-5 text-[#1B6013]" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {order.shippingAddress.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{order.shippingAddress.phone}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        order.shippingAddress.phone,
                        "Phone number"
                      )
                    }
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{order.shippingAddress.email}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <p>{order.shippingAddress.address}</p>
                    <p>
                      {order.shippingAddress.city},{" "}
                      {order.shippingAddress.state}
                    </p>
                    <p>{order.shippingAddress.zipCode}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CreditCard className="w-5 h-5 text-[#1B6013]" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {order.orderId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(order.orderId, "Order ID")}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-bold text-[#1B6013] text-lg">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
                {order.estimatedDelivery !== "N/A" && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Delivery</span>
                    <span className="font-medium">
                      {order.estimatedDelivery}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-[#1B6013]" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.orderTimeline.map((timeline, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        timeline.completed
                          ? "bg-[#1B6013] border-[#1B6013]"
                          : "bg-gray-200 border-gray-300"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span
                          className={`font-medium ${
                            timeline.completed
                              ? "text-gray-800"
                              : "text-gray-500"
                          }`}
                        >
                          {timeline.status}
                        </span>
                        <span
                          className={`text-sm ${
                            timeline.completed
                              ? "text-gray-600"
                              : "text-gray-400"
                          }`}
                        >
                          {timeline.date}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="w-5 h-5 text-[#1B6013]" />
                Order Items ({order.products.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.products.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 border rounded-lg"
                  >
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                      <Image
                        src={product.images?.[0] || "/placeholder-product.jpg"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">
                        {product.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Quantity: {product.quantity} ×{" "}
                        {formatCurrency(product.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(product.unitPrice * product.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>{formatCurrency(shippingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (7.5%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-[#1B6013]">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1 bg-[#1B6013] hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Download Invoice
            </Button>
            {order.status === "Shipped" && (
              <Button variant="outline" className="flex-1">
                <ExternalLink className="w-4 h-4 mr-2" />
                Track Package
              </Button>
            )}
            {order.status === "Delivered" && (
              <Button variant="outline" className="flex-1">
                <Package className="w-4 h-4 mr-2" />
                Reorder Items
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Order = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<(typeof orders)[0] | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = orders.filter((order) => {
      const matchesSearch =
        order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        order.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });

    return filtered;
  }, [searchTerm, statusFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const handleViewDetails = (order: (typeof orders)[0]) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleDownloadInvoice = (orderId: string) => {
    toast.success(`Invoice for ${orderId} will be downloaded shortly`);
    // Implement actual download logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="border-0 shadow-lg bg-[#1B6013]">
          <CardContent className="p-6">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Package className="w-8 h-8" />
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">My Orders</h1>
                  <p className="text-white/90">Track and manage your orders</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {filteredAndSortedOrders.length}
                </div>
                <div className="text-white/90 text-sm">Total Orders</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders by ID or payment method..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1B6013] focus:ring-[#1B6013]/20"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="canceled">Canceled</option>
                  </select>
                </div>

                <ProductSortSelector
                  sortOrders={orderSortOptions}
                  sort="date-newest"
                  params={{ sort: "date-newest" }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredAndSortedOrders.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No Orders Found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedOrders.map((order) => {
              const {
                badgeColor,
                icon: StatusIcon,
                message,
                dateLabel,
              } = getStatusDetails(order.status);

              return (
                <Card
                  key={order.orderId}
                  className="border-0 shadow-lg hover:shadow-xl transition-shadow"
                >
                  {/* Order Header */}
                  <div className="bg-[#1B6013] text-white p-6 rounded-t-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm font-medium">
                          Order ID
                        </p>
                        <p className="font-semibold text-lg">{order.orderId}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm font-medium flex items-center gap-1">
                          <CreditCard className="w-4 h-4" />
                          Payment Method
                        </p>
                        <p className="font-semibold">{order.paymentMethod}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm font-medium flex items-center gap-1">
                          <StatusIcon className="w-4 h-4" />
                          Status
                        </p>
                        <Badge className={`${badgeColor} font-semibold`}>
                          {order.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-white/70 text-sm font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {dateLabel}
                        </p>
                        <p className="font-semibold">{order.date}</p>
                      </div>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Products */}
                      <div className="lg:col-span-2 space-y-4">
                        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                          <Package className="w-5 h-5 text-[#1B6013]" />
                          Order Items ({order.products.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {order.products.map((product, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                                <Image
                                  src={
                                    product.images?.[0] ||
                                    "/placeholder-product.jpg"
                                  }
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-800 truncate">
                                  {product.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {formatCurrency(product.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Summary & Actions */}
                      <div className="lg:col-span-1 space-y-4">
                        <h3 className="font-semibold text-gray-800">
                          Order Summary
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Total Amount</span>
                            <span className="font-bold text-lg text-[#1B6013]">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>

                          {order.status !== "Canceled" && (
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 flex items-center gap-1">
                                <Truck className="w-4 h-4" />
                                Est. Delivery
                              </span>
                              <span className="font-medium">
                                {order.estimatedDelivery}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-sm">
                            <StatusIcon className="w-4 h-4 text-[#1B6013]" />
                            <span className="text-gray-600">{message}</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          {order.status === "Delivered" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                handleDownloadInvoice(order.orderId)
                              }
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Order Statistics */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1B6013]" />
              Order Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Delivered", "Shipped", "Pending", "Canceled"].map((status) => {
                const count = orders.filter(
                  (order) => order.status === status
                ).length;
                const { icon: StatusIcon } = getStatusDetails(status);

                return (
                  <div
                    key={status}
                    className="text-center p-4 bg-gray-50 rounded-lg"
                  >
                    <StatusIcon className="w-8 h-8 mx-auto mb-2 text-[#1B6013]" />
                    <div className="text-2xl font-bold text-gray-800">
                      {count}
                    </div>
                    <div className="text-sm text-gray-600">{status}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedOrder(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Order;
