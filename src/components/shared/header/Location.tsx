"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  memo,
  useEffect,
} from "react";
import LocationIcon from "@components/icons/location.svg";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { getDeliveryLocations } from "src/queries/delivery";
import { DeliveryLocation } from "@/types/delivery-location";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Check, Loader2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Icon } from "@iconify/react";
import lagosAreas from "@/lib/lagos-areas.json";

interface LocationContextType {
  currentLocationId: string | null;
  locationName: string;
  deliveryPrice: number;
  locations: DeliveryLocation[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isFetching: boolean;
  setCurrentLocation: (location: DeliveryLocation) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = memo(function LocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: locations = [], isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["delivery-locations"],
    queryFn: async () => {
      console.log("Fetching delivery locations...");
      try {
        const data = await getDeliveryLocations();
        console.log("Fetched delivery locations:", data?.length);
        return data;
      } catch (err) {
        console.error("Query function error:", err);
        throw err;
      }
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const [state, setState] = useState<{
    currentLocationId: string | null;
    locationName: string;
    deliveryPrice: number;
  }>(() => {
    if (typeof window === "undefined") {
      return {
        currentLocationId: null,
        locationName: "Lagos",
        deliveryPrice: 2500,
      };
    }

    const savedId = localStorage.getItem("userLocationId");
    const savedName = localStorage.getItem("userLocationName");
    const savedPrice = localStorage.getItem("userLocationPrice");

    return {
      currentLocationId: savedId,
      locationName: savedName || "Lagos",
      deliveryPrice: savedPrice ? Number(savedPrice) : 2500,
    };
  });

  // Sync with locations once they are loaded if we only have an ID
  useEffect(() => {
    if (locations.length > 0 && state.currentLocationId) {
      const found = locations.find((l) => l.id === state.currentLocationId);
      if (found) {
        setState({
          currentLocationId: found.id,
          locationName: found.name,
          deliveryPrice: found.price,
        });
      }
    }
  }, [locations, state.currentLocationId]);

  const setCurrentLocation = useCallback((location: DeliveryLocation) => {
    console.log("LocationProvider: Setting location:", location);
    setState({
      currentLocationId: location.id,
      locationName: location.name,
      deliveryPrice: location.price,
    });
    localStorage.setItem("userLocationId", location.id);
    localStorage.setItem("userLocationName", location.name);
    localStorage.setItem("userLocationPrice", location.price.toString());
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      locations,
      isLoading,
      isError,
      error: error as Error | null,
      isFetching,
      setCurrentLocation,
    }),
    [state, locations, isLoading, isError, error, isFetching, setCurrentLocation]
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
});

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};

export const LocationSelector = memo(
  ({
    currentLocationId,
    locations,
    onLocationChange,
  }: {
    currentLocationId: string | null;
    locations: DeliveryLocation[];
    onLocationChange: (location: DeliveryLocation) => void;
  }) => (
    <div className="ml-3 space-y-2">
      <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Delivery Area</label>
      <select
        value={currentLocationId || ""}
        onChange={(e) => {
          const loc = locations.find(l => l.id === e.target.value);
          if (loc) onLocationChange(loc);
        }}
        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50/50 focus:ring-2 focus:ring-[#1B6013] focus:border-transparent transition-all outline-none text-sm font-medium"
      >
        <option value="" disabled>Select your area</option>
        {locations.map((loc) => (
          <option key={loc.id} value={loc.id}>
            {loc.name} (₦{loc.price.toLocaleString()})
          </option>
        ))}
      </select>
    </div>
  )
);

LocationSelector.displayName = "LocationSelector";

export const Locations = memo(function Locations() {
  const { currentLocationId, locationName, locations, setCurrentLocation, isLoading, isError, error, isFetching } = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredLocations = useMemo(() => {
    if (!searchTerm) return locations;
    return locations.filter((loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [locations, searchTerm]);

  const otherAreas = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length < 2) return [];
    // Only show areas that aren't already in official locations
    return lagosAreas
      .filter((area) => 
        area.name.toLowerCase().includes(term) &&
        !locations.some(loc => loc.name.toLowerCase() === area.name.toLowerCase())
      )
      .slice(0, 12); 
  }, [locations, searchTerm]);

  const handleSelect = (loc: DeliveryLocation | { name: string; lga?: string }) => {
    console.log("Locations: Clicked on:", loc.name);
    if ("id" in loc) {
      console.log("Locations: Handling official zone");
      setCurrentLocation(loc as DeliveryLocation);
      toast.success(`Official delivery zone set to ${loc.name}`);
    } else {
      console.log("Locations: Handling extended area");
      const pseudoLoc: DeliveryLocation = {
        id: `ext-${loc.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")}`,
        name: loc.name,
        price: 3500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log("Locations: PseudoLoc created:", pseudoLoc);
      setCurrentLocation(pseudoLoc);
      toast.success(`Location set to ${loc.name} (Standard Delivery Applied)`);
    }
    setIsOpen(false);
  };

  const detectCurrentLocation = useCallback(() => {
    toast.info("Coming soon: Automatic location detection based on your zones!");
  }, []);

  return (
    <div className="flex items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 text-white hover:text-white/90 transition-all duration-300 py-1 group">
            <div className="relative flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white fill-white/20" />
              <div className="absolute w-1.5 h-1.5 bg-[#1B6013] rounded-full top-[5px]" />
            </div>
            <span className="text-base md:text-lg font-medium tracking-tight whitespace-nowrap">
              {locationName}
            </span>
            <ChevronDown className={cn("w-5 h-5 opacity-80 transition-transform duration-300", isOpen && "rotate-180")} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-72 p-0 bg-white border-gray-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-2xl overflow-hidden z-[100]"
          align="start"
          sideOffset={8}
        >
          <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search your area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 border-none bg-transparent focus-visible:ring-0 text-sm p-0 font-medium placeholder:text-gray-400"
              autoFocus
            />
          </div>
          <div className="max-h-80 overflow-y-auto overflow-x-hidden custom-scrollbar py-2">
            {isLoading ? (
              <div className="p-10 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-6 h-6 text-[#1B6013] animate-spin" />
                <p className="text-xs font-bold uppercase tracking-widest text-[#1B6013]">
                  {isFetching ? "Syncing..." : "Finding zones..."}
                </p>
              </div>
            ) : isError ? (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="p-3 bg-red-50 rounded-full">
                  <Icon icon="solar:danger-bold" className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm text-red-600 font-medium">Failed to load zones</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-tighter">{(error as any)?.message || "Unknown error"}</p>
              </div>
            ) : filteredLocations.length > 0 || otherAreas.length > 0 ? (
              <div className="grid grid-cols-1 gap-1 px-3">
                {filteredLocations.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => handleSelect(loc)}
                    className={cn(
                      "w-full text-left px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center justify-between group",
                      currentLocationId === loc.id 
                        ? "bg-[#1B6013] text-white shadow-lg shadow-[#1B6013]/20" 
                        : "hover:bg-gray-50 text-gray-700 hover:scale-[1.02] border border-transparent hover:border-gray-100"
                    )}
                  >
                    <span>{loc.name}</span>
                    {currentLocationId === loc.id ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <Check className="w-4 h-4 text-gray-200 opacity-0 group-hover:opacity-100 transition-all" />
                    )}
                  </button>
                ))}
                
                {otherAreas.length > 0 && (
                  <div className="mt-4 pb-2">
                    <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Other Lagos Areas</p>
                    {otherAreas.map((area) => (
                      <button
                        key={area.name}
                        type="button"
                        onClick={() => handleSelect(area)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-between group",
                          locationName === area.name 
                            ? "bg-gray-50 text-[#1B6013] font-bold" 
                            : "text-gray-500 hover:bg-gray-50 hover:text-[#1B6013]"
                        )}
                      >
                        <span>{area.name}</span>
                        {locationName === area.name && <Check className="w-4 h-4 text-[#1B6013]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center gap-3">
                <div className="p-3 bg-gray-50 rounded-full">
                  <Search className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 font-medium">No zones found</p>
              </div>
            )}
          </div>
          <div className="p-3 bg-gray-50/80 border-t border-gray-100">
             <button
               onClick={detectCurrentLocation}
               className="w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#1B6013] hover:bg-white hover:shadow-sm transition-all duration-300 flex items-center justify-center gap-2 border border-transparent hover:border-[#1B6013]/10"
             >
               <motion.div
                 animate={{ scale: [1, 1.2, 1] }}
                 transition={{ repeat: Infinity, duration: 3 }}
               >
                 <Icon icon="solar:gps-bold" className="w-4 h-4" />
               </motion.div>
               Detect My Location
             </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
});
