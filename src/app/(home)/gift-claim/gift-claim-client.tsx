"use client";

import React, { useEffect, useState } from "react";
import { Playfair_Display, Inter } from "next/font/google";
import { motion } from "framer-motion";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { showToast } from "src/lib/utils";
import { MapPin, Phone, User, Loader2, Navigation, Check, Users, Gift, Search, ChevronDown, MailOpen } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@components/ui/popover";
import { claimGiftAction, getClaimLocations } from "./actions";
import { Checkbox } from "@components/ui/checkbox";
import { cn } from "src/lib/utils";

const playfair = Playfair_Display({ subsets: ["latin"] });
const inter = Inter({ subsets: ["latin"] });

export default function GiftClaimClient({ orderId }: { orderId?: string }) {
  const [isLoading, setIsLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [isClaimed, setIsClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    location: "",
    saveAsBeneficiary: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isLocationPopoverOpen, setIsLocationPopoverOpen] = useState(false);

  useEffect(() => {
    async function init() {
      if (!orderId) {
        setError("Invalid gift link.");
        setIsLoading(false);
        return;
      }

      try {
        const [orderRes, locationsRes] = await Promise.all([
          fetch(`/api/orders/${orderId}`).then(r => r.json()),
          getClaimLocations()
        ]);

        if (orderRes.error) throw new Error(orderRes.error);
        
        const shippingAddress = orderRes.shipping_address as any;
        if (!shippingAddress?.isGiftLink) {
           setIsClaimed(true);
        }

        setOrder(orderRes);
        setLocations(locationsRes);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "Could not load the gift.");
        setIsLoading(false);
      }
    }
    init();
  }, [orderId]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    if (!formData.fullName || !formData.phone || !formData.street || !formData.location) {
        showToast("Please fill all fields.", "error");
        return;
    }

    setIsSubmitting(true);
    try {
      const res = await claimGiftAction(orderId, formData);
      if (res.success) {
        setShowConfetti(true);
        setIsClaimed(true);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const senderName = order?.shipping_address?.senderName || order?.profiles?.display_name || "Someone special";
  const giftMessage = order?.shipping_address?.giftMessage;

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
        <Button onClick={() => window.location.href = "/"} className="rounded-xl bg-[#1B6013]">Go Home</Button>
      </div>
    );
  }

  return (
    <main className={`min-h-screen bg-[#FAFAF9] ${inter.className} py-12 md:py-20 px-6 relative overflow-hidden`}>
        {/* Background */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#A3E635]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#1B6013]/5 rounded-full blur-[100px] pointer-events-none" />

        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 40 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), opacity: 1, rotate: 0 }}
                animate={{ y: typeof window !== 'undefined' ? window.innerHeight + 100 : 1000, rotate: Math.random() * 360, opacity: 0 }}
                transition={{ duration: Math.random() * 3 + 4, delay: Math.random() * 0.5, ease: "easeOut" }}
                className="absolute"
              >
                <div className={`w-2 h-2 rounded-full ${i % 2 === 0 ? 'bg-[#1B6013]' : 'bg-[#FF9900]'}`} />
              </motion.div>
            ))}
          </div>
        )}
       
       <div className="max-w-xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-10">
             <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl relative border border-green-50 rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 64 64">
                    <path fill="#076170" d="M31.9 30.3V62S45 52.8 54.2 50.1c0 0 .4-19.6 6.1-29.4z" />
                    <path fill="#b3690e" d="M40.1 57.2s.5-28.1 1.5-29.5c1-1.5 9.6-3 9.6-3s-3.5 26.3-2.7 28c.1-.1-3.5 1.4-8.4 4.5" />
                    <path fill="#3baacf" d="M31.9 62s-9.2-7.8-23.5-11.9c0 0 1.1-16.1-4.1-28.4l27.6 8.6z" />
                    <path fill="#e9c243" d="M14.2 52.7s8.4 3.4 9 4.5s.6-28.3.6-28.3s-11.5-3.2-12.5-3.2c0 0 3.5 11.9 2.9 27" />
                    <path d="M31.9 30.3v5.3l25.7-8.8c.7-2.2 1.6-4.3 2.6-6.1zM6.1 27.2c-.5-1.9-1.1-3.7-1.9-5.5l27.6 8.6v5.3z" opacity="0.3" />
                    <path fill="#4fc7e8" d="m2 18.9l28.5 6.3L62 17.6l-30.9-1.7z" />
                    <path fill="#3baacf" d="m2 18.9l2.3 6.3l26.2 7.4v-7.4z" />
                    <path fill="#076170" d="M30.5 32.6s23.8-8.8 29.7-9.2c0 0 .4-3.5 1.8-5.7l-31.5 7.5z" />
                    <g fill="#f0ae11">
                        <path d="m10.5 20.8l5.8 5.5l6.4-2.9l9.3-2.8L43.6 22l6.1 1.2l4.9-3.8z" />
                        <path d="m22.7 23.4l9.3-2.8L43.6 22l11-2.6l-23.2-2.2l-20.9 3.6z" />
                    </g>
                    <path fill="#f8d048" d="M10.5 20.8v7L22.2 31l.5-7.6z" />
                    <path fill="#c47116" d="m43.6 22l.2 6.7l10-3l.8-6.3z" />
                    <path fill="#ea9f07" d="M37.3 17.3s0-7 6.8-13.1c0 0-4.1 1.5-6.1 1.1c-2.4-.4-3.2-3.3-3.2-3.3S29 14.6 30.7 16.2c1.7 1.7 6.6 1.1 6.6 1.1" />
                    <path fill="#f8d048" d="M28.4 21.4s-3.9-8-12.2-12.2c0 0 6.5-.6 8-1.4c1.9-.9 3-3.4 3-3.4s7.2 12.6 6.6 14.5s-5.4 2.5-5.4 2.5" />
                    <path fill="#ea9f07" d="M32.6 20.5s-6.1 2.4-13.9 2.4C2.3 22.8 0 11 16.2 12.1c13.3 1 16.4 8.4 16.4 8.4" />
                    <path fill="#f0ae11" d="M31.5 20.4s7.2.6 13.9-1.1c14-3.6 8.8-14.2-4.4-9.7c-10.8 3.7-9.5 10.8-9.5 10.8" />
                    <g fill="#824000">
                        <path d="M32.6 20.5S28.8 22 23.9 22c-10.2 0-11.7-7.4-1.6-6.7c8.3.6 10.3 5.2 10.3 5.2" />
                        <path d="M32.6 20.5s5 .4 9.7-.8c9.8-2.5 6.1-9.9-3-6.8c-7.6 2.6-6.7 7.6-6.7 7.6" />
                    </g>
                </svg>
             </div>
             <h1 className={`${playfair.className} text-4xl font-bold text-gray-900 mb-3 leading-tight tracking-tight text-center`}>
                {!isClaimed ? `${senderName} sent you a delicious meal!` : "Gift Claimed!"}
             </h1>
             {!isClaimed && (
                <p className="text-gray-500 font-medium text-center">
                  Add your delivery details below to receive your treat.
                </p>
             )}
          </div>

          {!isClaimed ? (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 md:p-10 border border-gray-100 relative overflow-hidden"
             >
                {/* Gift Note Letter Aesthetic */}
                {giftMessage && (
                   <div className="bg-[#FFFDF7] border border-stone-100 p-8 rounded-2xl mb-12 shadow-sm relative">
                      <div className="absolute -top-3 left-6 bg-white px-3 py-1 border border-stone-100 rounded-full flex items-center gap-2 shadow-sm">
                         <MailOpen className="w-3.5 h-3.5 text-stone-400" />
                         <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Personal Note</span>
                      </div>
                      <p className={`text-gray-700 italic text-lg leading-relaxed text-center ${playfair.className}`}>&quot;{giftMessage}&quot;</p>
                   </div>
                )}

                <form onSubmit={handleClaim} className="space-y-6">
                   <div className="mb-6">
                      <h3 className="font-bold text-gray-900 text-xl border-b pb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#1B6013]" />
                        Delivery Details
                      </h3>
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
                       <Label className="text-sm font-semibold text-gray-700">Email Address (Optional)</Label>
                       <div className="relative">
                          <MailOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="pl-12 h-14 rounded-2xl bg-gray-50 border-gray-200 focus-visible:ring-[#1B6013]" placeholder="your@email.com" />
                       </div>
                   </div>

                   <div className="space-y-1">
                       <Label className="text-sm font-semibold text-gray-700">Delivery Area</Label>
                       <Popover modal={true} open={isLocationPopoverOpen} onOpenChange={setIsLocationPopoverOpen}>
                          <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between h-14 px-4 rounded-2xl bg-gray-50 border-gray-200 text-left font-normal transition-all hover:bg-white focus:ring-[#1B6013]",
                                  !formData.location && "text-muted-foreground"
                                )}
                              >
                                {formData.location ? formData.location : "Select where to deliver"}
                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[100] rounded-2xl overflow-hidden shadow-2xl border-gray-100">
                             <div className="flex flex-col max-h-[300px]">
                                <div className="flex items-center px-4 py-3 border-b bg-gray-50/50">
                                   <Search className="w-4 h-4 text-gray-400 mr-2" />
                                   <Input
                                     placeholder="Search area..."
                                     className="h-8 border-none focus-visible:ring-0 bg-transparent p-0 text-sm"
                                     value={locationSearch}
                                     onChange={(e) => setLocationSearch(e.target.value)}
                                   />
                                </div>
                                <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
                                   {locations
                                     .filter(loc => loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase()))
                                     .map((loc) => (
                                       <button
                                         key={loc.id}
                                         type="button"
                                         className={cn(
                                           "w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between",
                                           formData.location === loc.name ? "bg-[#1B6013] text-white" : "hover:bg-gray-100"
                                         )}
                                         onClick={() => {
                                           setFormData({...formData, location: loc.name});
                                           setIsLocationPopoverOpen(false);
                                         }}
                                       >
                                         {loc.name}
                                         {formData.location === loc.name && <Check className="h-4 w-4 text-white" />}
                                       </button>
                                     ))}
                                   {locations.filter(loc => loc.name.toLowerCase().includes(locationSearch.trim().toLowerCase())).length === 0 && (
                                     <div className="p-4 text-center text-sm text-gray-500">No areas found matching your search.</div>
                                   )}
                                </div>
                             </div>
                          </PopoverContent>
                       </Popover>
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

                   <div className="flex items-center space-x-3 p-5 bg-[#1B6013]/5 rounded-2xl border border-[#1B6013]/10">
                      <Checkbox 
                        id="saveBeneficiary" 
                        checked={formData.saveAsBeneficiary} 
                        onCheckedChange={(checked) => setFormData({...formData, saveAsBeneficiary: !!checked})} 
                      />
                      <Label htmlFor="saveBeneficiary" className="text-sm font-bold text-[#1B6013] flex items-center gap-2 cursor-pointer leading-tight">
                        <Users className="w-4 h-4" />
                        Save these details for {senderName} to use in their address book next time
                      </Label>
                   </div>

                   <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-[#1B6013] hover:bg-[#154d0f] text-white font-bold text-lg mt-8 shadow-lg shadow-[#1B6013]/20 transition-all active:scale-95">
                      {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Claim & Deliver My Meal"}
                   </Button>
                   <p className="text-center text-xs text-gray-500 mt-4 font-medium italic">
                      &quot;Distance is no barrier to love. Enjoy your meal!&quot;
                   </p>
                </form>
             </motion.div>
          ) : (
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-3xl shadow-xl p-10 text-center border border-[#1B6013]/20"
             >
                 <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-[#1B6013] rotate-12 shadow-inner">
                    <Gift className="w-10 h-10" />
                 </div>
                 <h2 className={`text-3xl font-bold text-gray-900 mb-4 ${playfair.className}`}>Meal Successfully Claimed!</h2>
                 <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                    Your delivery details have been recorded. We&apos;ve notified <strong>{senderName}</strong> that you&apos;ve received their gift.
                 </p>
                
                <div className="bg-gray-50 p-6 rounded-2xl space-y-4 text-left border border-gray-100 mb-8">
                   <h4 className="font-bold text-gray-900 border-b pb-2 mb-2">Delivery Details</h4>
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Receiver</p>
                      <p className="font-medium">{formData.fullName || "John Doe"}</p>
                   </div>
                   <div>
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Address</p>
                      <p className="font-medium">{formData.street}, {formData.location}</p>
                   </div>
                </div>

                <Button onClick={() => window.location.href = "/"} className="w-full h-14 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold transition-all">
                   Explore FeedMe Africa
                </Button>
             </motion.div>
          )}
       </div>
    </main>
  );
}
