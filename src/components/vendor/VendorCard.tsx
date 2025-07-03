/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Badge } from "../ui/badge";
import { StarIcon, ShoppingBagIcon, MapPinIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { VendorType } from "src/lib/validator";

export default function VendorCard({ vendor }: { vendor: any }) {
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex items-start gap-4">
        {/* Vendor Logo */}
        <div className="w-16 h-16 rounded-lg border overflow-hidden">
          <img
            src={vendor.logo}
            alt={vendor.displayName}
            
            className="w-full h-full object-cover"
          />
        </div>

        {/* Vendor Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">
              <Link href={`/vendors/${vendor._id}`} className="hover:underline">
                {vendor.displayName}
              </Link>
            </h3>
            {vendor.isVerified && (
              <Badge className="px-2 py-1 text-xs bg-[#1B6013]">Verified</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
            <StarIcon className="h-4 w-4 text-yellow-400" />
            <span>{vendor.rating} ({vendor.numReviews})</span>
            <span className="mx-1">•</span>
            <ShoppingBagIcon className="h-4 w-4" />
            <span>{vendor.numProducts} products</span>
          </div>

          <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
            <MapPinIcon className="h-4 w-4" />
            <span>{vendor.location.area}, Lagos</span>
          </div>
        </div>
      </div>

      <p className="text-gray-600 text-sm mt-4 line-clamp-3">
        {vendor.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {/* {vendor.categories.slice(0, 3).map(category => (
          <Badge key={category} variant="outline" className="text-xs">
            {category}
          </Badge>
        ))} */}
      </div>
    </div>
  );
}