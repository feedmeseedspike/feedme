"use client";	

import * as React from "react"
import { useState, useEffect, createContext, useContext } from "react"
import Location from "@components/icons/location.svg"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../ui/select"
import { toast } from "sonner"

// Create a context to share location data across components
type LocationContextType = {
  currentLocation: string;
  setCurrentLocation: (location: string) => void;
  locationName: string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}

// Location mapping for display purposes
const locationMapping: Record<string, string> = {
  "ikeja": "Ikeja",
  "lekki": "Lekki",
  "victoria-island": "Victoria Island",
  "yaba": "Yaba",
  "surulere": "Surulere",
  "ikoyi": "Ikoyi",
  "ajah": "Ajah",
  "gbagada": "Gbagada",
  "maryland": "Maryland",
  "apapa": "Apapa",
  "festac": "Festac",
  "ojodu": "Ojodu",
  "ogudu": "Ogudu",
  "magodo": "Magodo",
  "oshodi": "Oshodi"
};

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [currentLocation, setCurrentLocation] = useState<string>("ikeja");
  const [locationName, setLocationName] = useState<string>(locationMapping["ikeja"]);

  const updateLocation = (location: string) => {
    setCurrentLocation(location);
    setLocationName(locationMapping[location] || "Lagos");
    localStorage.setItem("userLocation", location);
  }

  useEffect(() => {
    // Try to get saved location from localStorage
    const savedLocation = localStorage.getItem("userLocation");
    if (savedLocation && locationMapping[savedLocation]) {
      updateLocation(savedLocation);
    } else {
      // Default to Ikeja if no saved location
      updateLocation("ikeja");
    }
  }, []);

  return (
    <LocationContext.Provider value={{ 
      currentLocation, 
      setCurrentLocation: updateLocation,
      locationName 
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function Locations() {
  // const { toast } = useToast();
  const { currentLocation, setCurrentLocation, locationName } = useLocation();
  const [isDetecting, setIsDetecting] = useState(false);

  const handleLocationChange = (value: string) => {
    setCurrentLocation(value);
    toast(`Your delivery location is now set to ${locationMapping[value]}.`);
  }

  const detectCurrentLocation = () => {
    setIsDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // In a real app, you would use reverse geocoding here
          // For now, we'll just simulate by selecting a random Lagos location
          const lagosLocations = Object.keys(locationMapping);
          const randomLocation = lagosLocations[Math.floor(Math.random() * lagosLocations.length)];
          
          setCurrentLocation(randomLocation);
          toast(
            `We've detected your location as ${locationMapping[randomLocation]}.`
            // title: "Location Detected",
            // description: `We've detected your location as ${locationMapping[randomLocation]}.`,
            // duration: 3000,
          );
          setIsDetecting(false);
        },
        (error: any) => {
          console.error("Error getting location:", error);
          toast(
           " Location Detection Failed"
          //   {
          //   title: "Location Detection Failed",
          //   description: "We couldn't detect your location. Please select manually.",
          //   variant: "destructive",
          //   duration: 3000,
          // }
        );
          setIsDetecting(false);
        }
      );
    } else {
      toast("Geolocation Not Supported");
      //   {
      //   title: "Geolocation Not Supported",
      //   description: "Your browser doesn't support geolocation. Please select your location manually.",
      //   variant: "destructive",
      //   duration: 3000,
      // }
      setIsDetecting(false);
    }
  }

  return (
    <div className="flex items-center">
      <Select value={currentLocation} onValueChange={handleLocationChange}>
        <SelectTrigger className="text-[12px] text-white flex justify-center items-center">
          <Location className="mr-1"/>
          <SelectValue placeholder="Lagos, Nigeria" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Lagos Areas</SelectLabel>
            {Object.entries(locationMapping).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectGroup>
          <div className="px-2 py-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                detectCurrentLocation();
              }}
              className="text-sm text-primary hover:underline flex items-center"
              disabled={isDetecting}
            >
              {isDetecting ? "Detecting..." : "Detect my location"}
            </button>
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}

// Usage example:
// In your _app.tsx or layout component:
// <LocationProvider>
//   <YourApp />
// </LocationProvider>
//
// Then in any component:
// const { currentLocation, locationName } = useLocation();
