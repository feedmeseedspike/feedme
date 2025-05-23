"use client";
import Container from "@components/shared/Container";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  FunnelIcon,
} from "@heroicons/react/24/solid";
import { getVendors } from "../../../lib/api";
import VendorCard from "@components/vendor/VendorCard";
import { useState, useEffect } from "react";
import CustomBreadcrumb from "@components/shared/breadcrumb";

const LAGOS_AREAS = [
  "All",
  "Surulere",
  "Lekki",
  "Ikeja",
  "Victoria Island",
  "Maryland",
  "Yaba",
  "Apapa",
  "Ojota",
  "Agege",
  "Oshodi",
  "Ajah",
];

export default function VendorsPage() {
  const [selectedArea, setSelectedArea] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getVendors()
      .then((data) => {
        setVendors(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch vendors");
        setLoading(false);
      });
  }, []);

  const filteredVendors = vendors.filter((vendor) => {
    const matchesArea =
      selectedArea === "All" || vendor.location?.area === selectedArea;
    const matchesSearch = (vendor.display_name || vendor.displayName || "")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesArea && matchesSearch;
  });

  if (loading) return <div className="p-4">Loading vendors...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <main className="">
      <Container className=" bg-white py-4">
        <CustomBreadcrumb />
      </Container>
      <Container className="py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">
            Vendors in Lagos, Nigeria
          </h1>
          <p className="text-gray-600 text-lg">
            Discover trusted local businesses and sellers in your area
          </p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4">
          {/* Area Filter */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-700 px-1">
              Filter by Location
            </h3>
            <div className="relative">
              <div className="flex gap-2 pb-4 overflow-x-auto scrollbar-hide">
                {LAGOS_AREAS.map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedArea(area)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full transition-all duration-200 ease-in-out ${
                      selectedArea === area
                        ? "bg-[#1B6013] text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-[#1B6013]/90 hover:[#1B6013]/90"
                    } flex items-center gap-1.5`}
                  >
                    <MapPinIcon
                      className={`h-4 w-4 ${
                        selectedArea === area ? "text-white" : "text-[#1B6013]"
                      }`}
                    />
                    <span className="whitespace-nowrap">{area}</span>
                  </button>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Input
              placeholder="Search vendors by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-full text-lg shadow-sm focus-visible:ring-green-500 focus-visible:ring-2"
            />
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            {filteredVendors.length} Vendors Found
            {selectedArea !== "All" && ` in ${selectedArea}`}
          </h3>
          <Button variant="outline" className="rounded-full">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Sort By
          </Button>
        </div>

        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <VendorCard key={vendor._id} vendor={vendor} />
          ))}
        </div>

        {/* Empty State */}
        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              No vendors found matching your criteria
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedArea("All");
                setSearchQuery("");
              }}
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </Container>
    </main>
  );
}
