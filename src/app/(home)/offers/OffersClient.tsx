'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Container from '@/components/shared/Container';
import { toSlug, formatNaira } from 'src/lib/utils';

export interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_per_slot: number;
  total_slots: number;
  available_slots: number;
  weight_per_slot: string;
  end_date: string;
  category_id: string;
  categories?: { id: string; title: string };
  status: 'active' | 'inactive' | 'expired' | 'sold_out';
}

const fetchOffers = async (): Promise<{ offers: Offer[] }> => {
  const response = await fetch('/api/offers?status=active');
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
      <Badge variant="destructive" className="absolute top-2 right-2">
        EXPIRED
      </Badge>
    );
  }

  return (
    <Badge 
      className={`absolute top-2 right-2 text-white border-0 ${
        timeLeft.urgency === 'critical' ? 'bg-red-500' :
        timeLeft.urgency === 'warning' ? 'bg-orange-500' :
        'bg-[#1B6013]'
      }`}
    >
      <Clock className={`w-3 h-3 mr-1 ${timeLeft.urgency !== 'normal' ? 'animate-pulse' : ''}`} />
      {timeLeft.text}
    </Badge>
  );
}

export default function OffersClient() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['offers'],
    queryFn: fetchOffers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const offers = data?.offers || [];

  // Get unique categories
  const categories = [...new Set(offers.map(offer => offer.categories?.title).filter(Boolean))] as string[];

  // Filter offers by category
  const filteredOffers = selectedCategory === 'all' 
    ? offers 
    : offers.filter(offer => offer.categories?.title === selectedCategory);

  if (error) {
    return (
      <Container>
        <div className="text-center py-10">
          <p className="text-red-500">Failed to load offers. Please try again.</p>
        </div>
      </Container>
    );
  }

  return (
    <main>
      {/* Header Section */}
      <div className="py-2 md:border-b shadow-sm">
        <Container className="lg:!px-[40px]">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="relative z-10 py-1 text-[#1B6013] text-2xl md:text-3xl font-bold">
                Special Offers
              </h1>
            </div>
            <div className="text-gray-600">
              {`Showing ${filteredOffers.length} of ${offers.length} offers`}
            </div>
          </div>
        </Container>
      </div>

      <Container className="lg:!px-[40px] py-4">
        {/* Main Content */}
        <div className="space-y-4">
          <div className="font-medium text-lg bg-white rounded-md p-3 w-full">
            {selectedCategory === 'all' 
              ? `${filteredOffers.length} Special Offers Available`
              : `${filteredOffers.length} offers in ${selectedCategory.replace('_', ' ')}`
            }
          </div>

          {/* Category Filter */}
          {/* {categories.length > 0 && (
            <div className="bg-white rounded-md p-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category?.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </div>
          )} */}

          {/* Offers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-md overflow-hidden">
                  <div className="h-32 md:h-40 bg-gray-200 animate-pulse"></div>
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="flex flex-col justify-center items-center mx-auto text-center py-20">
              <div className="max-w-xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4"></div>
                <h3 className="text-lg md:text-2xl font-bold w-full mb-4">
                  No offers found
                </h3>
                <p className="text-gray-500 mb-6">
                  {selectedCategory === 'all' 
                    ? 'No active offers available at the moment. Check back later!'
                    : `No offers found in the ${selectedCategory.replace('_', ' ')} category.`
                  }
                </p>
                {selectedCategory !== 'all' && (
                  <Button
                    variant="outline"
                    className="border-[#1B6013] text-[#1B6013] hover:bg-[#1B6013] hover:text-white"
                    onClick={() => setSelectedCategory('all')}
                  >
                    View All Offers
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
              {filteredOffers.map((offer) => (
                <div key={offer.id} className="bg-white rounded-md overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Image */}
                  <div className="relative h-32 md:h-40 w-full">
                    <Image
                      src={offer.image_url || '/placeholder-offer.jpg'}
                      alt={offer.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    />
                    {offer.available_slots === 0 && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <Badge variant="destructive" className="text-xs">SOLD OUT</Badge>
                      </div>
                    )}
                    {offer.end_date && <OfferTimer endDate={offer.end_date} />}
                  </div>

                  {/* Content */}
                  <div className="p-3 space-y-2">
                    <Link href={`/offers/${toSlug(offer.title)}`} className="block">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-[#1B6013] transition-colors">
                        {offer.title}
                      </h3>
                    </Link>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#1B6013]">
                        {formatNaira(offer.price_per_slot)} <span className="text-xs text-gray-600 font-normal">per slot</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {offer.available_slots} left
                      </span>
                      {offer.categories?.title && (
                        <span className="bg-gray-100 px-2 py-1 rounded text-[10px] capitalize">
                          {offer.categories.title.replace('_', ' ')}
                        </span>
                      )}
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

                    <Link href={`/offers/${toSlug(offer.title)}`} className="block">
                      <Button 
                        size="sm"
                        className="w-full text-xs h-8" 
                        disabled={offer.available_slots === 0}
                      >
                        {offer.available_slots === 0 ? 'Sold Out' : 'View Details'}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}