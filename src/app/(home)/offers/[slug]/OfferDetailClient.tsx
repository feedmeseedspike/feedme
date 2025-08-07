'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, Users, Package, Plus, Minus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';
import Container from '@/components/shared/Container';
import { addToCart } from '@/lib/actions/cart.actions';
import { useUser } from 'src/hooks/useUser';
import { useAnonymousCart } from 'src/hooks/useAnonymousCart';
import { formatNaira } from "src/lib/utils";
import { cartQueryKey } from 'src/queries/cart';
import FastDelivery from "@/components/icons/fastDelivery.svg";
import Security from "@/components/icons/security.svg";
import Freshness from "@/components/icons/freshness.svg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import CustomBreadcrumb from "@/components/shared/breadcrumb";

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_per_slot: number;
  total_slots: number;
  available_slots: number;
  weight_per_slot: string;
  start_date: string;
  end_date: string;
  category_id: string;
  categories?: { id: string; title: string };
  status: 'active' | 'inactive' | 'expired' | 'sold_out';
}

const fetchOffer = async (id: string): Promise<{ offer: Offer }> => {
  const response = await fetch(`/api/offers/${id}`);
  if (!response.ok) {
    throw new Error('Failed to fetch offer');
  }
  return response.json();
};

interface Props {
  offerId: string;
}

export default function OfferDetailClient({ offerId }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const anonymousCart = useAnonymousCart();
  const queryClient = useQueryClient();
  
  const [selectedSlots, setSelectedSlots] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [timeLeft, setTimeLeft] = useState<any>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['offer', offerId],
    queryFn: () => fetchOffer(offerId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const offer = data?.offer;

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Real-time timer updates
  useEffect(() => {
    if (!offer?.end_date) return;

    const updateTimer = () => {
      const time = formatTimeLeft(offer.end_date);
      setTimeLeft(time);
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [offer?.end_date]);

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (user) {
        // Authenticated user
        return addToCart(null, selectedSlots, null, null, offerId);
      } else {
        // Anonymous user
        if (offer) {
          await anonymousCart.addItem(
            null, // productId
            selectedSlots,
            offer.price_per_slot,
            null, // option
            null, // bundleId
            offerId // offerId
          );
        }
        return { success: true };
      }
    },
    onSuccess: (result) => {
      if (result?.success !== false) {
        toast.success(`${selectedSlots} slot${selectedSlots > 1 ? 's' : ''} added to cart!`);
        setIsAddingToCart(false);
        
        if (user) {
          // For authenticated users, invalidate cart query
          queryClient.invalidateQueries({ queryKey: cartQueryKey });
        } else {
          // Trigger cart update event for anonymous users
          window.dispatchEvent(new Event('anonymousCartUpdated'));
        }
      } else {
        toast.error('Failed to add to cart');
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add to cart');
      setIsAddingToCart(false);
    },
  });

  const formatTimeLeft = (endDate: string) => {
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Determine urgency level based on time left
    const totalHours = days * 24 + hours;
    let urgency = 'normal'; // Green brand color
    if (totalHours <= 2) urgency = 'critical'; // Red for 2 hours or less
    else if (totalHours <= 24) urgency = 'warning'; // Orange for 24 hours or less
    
    return {
      expired: false,
      urgency,
      days: String(days).padStart(2, '0'),
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0')
    };
  };

  const handleAddToCart = async () => {
    if (!offer) return;
    
    if (selectedSlots > offer.available_slots) {
      toast.error(`Only ${offer.available_slots} slots available`);
      return;
    }

    setIsAddingToCart(true);
    addToCartMutation.mutate();
  };

  const totalPrice = offer ? offer.price_per_slot * selectedSlots : 0;

  const datas = [
    {
      id: 1,
      icon: <FastDelivery />,
      title: "Fast Delivery",
      description: "Get your slots delivered at your doorstep in 3 hours or less.",
    },
    {
      id: 2,
      icon: <Security />,
      title: "Security & Privacy",
      description: "Safe payments: We do not share your personal details with any third parties without your consent.",
    },
  ];

  if (error) {
    return (
      <Container>
        <div className="text-center py-10">
          <p className="text-red-500">Failed to load offer. Please try again.</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <main>
        <div className="md:border-b shadow-sm">
          <div className="bg-white py-4">
            <Container>
              <CustomBreadcrumb category='' />
            </Container>
          </div>
        </div>
      </main>
      
      <section>
        <Container>
          {isLoading ? (
            <div className="py-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-8 bg-white my-6 p-3 animate-pulse">
              <div className="col-span-3">
                <Skeleton className="h-96 lg:h-[500px] w-full rounded-lg" />
              </div>
              <div className="col-span-3 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-32 w-full" />
              </div>
              <div className="col-span-1 md:col-span-6 lg:col-span-2">
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          ) : offer && (
            <div className={`py-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-8 bg-white my-6 p-3 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {/* Offer Image Gallery */}
              <div className={`col-span-3 transition-all duration-500 delay-100 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
                <div className="relative w-full h-96 lg:h-[500px] rounded-lg overflow-hidden bg-gray-100">
                  {offer.image_url ? (
                    <Image
                      src={offer.image_url}
                      alt={offer.title || "Offer image"}
                      fill
                      // style={{ objectFit: "cover" }}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-lg">No Image Available</span>
                      </div>
                    </div>
                  )}
                  {offer.available_slots === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-xl p-2">SOLD OUT</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Offer Details */}
              <div className={`col-span-3 transition-all duration-500 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <h1 className="text-2xl font-bold mb-2 transition-all duration-300 hover:text-green-600">{offer.title}</h1>
                
                {/* Status and Categories */}
                <div className="flex gap-2 mb-4">
                  {offer.categories?.title && (
                    <Badge variant="secondary" className="capitalize">
                      {offer.categories.title.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                {/* Modern Animated Countdown Timer */}
                {offer.end_date && timeLeft && !timeLeft.expired && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="relative">
                        <Clock className={`w-5 h-5 ${
                          timeLeft.urgency === 'critical' ? 'text-red-500 animate-pulse' :
                          timeLeft.urgency === 'warning' ? 'text-orange-500 animate-pulse' :
                          'text-[#1B6013]'
                        }`} />
                        <div className={`absolute -inset-1 rounded-full animate-ping ${
                          timeLeft.urgency === 'critical' ? 'bg-red-500/20' :
                          timeLeft.urgency === 'warning' ? 'bg-orange-500/20' :
                          'bg-[#1B6013]/20'
                        }`}></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-800 tracking-wide uppercase">Offer ends in</span>
                    </div>
                    <div className="flex gap-3 justify-start">
                      {parseInt(timeLeft.days) > 0 && (
                        <div className="relative group">
                          <div className={`absolute -inset-0.5 rounded-xl opacity-60 group-hover:opacity-100 transition duration-300 blur-sm ${
                            timeLeft.urgency === 'critical' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                            timeLeft.urgency === 'warning' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                            'bg-gradient-to-r from-[#1B6013] to-green-700'
                          }`}></div>
                          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-xl px-4 py-2 min-w-[70px] shadow-2xl transform transition-all duration-300 group-hover:scale-105">
                            <div className="text-center">
                              <div className="text-2xl font-bold font-mono leading-none mb-1 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
                                {timeLeft.days}
                              </div>
                              <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Days</div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-xl opacity-60 group-hover:opacity-100 transition duration-300 blur-sm ${
                          timeLeft.urgency === 'critical' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                          timeLeft.urgency === 'warning' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-[#1B6013] to-green-700'
                        }`}></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-xl px-4 py-2 min-w-[70px] shadow-2xl transform transition-all duration-300 group-hover:scale-105">
                          <div className="text-center">
                            <div className="text-2xl font-bold font-mono leading-none mb-1 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent transition-all duration-500">
                              {timeLeft.hours}
                            </div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</div>
                          </div>
                        </div>
                      </div>
                      <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-xl opacity-60 group-hover:opacity-100 transition duration-300 blur-sm ${
                          timeLeft.urgency === 'critical' ? 'bg-gradient-to-r from-red-400 to-red-600' :
                          timeLeft.urgency === 'warning' ? 'bg-gradient-to-r from-orange-400 to-orange-600' :
                          'bg-gradient-to-r from-[#1B6013] to-green-700'
                        }`}></div>
                        <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white rounded-xl px-4 py-2 min-w-[70px] shadow-2xl transform transition-all duration-300 group-hover:scale-105">
                          <div className="text-center">
                            <div className="text-2xl font-bold font-mono leading-none mb-1 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent transition-all duration-500">
                              {timeLeft.minutes}
                            </div>
                            <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Minutes</div>
                          </div>
                        </div>
                      </div>
                      <div className="relative group">
                        <div className={`absolute -inset-0.5 rounded-xl transition duration-300 blur-sm ${
                          timeLeft.urgency === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 opacity-80 group-hover:opacity-100 animate-pulse' :
                          timeLeft.urgency === 'warning' ? 'bg-gradient-to-r from-orange-500 to-orange-600 opacity-70 group-hover:opacity-100 animate-pulse' :
                          'bg-gradient-to-r from-[#1B6013] to-green-700 opacity-60 group-hover:opacity-100'
                        }`}></div>
                        <div className={`relative text-white rounded-xl px-4 py-2 min-w-[70px] shadow-2xl transform transition-all duration-200 group-hover:scale-105 ${
                          timeLeft.urgency === 'critical' ? 'bg-gradient-to-br from-red-900 via-red-800 to-red-900 animate-pulse' :
                          timeLeft.urgency === 'warning' ? 'bg-gradient-to-br from-orange-900 via-orange-800 to-orange-900 animate-pulse' :
                          'bg-gradient-to-br from-gray-900 via-gray-800 to-black'
                        }`}>
                          <div className="text-center">
                            <div className={`text-2xl font-bold font-mono leading-none mb-1 bg-gradient-to-b bg-clip-text text-transparent transition-all duration-200 ${
                              timeLeft.urgency === 'critical' ? 'from-white to-red-200' :
                              timeLeft.urgency === 'warning' ? 'from-white to-orange-200' :
                              'from-white to-gray-300'
                            }`}>
                              {timeLeft.seconds}
                            </div>
                            <div className={`text-xs font-medium uppercase tracking-wider ${
                              timeLeft.urgency === 'critical' ? 'text-red-200 animate-pulse' :
                              timeLeft.urgency === 'warning' ? 'text-orange-200 animate-pulse' :
                              'text-gray-400'
                            }`}>Seconds</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-center">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${
                        timeLeft.urgency === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                        timeLeft.urgency === 'warning' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          timeLeft.urgency === 'critical' ? 'bg-red-500 animate-pulse' :
                          timeLeft.urgency === 'warning' ? 'bg-orange-500 animate-pulse' :
                          'bg-[#1B6013]'
                        }`}></div>
                        {timeLeft.urgency === 'critical' ? 'Hurry! Offer Ending Soon' :
                         timeLeft.urgency === 'warning' ? 'Limited Time Offer' :
                         'Special Offer Available'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Expired Timer */}
                {offer.end_date && timeLeft?.expired && (
                  <div className="mb-4">
                    <Badge variant="destructive" className="text-lg p-2 animate-bounce">
                      <Clock className="w-4 h-4 mr-1" />
                      EXPIRED
                    </Badge>
                  </div>
                )}

                {/* Price */}
                <div className="mt-2 mb-1">
                  <p className="text-2xl font-bold text-[#1B6013] inline-block">
                    {formatNaira(offer.price_per_slot)} per slot
                  </p>
                </div>

                {/* Offer Status */}
                <p className="text-[#12B76A] text-[14px] border py-1 px-2 border-[#bfe0d0] w-fit flex gap-1 items-center mb-2">
                  Special Offer <Freshness className="size-4" />
                </p>
                
                <p className="text-[12px] pt-2 mb-4">
                  {offer.available_slots} of {offer.total_slots} slots available
                </p>

                {/* Offer Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Users className="w-5 h-5 mr-2" />
                    <div>
                      <div className="font-medium">{offer.available_slots} of {offer.total_slots}</div>
                      <div className="text-sm">slots available</div>
                    </div>
                  </div>
                  
                  {offer.weight_per_slot && (
                    <div className="flex items-center text-gray-600">
                      <Package className="w-5 h-5 mr-2" />
                      <div>
                        <div className="font-medium">{offer.weight_per_slot}</div>
                        <div className="text-sm">per slot</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Math.round(((offer.total_slots - offer.available_slots) / offer.total_slots) * 100)}% filled</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                      style={{ 
                        width: isVisible ? `${((offer.total_slots - offer.available_slots) / offer.total_slots) * 100}%` : '0%'
                      }}
                    ></div>
                  </div>
                </div>

                <Separator className="mt-4 mb-2" />
              </div>

              {/* Add to Cart Section */}
              <div className={`col-span-1 md:col-span-6 lg:col-span-2 border border-[#DDD5DD] px-4 py-2 w-full h-fit transition-all duration-500 delay-300 hover:shadow-lg hover:border-green-200 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
                <div className="flex flex-col gap-[5px] mb-4">
                  {datas.map((data) => (
                    <div className="" key={data.id}>
                      <div className="flex gap-1 items-center">
                        <p className="size-4">{data.icon}</p>
                        <p className="h6-bold">{data.title}</p>
                      </div>
                      <p className="h6-light">{data.description}</p>
                    </div>
                  ))}
                </div>
                
                <Separator className="mt-4 mb-4" />

                {/* Slot Selector */}
                <div className="mb-4">
                  <Label className="text-base font-medium">Number of slots</Label>
                  <div className="flex items-center gap-3 mt-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedSlots(Math.max(1, selectedSlots - 1))}
                      disabled={selectedSlots <= 1}
                      className="transition-all duration-200 hover:scale-105 hover:border-green-400 disabled:hover:scale-100 disabled:hover:border-gray-200"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      max={offer.available_slots}
                      value={selectedSlots}
                      onChange={(e) => setSelectedSlots(Math.min(offer.available_slots, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-20 text-center transition-all duration-200 focus:ring-2 focus:ring-green-200 focus:border-green-400"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedSlots(Math.min(offer.available_slots, selectedSlots + 1))}
                      disabled={selectedSlots >= offer.available_slots}
                      className="transition-all duration-200 hover:scale-105 hover:border-green-400 disabled:hover:scale-100 disabled:hover:border-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">max {offer.available_slots}</p>
                </div>

                {/* Total Price */}
                <div className="border-t pt-4 mb-4 transition-all duration-300">
                  <div className="flex justify-between items-center text-lg">
                    <span>Total:</span>
                    <span className="font-bold text-2xl text-green-600 transition-all duration-300">
                      {formatNaira(totalPrice)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 transition-all duration-300">
                    {selectedSlots} slot{selectedSlots > 1 ? 's' : ''} × {formatNaira(offer.price_per_slot)}
                  </p>
                </div>

                {/* Add to Cart Button */}
                <Button
                  className="w-full text-lg py-6 transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:hover:scale-100 disabled:hover:shadow-none active:scale-95"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={offer.available_slots === 0 || offer.status !== 'active' || isAddingToCart || addToCartMutation.isPending}
                >
                  {isAddingToCart || addToCartMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding to Cart...
                    </div>
                  ) : offer.available_slots === 0 ? (
                    'Sold Out'
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2 transition-transform duration-200 group-hover:rotate-12" />
                      Add {selectedSlots} Slot{selectedSlots > 1 ? 's' : ''} to Cart
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Offer Description */}
          {offer?.description && (
            <div className={`bg-white my-6 p-3 transition-all duration-500 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="!border-none">
                  <AccordionTrigger className="hover:text-green-600 transition-colors duration-200">Offer Description</AccordionTrigger>
                  <AccordionContent className="transition-all duration-300">{offer.description}</AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <Separator className="mt-2" />
        </Container>
      </section>
    </>
  );
}
