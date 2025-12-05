"use client";

import Image from "next/image";
import Link from "next/link";
import { formatNaira, toSlug } from "src/lib/utils";
import AddToCart from "@components/shared/product/add-to-cart";
import { Tables } from "src/utils/database.types";

interface BundleCardProps {
  bundle: Tables<"bundles">;
  hideDetails?: boolean;
  hideBorder?: boolean;
  hideAddToCart?: boolean;
  className?: string;
}

export default function BundleCard({
  bundle,
  hideDetails = false,
  hideBorder = false,
  hideAddToCart = false,
  className = "",
}: BundleCardProps) {
  const bundleImage = bundle.thumbnail_url || "/placeholder-product.png";
  const bundleSlug = toSlug(bundle.name || "bundle");
  const bundleAddItem = {
    id: bundle.id || bundleSlug,
    name: bundle.name || "Bundle",
    slug: bundleSlug,
    category: "bundle",
    price: bundle.price || 0,
    images: [bundleImage],
    countInStock:
      bundle.stock_status && bundle.stock_status !== "in_stock" ? 0 : null,
    options: [] as any[],
    option: undefined,
    selectedOption: undefined,
    bundleId: bundle.id,
    in_season: null,
    iconOnly: true,
  };

  return (
    <div className="flex flex-col mb-4 md:pb-8 gap-2">
      <Link href={`/bundles/${bundleSlug}`}>
        <div className="relative h-[100px] w-[120px] md:h-[135px] md:w-[160px]">
          <div className="relative w-full h-full bg-[#F2F4F7] overflow-hidden rounded-[8px]">
            <Image
              src={bundleImage}
              alt={bundle.name || "Bundle"}
              fill
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder-product.png";
              }}
            />
          </div>
          {!hideAddToCart && (
            <div className="absolute bottom-1 right-1.5 md:bottom-[4px] md:right-[4px] z-10">
              <AddToCart minimal item={bundleAddItem} />
            </div>
          )}
        </div>
      </Link>
      
      {!hideDetails && (
        <div className="flex flex-col space-y-1 w-[120px] md:w-[160px]">
          <Link
            href={`/bundles/${toSlug(bundle.name || "bundle")}`}
            className="overflow-hidden h4-bold text-ellipsis leading-5 max-w-[10rem]"
          >
            {bundle.name}
          </Link>
          <span className="text-[14px] text-[#1B6013]">
            {formatNaira(bundle.price || 0)}
          </span>
        </div>
      )}
    </div>
  );
}
