"use client";

import AddToCart from "@components/shared/product/add-to-cart";
import { Tables } from "@utils/database.types";
import { toSlug } from "src/lib/utils";

interface BundleAddToCartButtonProps {
  bundle: Tables<"bundles"> & {
    products?: Tables<"products">[];
  };
}

export default function BundleAddToCartButton({
  bundle,
}: BundleAddToCartButtonProps) {
  if (!bundle) return null;

  const bundleSlug = toSlug(bundle.name || "bundle");
  const bundleImage =
    bundle.thumbnail_url || "/images/placeholder-banner.jpg";
  const isInStock =
    !bundle.stock_status || bundle.stock_status === "in_stock";

  return (
    <AddToCart
      className="w-full"
      item={{
        id: bundle.id,
        bundleId: bundle.id,
        name: bundle.name || "Bundle",
        slug: bundleSlug,
        category: "bundle",
        price: bundle.price || 0,
        images: [bundleImage],
        countInStock: isInStock ? 9999 : 0,
        options: [],
        in_season: null,
        iconOnly: false,
      }}
    />
  );
}