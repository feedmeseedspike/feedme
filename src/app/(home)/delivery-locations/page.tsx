import React from "react";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import areas from "src/lib/lagos-areas.json";
import { MapPin, Truck, ShieldCheck, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Metadata } from "next";
import { createServiceRoleClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Delivery Locations | Where We Deliver in Lagos | FeedMe",
  description: "FeedMe delivers fresh groceries and farm produce to over 300 locations across Lagos, including Lekki, Victoria Island, Ikeja, and Surulere. Check if we deliver to your area and see our transparent delivery rates.",
  keywords: "grocery delivery locations Lagos, fresh food delivery areas, Lekki grocery delivery, Victoria Island food delivery, Ikeja farm produce, FeedMe delivery zones, delivery prices Lagos",
  alternates: {
    canonical: "https://shopfeedme.com/delivery-locations",
  },
};

export default async function DeliveryLocationsPage() {
  const supabase = createServiceRoleClient();
  const { data: dbLocations } = await supabase.from('delivery_locations').select('name, price');
  
  const priceMap = (dbLocations || []).reduce((acc, loc) => {
    acc[loc.name.toLowerCase().trim()] = loc.price;
    return acc;
  }, {} as Record<string, number>);

  // Group areas by LGA and calculate price range
  const groupedAreas = areas.reduce((acc, area) => {
    const lga = area.lga;
    if (!acc[lga]) {
      acc[lga] = { areas: [], minPrice: Infinity, maxPrice: -Infinity };
    }
    
    let price = 3000; // Default
    const areaName = area.name.toLowerCase().trim();
    const lgaName = area.lga.toLowerCase().trim();

    if (priceMap[areaName]) {
      price = priceMap[areaName];
    } else if (priceMap[lgaName]) {
      price = priceMap[lgaName];
    }

    acc[lga].areas.push(area.name);
    acc[lga].minPrice = Math.min(acc[lga].minPrice, price);
    acc[lga].maxPrice = Math.max(acc[lga].maxPrice, price);
    return acc;
  }, {} as Record<string, { areas: string[], minPrice: number, maxPrice: number }>);

  // Sort LGAs alphabetically
  const sortedLGAs = Object.keys(groupedAreas).sort();

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Breadcrumb Section */}
      <div className="bg-white border-b border-gray-100">
        <Container className="py-4">
          <CustomBreadcrumb />
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center p-3 bg-[#1B6013]/10 rounded-full mb-6">
              <MapPin className="w-8 h-8 text-[#1B6013]" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-[#1D2939] mb-6">
              Delivery Coverage & Rates
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              FeedMe delivers fresh farm produce to over <span className="text-[#1B6013] font-bold">300+ locations</span> across Lagos. Find the delivery rates for your Local Government Area below.
            </p>
          </div>

          {/* Range Summary Card */}
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-100 shadow-sm mb-16">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
                    <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Base Delivery</div>
                    <div className="text-3xl font-bold text-[#1B6013]">₦2,500</div>
                </div>
                <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
                    <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Max Delivery</div>
                    <div className="text-3xl font-bold text-[#1B6013]">₦5,000</div>
                </div>
                <div className="text-center md:text-left border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
                    <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Delivery Time</div>
                    <div className="text-3xl font-bold text-[#F0800F]">3 Hours</div>
                </div>
                <div className="text-center md:text-left">
                    <div className="text-stone-400 text-[10px] uppercase tracking-widest mb-1 font-bold">Service Hours</div>
                    <div className="text-3xl font-bold text-[#1D2939]">8am - 6pm</div>
                </div>
             </div>
          </div>

          {/* Locations Grid - Ranges */}
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-[#1D2939] mb-8 pb-4 border-b border-gray-100">
               Rates by Local Government Area (LGA)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sortedLGAs.map((lga) => {
                const data = groupedAreas[lga];
                const priceDisplay = data.minPrice === data.maxPrice 
                  ? `₦${data.minPrice.toLocaleString()}`
                  : `₦${data.minPrice.toLocaleString()} - ₦${data.maxPrice.toLocaleString()}`;
                
                return (
                  <div key={lga} className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-between hover:border-[#1B6013]/20 transition-all group">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-bold text-[#1D2939] group-hover:text-[#1B6013] transition-colors">{lga}</h3>
                    </div>
                    <div className="text-right">
                       <div className="text-xl font-bold text-[#F0800F]">{priceDisplay}</div>
                       <div className="text-[10px] text-gray-400 font-medium">Standard Delivery</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 bg-[#1B6013] rounded-3xl p-10 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">Ready to order fresh?</h2>
              <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                Join thousands of happy customers in Lagos getting the best farm-fresh produce delivered today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/search" className="bg-[#F0800F] hover:bg-[#d9730d] text-white px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105">
                  Start Shopping
                </a>
                <a href="/faq" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-10 py-4 rounded-full font-bold transition-all">
                  Delivery FAQs
                </a>
              </div>
            </div>
          </div>

          {/* Structured Data for Local SEO */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Service",
                "name": "Fresh Grocery Delivery",
                "provider": {
                  "@type": "GroceryStore",
                  "name": "FeedMe Lagos"
                },
                "areaServed": sortedLGAs.map(lga => ({
                  "@type": "AdministrativeArea",
                  "name": `${lga}, Lagos`
                })),
                "serviceType": "Same-day grocery delivery"
              })
            }}
          />
        </div>
      </Container>
    </div>
  );
}
