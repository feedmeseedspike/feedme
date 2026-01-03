"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { Package, User, MapPin, CreditCard, X } from "lucide-react";
import { formatNaira } from "src/lib/utils";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useTransition } from "react";
import { updateOrderStatusAction, updatePaymentStatusAction } from "./actions";
import { useToast } from "src/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    loading?: boolean;
    user_id?: string | null;
    status?: string | null;
    total_amount?: number | null;
    shipping_address?: any | null;
    payment_method?: string | null;
    payment_status?: string | null;
    created_at?: string;
    updated_at?: string | null;
    delivery_fee?: number | null;
    service_charge?: number | null;
    subtotal?: number | null;
    voucher_discount?: number | null;
    reference?: string | null;
    profiles?: {
      id: string;
      display_name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    order_items?: Array<{
      id: string;
      product_id: string | null;
      bundle_id: string | null;
      quantity: number;
      price: number;
      option: any;
      products: {
        id: string;
        name: string;
        images: string[] | null;
        options: any;
      } | null;
      bundles: {
        id: string;
        name: string;
        image: string | null;
      } | null;
    }>;
  } | null;
}

const ORDER_STATUSES = ["order confirmed", "In transit", "order delivered", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Paid", "Cancelled"];

export default function OrderDetailModal({ isOpen, onClose, order }: OrderDetailModalProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [updatingField, setUpdatingField] = useState<string | null>(null);

  if (!order) return null;

  // Show loading state
  if (order.loading === true) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div>
                <span className="text-xl">Loading Order...</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Loading skeleton */}
              <div className="lg:col-span-2">
                <div className="animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-3 p-3 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Loading skeleton for right column */}
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const handleStatusUpdate = (newStatus: string) => {
    setUpdatingField("status");
    startTransition(async () => {
      try {
        await updateOrderStatusAction(order.id, newStatus as any);
        showToast("Order status updated successfully", "success");
      } catch (error) {
        showToast("Failed to update order status", "error");
      } finally {
        setUpdatingField(null);
      }
    });
  };

  const handlePaymentStatusUpdate = (newStatus: string) => {
    setUpdatingField("payment_status");
    startTransition(async () => {
      try {
        await updatePaymentStatusAction(order.id, newStatus as any);
        showToast("Payment status updated successfully", "success");
      } catch (error) {
        showToast("Failed to update payment status", "error");
      } finally {
        setUpdatingField(null);
      }
    });
  };

  const renderCustomizations = (option: any) => {
    if (!option || !option.customizations) return null;

    return (
      <div className="mt-2 text-sm text-gray-600">
        <div className="font-medium text-gray-700 mb-1">Customizations:</div>
        {Object.entries(option.customizations).map(([key, value]) => (
          <div key={key} className="ml-2">
            • {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {String(value).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </div>
        ))}
      </div>
    );
  };

  const renderVariation = (option: any) => {
    if (!option || !option.name) return null;

    return (
      <div className="mt-1 text-sm text-gray-600">
        <span className="font-medium">Variation:</span> {option.name}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div>
              <span className="text-xl" title={`Internal ID: ${order.id}`}>
                {order.reference ? order.reference : `Order #${order.id.substring(0, 8)}...`}
              </span>
              <p className="text-sm font-normal text-gray-600 mt-1">
                {order.created_at && format(new Date(order.created_at), "PPpp")}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
            {/* Order Items */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package size={18} />
                    Order Items ({order.order_items?.length || 0})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(order.order_items || []).map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                        <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                          {item.products?.images?.[0] ? (
                            <img 
                              src={item.products.images[0]} 
                              alt={item.products.name || item.bundles?.name || "Item"}
                              className="w-full h-full object-cover"
                            />
                          ) : item.bundles?.image ? (
                            <img 
                              src={item.bundles.image} 
                              alt={item.bundles.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.products?.name || item.bundles?.name || "Unknown Item"}
                          </h4>
                          <div className="text-xs text-gray-600 mt-1">
                            Quantity: {item.quantity} × {formatNaira(item.price)}
                          </div>
                          {renderVariation(item.option)}
                          {renderCustomizations(item.option)}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatNaira(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary & Details */}
            <div className="space-y-4">
              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User size={16} />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {order.profiles?.display_name
                          ? order.profiles.display_name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{order.profiles?.display_name || (order.shipping_address && (order.shipping_address as any).fullName) || "Unknown User"}</p>
                      <p className="text-xs text-gray-600">{order.profiles?.email || (order.shipping_address && (order.shipping_address as any).email) || ""}</p>
                    </div>
                  </div>
                  {(order.profiles?.phone || (order.shipping_address && (order.shipping_address as any).phone)) && (
                    <div className="text-xs">
                      <span className="font-medium">Phone:</span> {order.profiles?.phone || (order.shipping_address as any).phone}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin size={16} />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs">
                    {order.shipping_address && typeof order.shipping_address === "object" ? (
                      <div>
                        {order.shipping_address.street && (
                          <p>{order.shipping_address.street}</p>
                        )}
                        {order.shipping_address.city && (
                          <p>{order.shipping_address.city}</p>
                        )}
                        {order.shipping_address.local_government && (
                          <p>{order.shipping_address.local_government}</p>
                        )}
                        {order.shipping_address.state && (
                          <p>{order.shipping_address.state}</p>
                        )}
                        {order.shipping_address.country && (
                          <p>{order.shipping_address.country}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No address provided</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Order Status
                    </label>
                    <Select
                      value={order.status || ORDER_STATUSES[0]}
                      onValueChange={handleStatusUpdate}
                      disabled={updatingField === "status"}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Payment Status
                    </label>
                    <Select
                      value={order.payment_status || PAYMENT_STATUSES[0]}
                      onValueChange={handlePaymentStatusUpdate}
                      disabled={updatingField === "payment_status"}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUSES.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard size={16} />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-medium">{order.payment_method || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-medium">{order.reference || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatNaira(order.subtotal || 0)}</span>
                    </div>
                    {order.delivery_fee && (
                      <div className="flex justify-between">
                        <span>Delivery Fee:</span>
                        <span>{formatNaira(order.delivery_fee)}</span>
                      </div>
                    )}
                    {order.service_charge && (
                      <div className="flex justify-between">
                        <span>Service Charge:</span>
                        <span>{formatNaira(order.service_charge)}</span>
                      </div>
                    )}
                    {order.voucher_discount && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-{formatNaira(order.voucher_discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-sm pt-2 border-t">
                      <span>Total:</span>
                      <span>{formatNaira(order.total_amount || 0)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}