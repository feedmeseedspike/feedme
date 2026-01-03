"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle, Loader2, ArrowRight, MapPin, Calendar, CreditCard } from "lucide-react";
import Container from "@components/shared/Container";
import { getPublicOrderDetails } from "src/lib/actions/order.actions";
import { formatNaira } from "src/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@components/ui/card";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialOrderId = searchParams.get("id") || searchParams.get("orderId") || "";
  
  const [orderId, setOrderId] = useState(initialOrderId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    if (initialOrderId) {
      handleTrack(initialOrderId);
    }
  }, [initialOrderId]);

  const handleTrack = async (id: string, updateUrl = false) => {
    if (!id.trim()) return;
    
    // Update URL if searched manually
    if (updateUrl || id !== initialOrderId) {
        router.push(`/track-order?id=${id}`, { scroll: false });
    }

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    // Simulate a slight delay for smoother UX (feels less jittery)
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      const result = await getPublicOrderDetails(id.trim());
      if (result.success && 'order' in result) {
        setOrderData(result.order);
      } else {
        setError('message' in result ? result.message : "We couldn't find an order with that ID. Please check and try again.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again later.");
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
    { label: "Order Placed", icon: Package, desc: "We received your order" },
    { label: "Confirmed", icon: Clock, desc: "We're preparing it" },
    { label: "In Transit", icon: Truck, desc: "It's on the way" },
    { label: "Delivered", icon: CheckCircle, desc: "Enjoy your items" },
  ];

  const currentStep = orderData ? getStatusStep(orderData.status) : 0;
  const isCancelled = currentStep === -1;

  // Custom Skeleton Component
  const TrackingSkeleton = () => (
    <div className="animate-pulse space-y-8 max-w-2xl mx-auto">
        {/* Status Card Skeleton */}
        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
             <div className="flex justify-between items-center mb-8">
                 <div className="h-6 w-32 bg-gray-100 rounded-full"></div>
                 <div className="h-4 w-24 bg-gray-100 rounded-full"></div>
             </div>
             <div className="flex justify-between relative mb-8">
                 {[1,2,3,4].map((i) => (
                     <div key={i} className="flex flex-col items-center gap-3 z-10">
                         <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                         <div className="h-3 w-16 bg-gray-100 rounded"></div>
                     </div>
                 ))}
                 <div className="absolute top-5 left-0 w-full h-0.5 bg-gray-100 -z-0"></div>
             </div>
        </div>
        
        {/* Details Card Skeleton */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex gap-4">
                 <div className="h-16 w-16 bg-gray-100 rounded-lg"></div>
                 <div className="flex-1 space-y-2 py-2">
                     <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
                     <div className="h-3 w-1/4 bg-gray-100 rounded"></div>
                 </div>
            </div>
            <div className="p-6 bg-gray-50 flex justify-between">
                 <div className="h-5 w-24 bg-gray-200 rounded"></div>
                 <div className="h-6 w-32 bg-gray-200 rounded"></div>
            </div>
        </div>
    </div>
  );

  return (
    <Container className="py-20 min-h-[80vh] relative overflow-hidden bg-gray-50/50">
        {/* Subtle Background Blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-green-200/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
          <div className="text-center mb-10 space-y-3">
            <span className="inline-block px-3 py-1 bg-green-100 text-[#1B6013] rounded-full text-xs font-semibold tracking-wider uppercase mb-2">Track & Trace</span>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 tracking-tight">Track Your Delivery</h1>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">Enter your Order ID (e.g. ORD-123456) to verify the status of your shipment in real-time.</p>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-xl shadow-green-900/5 max-w-xl mx-auto mb-16 border border-gray-100 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500/50">
            <div className="pl-4 text-gray-400">
                <Search size={22} strokeWidth={1.5} />
            </div>
            <Input 
                placeholder="Enter Your Order ID..." 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="border-none shadow-none focus-visible:ring-0 h-14 text-lg bg-transparent placeholder:text-gray-300 text-gray-900"
                onKeyDown={(e) => e.key === "Enter" && handleTrack(orderId, true)}
            />
            <Button 
                onClick={() => handleTrack(orderId, true)} 
                disabled={isLoading || !orderId}
                className="h-12 px-8 rounded-xl bg-[#1B6013] hover:bg-[#154d0f] text-white font-medium text-base shadow-lg shadow-green-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Track Order"}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            {isLoading && (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                >
                    <TrackingSkeleton />
                </motion.div>
            )}

            {!isLoading && error && (
                <motion.div
                    key="error"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-xl mx-auto"
                >
                    <div className="bg-white rounded-2xl p-8 border border-red-100 shadow-lg text-center">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Order Not Found</h3>
                        <p className="text-gray-500">{error}</p>
                    </div>
                </motion.div>
            )}

            {!isLoading && orderData && (
                <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="max-w-2xl mx-auto space-y-6"
                >
                    {/* Status Card */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden">
                        {isCancelled ? (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 text-red-600 rounded-full mb-4">
                                    <AlertCircle size={40} />
                                </div>
                                <h2 className="text-2xl font-bold text-red-600 mb-2">Order Cancelled</h2>
                                {orderData.updated_at ? (
                                    <p className="text-gray-500">This order was cancelled on {format(new Date(orderData.updated_at), "PPP")}.</p>
                                ) : (
                                    <p className="text-gray-500">This order has been cancelled.</p>
                                )}
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-400 font-medium tracking-wide uppercase mb-1">Current Status</div>
                                        <h2 className="text-3xl font-bold text-[#1B6013]">{orderData.status}</h2>
                                        {/* <p className="text-gray-500 mt-1">Updated {format(new Date(orderData.updated_at), "h:mm a")}</p> */}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm text-gray-400 font-medium mb-1">Estimated Delivery</div>
                                        <div className="text-gray-900 font-semibold flex items-center gap-2 justify-end">
                                            <Calendar size={16} className="text-gray-400" />
                                            soon...
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="relative">
                                    <div className="absolute top-5 left-0 w-full h-1 bg-gray-100 rounded-full -z-0">
                                        <motion.div 
                                            className="h-full bg-[#1B6013] rounded-full"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(0, Math.min(100, ((currentStep) / (steps.length - 1)) * 100))}%` }}
                                            transition={{ duration: 1, delay: 0.2 }}
                                        />
                                    </div>

                                    <div className="flex justify-between relative z-10 w-full">
                                        {steps.map((step, index) => {
                                            const Icon = step.icon;
                                            const isCompleted = index <= currentStep;
                                            const isCurrent = index === currentStep;
                                            
                                            return (
                                                <div key={index} className="flex flex-col items-center">
                                                    <motion.div 
                                                        className={`
                                                            w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-500 bg-white
                                                            ${isCompleted ? 'border-[#1B6013] text-[#1B6013]' : 'border-gray-100 text-gray-300'}
                                                            ${isCurrent ? 'ring-4 ring-green-50 shadow-lg scale-110' : ''}
                                                        `}
                                                        initial={{ scale: 0.8, opacity: 0 }}
                                                        animate={{ scale: isCurrent ? 1.1 : 1, opacity: 1 }}
                                                        transition={{ delay: index * 0.1 }}
                                                    >
                                                        <Icon size={18} strokeWidth={2.5} />
                                                    </motion.div>
                                                    <div className="mt-4 text-center">
                                                        <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${isCompleted ? 'text-gray-900' : 'text-gray-300'}`}>
                                                            {step.label}
                                                        </div>
                                                        <div className="hidden md:block text-[10px] text-gray-400 max-w-[80px] leading-tight">
                                                            {step.desc}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Order Details */}
                    <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-50 pb-6 px-8 pt-8">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-gray-900 text-lg">Order Details</CardTitle>
                                    <CardDescription>Reference: <span className="font-mono text-[#1B6013] font-medium">{orderData.reference || orderData.id}</span></CardDescription>
                                </div>
                                <div className="text-right hidden sm:block">
                                   <div className="text-sm text-gray-500">Placed on</div>
                                   <div className="font-medium text-gray-900">{format(new Date(orderData.created_at), "PPP")}</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="px-8 py-6 space-y-6">
                                {/* Items List */}
                                <div className="space-y-4">
                                    {orderData.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex gap-4 items-start">
                                            <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden shadow-inner border border-gray-100 flex-shrink-0">
                                                {item.products?.images?.[0] ? (
                                                    <img src={item.products.images[0]} alt={item.products.name} className="w-full h-full object-cover"/>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <Package size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-gray-900 truncate">{item.products?.name || item.bundles?.name || "Product Item"}</h4>
                                                <p className="text-sm text-gray-500 mt-0.5">Quantity: {item.quantity}</p>
                                                {item.option && (
                                                    <p className="text-xs text-[#1B6013] mt-1 bg-green-50 inline-block px-2 py-0.5 rounded-full">
                                                        {item.option.name}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="font-semibold text-gray-900">
                                                {formatNaira(item.price * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Address Section */}
                                {(typeof orderData.shipping_address === "string" || orderData.shipping_address?.street) && (
                                    <div className="bg-blue-50/50 rounded-xl p-4 flex gap-3 items-start border border-blue-50 mt-6">
                                        <MapPin className="text-blue-500 mt-1 flex-shrink-0" size={18} />
                                        <div>
                                            <h4 className="font-semibold text-sm text-blue-900 mb-1">Delivery Destination</h4>
                                            <p className="text-sm text-blue-700/80 leading-relaxed">
                                                {typeof orderData.shipping_address === 'string' 
                                                    ? JSON.parse(orderData.shipping_address).street 
                                                    : orderData.shipping_address.street}, {
                                                 typeof orderData.shipping_address === 'string'
                                                    ? JSON.parse(orderData.shipping_address).city
                                                    : orderData.shipping_address.city}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Total Footer */}
                            <div className="bg-gray-50 px-8 py-6 flex justify-between items-center border-t border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500">
                                    <CreditCard size={18} />
                                    <span className="text-sm font-medium">Total Paid</span>
                                </div>
                                <span className="font-bold text-2xl text-[#1B6013]">{formatNaira(orderData.total_amount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="text-center pt-8">
                        <Button variant="link" className="text-gray-400 hover:text-[#1B6013]" onClick={() => router.push('/')}>
                            Back to Home
                        </Button>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
      </div>
    </Container>
  );
}
