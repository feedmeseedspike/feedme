"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import Location from "@components/icons/location.svg";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { toast } from "sonner";

const locationMapping: Record<string, string> = {
  ikeja: "Ikeja",
  lekki: "Lekki",
  "victoria-island": "Victoria Island",
  yaba: "Yaba",
  surulere: "Surulere",
  ikoyi: "Ikoyi",
  ajah: "Ajah",
  gbagada: "Gbagada",
  maryland: "Maryland",
  apapa: "Apapa",
  festac: "Festac",
  ojodu: "Ojodu",
  ogudu: "Ogudu",
  magodo: "Magodo",
  oshodi: "Oshodi",
};

interface LocationContextType {
  currentLocation: string;
  locationName: string;
  setCurrentLocation: (location: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

// Memoized location selector component
const LocationSelector = memo(
  ({
    currentLocation,
    onLocationChange,
  }: {
    currentLocation: string;
    onLocationChange: (location: string) => void;
  }) => (
    <select
      value={currentLocation}
      onChange={(e) => onLocationChange(e.target.value)}
      className="w-full p-2 border rounded-md"
    >
      {Object.entries(locationMapping).map(([key, value]) => (
        <option key={key} value={key}>
          {value}
        </option>
      ))}
    </select>
  )
);

LocationSelector.displayName = "LocationSelector";

export const LocationProvider = memo(function LocationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState(() => {
    if (typeof window === "undefined") {
      return {
        currentLocation: "ikeja",
        locationName: "Ikeja",
      };
    }

    const savedLocation = localStorage.getItem("userLocation");
    const initialLocation =
      savedLocation && locationMapping[savedLocation] ? savedLocation : "ikeja";

    return {
      currentLocation: initialLocation,
      locationName: locationMapping[initialLocation] || "Lagos",
    };
  });

  const setCurrentLocation = useCallback((location: string) => {
    setState({
      currentLocation: location,
      locationName: locationMapping[location] || "Lagos",
    });
    localStorage.setItem("userLocation", location);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      setCurrentLocation,
    }),
    [state, setCurrentLocation]
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

export { LocationSelector };

export const Locations = memo(function Locations() {
  const { currentLocation, setCurrentLocation } = useLocation();
  const [isDetecting, setIsDetecting] = useState(false);

  const handleLocationChange = useCallback(
    (value: string) => {
      setCurrentLocation(value);
      toast(`Your delivery location is now set to ${locationMapping[value]}.`);
    },
    [setCurrentLocation]
  );

  const detectCurrentLocation = useCallback(() => {
    setIsDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          const locations = Object.keys(locationMapping);
          const randomLocation =
            locations[Math.floor(Math.random() * locations.length)];
          setCurrentLocation(randomLocation);
          toast(
            `We've detected your location as ${locationMapping[randomLocation]}.`
          );
          setIsDetecting(false);
        },
        () => {
          toast("Location Detection Failed");
          setIsDetecting(false);
        }
      );
    } else {
      toast("Geolocation Not Supported");
      setIsDetecting(false);
    }
  }, [setCurrentLocation]);

  return (
    <div className="flex items-center">
      <Select value={currentLocation} onValueChange={handleLocationChange}>
        <SelectTrigger className="text-[12px] text-white flex justify-center items-center !border-none">
          <Location className="mr-1" />
          <SelectValue placeholder="Lagos, Nigeria" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Lagos Areas</SelectLabel>
            {Object.entries(locationMapping).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectGroup>
          <div className="px-2 py-2">
            <button
              onClick={detectCurrentLocation}
              className="text-sm text-primary hover:underline flex items-center"
              disabled={isDetecting}
            >
              {isDetecting ? "Detecting..." : "Detect my location"}
            </button>
          </div>
        </SelectContent>
      </Select>
    </div>
  );
});
