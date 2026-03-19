"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Playfair_Display, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { showToast, formatNaira } from "src/lib/utils";
import { Gift, MapPin, Phone, User, Loader2, Sparkles, Navigation, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "src/utils/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import lagosAreas from "@/lib/lagos-areas.json";

const playfair = Playfair_Display({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

export default function GiftClaimPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("o");
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    street: "",
    location: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("Invalid gift link.");
      setIsLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (data.error) throw new Error(data.error);
        if (!data.shipping_address?.isGiftLink && data.shipping_address?.street !== "Pending Gift Claim") {
            // Already claimed or not a gift!
            setIsClaimed(true);
            setOrder(data);
            setIsLoading(false);
            return;
        }

        setOrder(data);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Could not load the gift.");
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.street || !formData.location) {
        showToast("Please fill all fields.", "error");
        return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/claim-gift`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to claim gift");

      showToast("Gift claimed successfully! Your food is on the way.", "success");
      setIsClaimed(true);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const senderName = order?.shipping_address?.senderName || order?.profiles?.display_name || "Someone special";
  const giftMessage = order?.shipping_address?.giftMessage || "Enjoy your meal!";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center text-[#1B6013]">
         <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] flex flex-col items-center justify-center p-8 text-center">
        <h1 className={`${playfair.className} text-3xl mb-4 text-red-800`}>Oops!</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Button onClick={() => router.push("/")} className="rounded-xl bg-[#1B6013]">Go Home</Button>
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-[#FAFAF9] ${inter.className} py-12 md:py-20 px-6 relative overflow-hidden`}>
       {/* Background */}
       <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#A3E635]/10 rounded-full blur-[100px] pointer-events-none" />
       
       <div className="max-w-xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
             <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
                <Gift className="w-10 h-10 text-[#1B6013]" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-1 -right-1"
                >
                   <Sparkles className="w-6 h-6 text-[#FF9900]" />
                </motion.div>
             </div>
             <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-3 leading-tight`}>
               {isClaimed ? "Gift Claimed!" : "You&apos;ve received a Gift!"}
             </h1>
             {!isClaimed && (
               <p className="text-lg text-gray-600">
                 <strong className="text-gray-900">{senderName}</strong> sent you a delicious meal.
               </p>
             )}
          </div>

          {!isClaimed ? (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100 relative overflow-hidden"
             >
                {/* Gift Note Banner */}
                {giftMessage && (
                   <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-xl mb-10">
                      <p className="text-sm font-bold text-yellow-800 uppercase tracking-widest mb-1 shadow-sm">Note from sender</p>
                      <p className="text-gray-800 italic font-medium leading-relaxed">&quot;{giftMessage}&quot;</p>
                   </div>
                )}

                <form onSubmit={handleClaim} className="space-y-6">
                   <div className="mb-6">
                      <h3 className="font-bold text-gray-900 text-xl border-b pb-2">Where should we deliver?</h3>
                   </div>

                   <div className="space-y-1">
                       <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-200 focus-visible:ring-[#1B6013]" placeholder="John Doe" />
                       </div>
                   </div>

                   <div className="space-y-1">
                       <Label className="text-sm font-semibold text-gray-700">Phone Number</Label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-200 focus-visible:ring-[#1B6013]" placeholder="080..." />
                       </div>
                   </div>

                   <div className="space-y-1">
                       <Label className="text-sm font-semibold text-gray-700">Area</Label>
                       <Select value={formData.location} onValueChange={val => setFormData({...formData, location: val})}>
                          <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-gray-200 focus:ring-[#1B6013]">
                             <SelectValue placeholder="Select delivery area" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                             {lagosAreas.map((area: any) => (
                                <SelectItem key={area.name} value={area.name}>{area.name}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                   </div>

                   <div className="space-y-1">
                       <Label className="text-sm font-semibold text-gray-700">Detailed Address (Street, House No, etc.)</Label>
                       <div className="relative">
                          <Navigation className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
                          <textarea 
                             required 
                             value={formData.street} 
                             onChange={e => setFormData({...formData, street: e.target.value})} 
                             className="w-full pl-12 p-4 min-h-[100px] rounded-2xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B6013] resize-none" 
                             placeholder="E.g., 12A Awolowo Road, Ikoyi" 
                          />
                       </div>
                   </div>

                   <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-[#1B6013] hover:bg-[#154d0f] text-white font-bold text-lg mt-8 shadow-lg shadow-[#1B6013]/20">
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Claim & Deliver Here"}
                   </Button>
                   <p className="text-center text-xs text-gray-500 mt-4">
                      Delivery fee has been pre-paid by the sender.
                   </p>
                </form>
             </motion.div>
          ) : (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-3xl shadow-xl p-10 text-center border border-[#1B6013]/20"
             >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-[#1B6013]">
                   <Check className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">You&apos;re all set!</h2>
                <p className="text-gray-600 mb-8 max-w-sm mx-auto">
                   Your delivery details have been recorded. The food will be prepared and delivered to you shortly.
                </p>
                
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4 text-left border border-gray-100 mb-8">
                   <h4 className="font-bold text-gray-900 border-b pb-2 mb-2">Delivery Details</h4>
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Receiver</p>
                      <p className="font-medium">{order?.shipping_address?.fullName || "You"}</p>
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Address</p>
                      <p className="font-medium">{order?.shipping_address?.street}, {order?.shipping_address?.location}</p>
                   </div>
                </div>

                <Button onClick={() => router.push("/")} className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold">
                   Explore FeedMe
                </Button>
             </motion.div>
          )}
       </div>
    </main>
  );
}
