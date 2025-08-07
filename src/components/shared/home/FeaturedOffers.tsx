'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toSlug, formatNaira } from 'src/lib/utils';

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_per_slot: number;
  total_slots: number;
  available_slots: number;
  weight_per_slot: string;
  end_date: string;
  category: string;
  location: string;
  status: 'active' | 'inactive' | 'expired' | 'sold_out';
}

const fetchFeaturedOffers = async (): Promise<{ offers: Offer[] }> => {
  const response = await fetch('/api/offers?status=active&limit=3');
  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }
  return response.json();
};

// Timer component with real-time updates
function OfferTimer({ endDate }: { endDate: string }) {
  const [timeLeft, setTimeLeft] = useState<any>(null);

  const formatTimeLeft = (endDate: string) => {
    if (!endDate) return null;
    
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return { expired: true };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Determine urgency level
    const totalHours = days * 24 + hours;
    let urgency = 'normal';
    if (totalHours <= 2) urgency = 'critical';
    else if (totalHours <= 24) urgency = 'warning';
    
    return {
      expired: false,
      urgency,
      days,
      hours,
      minutes,
      text: days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m left`
    };
  };

  useEffect(() => {
    const updateTimer = () => {
      const time = formatTimeLeft(endDate);
      setTimeLeft(time);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [endDate]);

  if (!timeLeft) return null;

  if (timeLeft.expired) {
    return (
      <Badge variant="destructive" className="absolute top-3 right-3">
        EXPIRED
      </Badge>
    );
  }

  return (
    <Badge 
      className={`absolute top-1 right-1 text-white border-0 text-[10px] px-1 py-0.5 ${
        timeLeft.urgency === 'critical' ? 'bg-red-500' :
        timeLeft.urgency === 'warning' ? 'bg-orange-500' :
        'bg-[#1B6013]'
      }`}
    >
      <Clock className={`w-2 h-2 mr-1 ${timeLeft.urgency !== 'normal' ? 'animate-pulse' : ''}`} />
      {timeLeft.days > 0 ? `${timeLeft.days}d` : timeLeft.hours > 0 ? `${timeLeft.hours}h` : `${timeLeft.minutes}m`}
    </Badge>
  );
}

export default function FeaturedOffers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featured-offers'],
    queryFn: fetchFeaturedOffers,
    staleTime: 1000 * 60 * 5, 
  });

  const offers = data?.offers || [];

  if (error || (!isLoading && offers.length === 0)) {
    return null;
  }

  return (
    <section className="bg-white rounded-lg border-[2px] border-[#1B6013] p-2 md:p-4">
      <div className="flex items-center justify-between text-[14px] mb-4">
        <Link href="/offers" className="h2-bold truncate">
          Special Offers
        </Link>
        <Link
          href="/offers"
          className="flex md:gap-1 items-center text-[#1B6013] whitespace-nowrap"
        >
          <p>See More</p>
          <ArrowRight className="size-[14px]" />
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[120px] md:w-[160px]">
              <div className="h-[100px] md:h-[135px] bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {offers.map((offer) => (
            <div key={offer.id} className="flex-shrink-0 mb-4 md:pb-8 gap-2">
              <Link href={`/offers/${toSlug(offer.title)}`}>
                <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
                  <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-lg group">
                    <Image
                      src={offer.image_url || '/placeholder-offer.jpg'}
                      alt={offer.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-offer.jpg';
                      }}
                    />
                    {offer.end_date && <OfferTimer endDate={offer.end_date} />}
                  </div>
                </div>
              </Link>
              
              <div className="flex flex-col space-y-1 w-[120px] md:w-[160px] mt-2">
                <Link
                  href={`/offers/${toSlug(offer.title)}`}
                  className="overflow-hidden font-semibold text-sm text-ellipsis leading-5 line-clamp-2 hover:text-[#1B6013] transition-colors"
                >
                  {offer.title}
                </Link>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[#1B6013]">
                    {formatNaira(offer.price_per_slot)} <span className="text-xs text-gray-600 font-normal">per slot</span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    {offer.available_slots} left
                  </span>
                  <span className="bg-gray-100 px-2 py-1 rounded text-[10px]">
                    {Math.round(((offer.total_slots - offer.available_slots) / offer.total_slots) * 100)}% filled
                  </span>
                </div>
                {/* Mini Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-[#1B6013] h-1 rounded-full transition-all" 
                    style={{ 
                      width: `${((offer.total_slots - offer.available_slots) / offer.total_slots) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}