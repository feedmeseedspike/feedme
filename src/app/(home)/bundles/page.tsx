"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBundles } from "src/queries/bundles";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { formatNaira } from "src/lib/utils";

export default function BundlesPage() {
  const {
    data: bundles,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetchBundles({}), // Fetch all bundles initially
  });

  if (isLoading) {
    return <div className="container mx-auto p-4">Loading bundles...</div>;
  }

  if (error) {
    console.error("Error fetching bundles:", error);
    return (
      <div className="container mx-auto p-4 text-red-500">
        Error loading bundles.
      </div>
    );
  }

  if (!bundles || bundles.data?.length === 0) {
    return (
      <div className="container mx-auto p-4">
        No bundles available at the moment.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Our Bundles</h1>
      {bundles && bundles.data && bundles.data.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bundles.data.map((bundle) => (
            <Card key={bundle.id}>
              <Link href={`/bundles/${bundle.id}`} passHref>
                <CardHeader>
                  {bundle.thumbnail_url && (
                    <div className="relative w-full h-48">
                      <Image
                        src={bundle.thumbnail_url}
                        alt={bundle.name || "Bundle image"}
                        fill
                        style={{ objectFit: "cover" }}
                        className="rounded-t-md"
                      />
                    </div>
                  )}
                  {!bundle.thumbnail_url && (
                    <div className="w-full h-48 bg-gray-200 rounded-t-md flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  <CardTitle className="text-lg font-semibold truncate">
                    {bundle.name}
                  </CardTitle>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex flex-col items-start">
                  <div className="text-xl font-bold text-primary">
                    {formatNaira(bundle.price || 0)}
                  </div>
                  {bundle.discount_percentage !== null &&
                    bundle.discount_percentage !== undefined && (
                      <span className="text-sm text-green-600">
                        {bundle.discount_percentage}% Discount
                      </span>
                    )}
                </CardFooter>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
