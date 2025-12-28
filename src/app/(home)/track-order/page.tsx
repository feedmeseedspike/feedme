"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import Container from "@components/shared/Container";
import { getPublicOrderDetails } from "src/lib/actions/order.actions";
import { formatNaira } from "src/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { format } from "date-fns";

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderId = searchParams.get("orderId") || "";
  
  const [orderId, setOrderId] = useState(initialOrderId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (initialOrderId) {
      handleTrack(initialOrderId);
    }
  }, [initialOrderId]);

  const handleTrack = async (id: string) => {
    if (!id.trim()) return;
    
    // Update URL if searched manually
    if (id !== searchParams.get("orderId")) {
        router.push(`/track-order?orderId=${id}`, { scroll: false });
    }

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const result = await getPublicOrderDetails(id.trim());
      if (result.success && 'order' in result) {
        setOrderData(result.order);
      } else {
        setError('message' in result ? result.message : "Order not found");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    switch (status?.toLowerCase()) {
      case "cancelled": return -1;
      case "pending": // fallthrough
      case "order confirmed": return 1;
      case "in transit": return 2;
      case "order delivered": return 3;
      default: return 0;
    }
  };

  const steps = [
    { label: "Order Placed", icon: Package },
    { label: "Processing", icon: Clock },
    { label: "In Transit", icon: Truck },
    { label: "Delivered", icon: CheckCircle },
  ];

  const currentStep = orderData ? getStatusStep(orderData.status) : 0;
  const isCancelled = currentStep === -1;

  return (
    <Container className="py-20 max-w-3xl min-h-[60vh]">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4 font-heading text-[#1B6013]">Track Your Order</h1>
        <p className="text-gray-600">Enter your Order ID to see the current status of your delivery.</p>
      </div>

      <div className="flex gap-4 mb-12 max-w-xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="e.g. ORD-A1B2C" 
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="pl-10 h-12 text-lg"
            onKeyDown={(e) => e.key === "Enter" && handleTrack(orderId)}
          />
        </div>
        <Button 
          onClick={() => handleTrack(orderId)} 
          disabled={isLoading || !orderId}
          className="h-12 px-8 bg-[#1B6013] hover:bg-[#1B6013]/90 text-lg"
        >
          {isLoading ? "Searching..." : "Track"}
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center mb-8 border border-red-100 flex items-center justify-center gap-2">
           <AlertCircle size={18} />
           {error}
        </div>
      )}

      {orderData && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Status Timeline */}
          <div className="mb-12 relative">
             {isCancelled ? (
                 <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                     <div className="text-red-600 text-xl font-bold mb-2">Order Cancelled</div>
                     <p className="text-gray-600">This order has been cancelled. Please contact support if this is a mistake.</p>
                 </div>
             ) : (
                <div className="flex justify-between items-start relative z-10">
                    {/* Connecting Line */}
                    <div className="absolute top-[22px] left-0 w-full h-1 bg-gray-100 -z-10 rounded-full">
                        <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${Math.max(0, Math.min(100, ((currentStep) / (steps.length - 1)) * 100))}%` }}
                        ></div>
                    </div>

                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        
                        return (
                            <div key={index} className="flex flex-col items-center">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 bg-white
                                    ${isCompleted ? 'border-green-500 text-green-600' : 'border-gray-100 text-gray-300'}
                                    ${isCurrent ? 'scale-110 shadow-lg ring-4 ring-green-100' : ''}
                                `}>
                                    <Icon size={isCurrent ? 24 : 20} strokeWidth={isCompleted ? 2.5 : 2} />
                                </div>
                                <div className={`mt-3 text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {step.label}
                                </div>
                            </div>
                        );
                    })}
                </div>
             )}
          </div>

          {/* Order Details Card */}
          <Card className="border-gray-100 shadow-lg overflow-hidden">
            <CardHeader className="bg-gray-50 border-b border-gray-100 pb-6">
               <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Order ID</p>
                    <CardTitle className="text-xl font-mono text-gray-800">{orderData.id}</CardTitle>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-500 mb-1">Placed On</p>
                    <div className="font-medium">
                        {orderData.created_at ? format(new Date(orderData.created_at), "PPP p") : "N/A"}
                    </div>
                  </div>
               </div>
            </CardHeader>
            <CardContent className="p-0">
               <div className="p-6">
                 <h3 className="font-semibold mb-4 text-gray-900">Items in Order</h3>
                 <div className="space-y-4">
                    {orderData.order_items?.map((item: any) => (
                        <div key={item.id} className="flex gap-4 py-3 border-b last:border-0 border-gray-50">
                            <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {item.products?.images?.[0] ? (
                                    <img src={item.products.images[0]} alt={item.products.name} className="w-full h-full object-cover"/>
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <Package size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 line-clamp-1">{item.products?.name || item.bundles?.name || "Item"}</div>
                                <div className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</div>
                            </div>
                            <div className="font-semibold text-gray-900">
                                {formatNaira(item.price * item.quantity)}
                            </div>
                        </div>
                    ))}
                 </div>
               </div>
               
               <div className="bg-green-50/50 p-6 flex justify-between items-center border-t border-green-100">
                  <span className="font-bold text-lg text-gray-900">Total Amount</span>
                  <span className="font-bold text-xl text-[#1B6013]">{formatNaira(orderData.total_amount)}</span>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Container>
  );
}
