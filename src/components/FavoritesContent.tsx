"use client";

import { useEffect, useState } from "react";
import { formatDate, formatNaira } from "src/lib/utils";
import { Separator } from "@components/ui/separator";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { useToast } from "src/hooks/useToast";
import { Heart, Loader2 } from "lucide-react";
import { createClient } from "@utils/supabase/client";
import { Skeleton } from "@components/ui/skeleton";

// Import Tanstack Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getFavoritesQuery,
  useRemoveFavoriteMutation,
} from "src/queries/favorites";
import { Tables } from "src/utils/database.types";

// Define a type for the product details based on your database schema
type FavoriteProductDetails = Tables<"products">; // Assuming 'products' table schema

interface FavoritesContentProps {
  initialFavorites: FavoriteProductDetails[];
}

const FavoritesContent: React.FC<FavoritesContentProps> = ({
  initialFavorites,
}) => {
  const { showToast } = useToast();

  // We will now manage the state and mutations here.
  // The initial data comes from the server component.
  // We still need the mutation hooks for client-side interaction.

  // Use mutation for removing a favorite directly from the list
  const removeFavoriteMutation = useRemoveFavoriteMutation();

  // We can potentially manage the list state locally for immediate optimistic updates
  const [favoriteProducts, setFavoriteProducts] =
    useState<FavoriteProductDetails[]>(initialFavorites);

  // Update local state when initial data changes (e.g., on navigation or re-render)
  useEffect(() => {
    setFavoriteProducts(initialFavorites);
  }, [initialFavorites]);

  const handleRemoveFavorite = async (productId: string) => {
    const previousProducts = favoriteProducts;

    // Optimistic update
    setFavoriteProducts(favoriteProducts.filter((p) => p.id !== productId));

    try {
      await removeFavoriteMutation.mutateAsync(productId, {
        onSuccess: () => {
          showToast("Product removed from favorites", "info");
        },
        onError: (error) => {
          console.error("Failed to remove favorite:", error);
          // Rollback on error
          setFavoriteProducts(previousProducts);
          if (
            (error as any).message ===
            "You must be logged in to modify favorites"
          ) {
            window.location.href = `/login?callbackUrl=${encodeURIComponent(
              window.location.pathname
            )}`;
          } else {
            showToast(
              (error as any).message || "Failed to remove from favorites",
              "error"
            );
          }
        },
      });
    } catch (error) {
      // This catch might be redundant due to onError in mutateAsync options, but good for safety
      console.error("Caught error during removeFavoriteMutation:", error);
    }
  };

  const isLoading = removeFavoriteMutation.isPending; // Only track mutation loading here

  // No explicit error display needed here if mutation onError handles toast
  // The initial fetch error is handled by the server component.

  return (
    <>
      <Separator className="mt-2 mb-8" />
      {isLoading ? (
        <FavoritesLoadingSkeleton />
      ) : favoriteProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[600px]">
            <TableHeader className="bg-white px-6 py-4 text-black">
              <TableRow>
                <TableHead className="rounded-l-lg"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="rounded-r-lg text-center">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {favoriteProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <button
                      onClick={() => handleRemoveFavorite(product.id)}
                      disabled={isLoading}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Remove from favorites"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell>
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        width={80}
                        height={80}
                        alt={product.name || "Product image"}
                        className="rounded-md object-cover aspect-square"
                        priority
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {product.slug ? (
                      <a
                        href={`/products/${product.slug}`}
                        className="hover:underline"
                      >
                        {product.name || "Unknown product"}
                      </a>
                    ) : (
                      <span>{product.name || "Unknown product"}</span>
                    )}
                  </TableCell>
                  <TableCell>{product.brand || "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {product.price ? formatNaira(product.price) : "N/A"}
                      </span>
                      {product.list_price && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatNaira(product.list_price)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        product.stock_status === "in_stock"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {product.stock_status || "unknown"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.created_at ? formatDate(product.created_at) : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : favoriteProducts.length === 0 && !isLoading ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Your favorites list is empty</p>
          <a
            href="/products"
            className="text-[#1B6013] hover:underline font-medium"
          >
            Browse products
          </a>
        </div>
      ) : null}{" "}
    </>
  );
};

function FavoritesLoadingSkeleton() {
  // Skeleton component (you can customize this further)
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default FavoritesContent;
