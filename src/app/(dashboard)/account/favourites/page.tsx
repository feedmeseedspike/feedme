"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
import { RootState } from "src/store";
import {
  fetchFavorites,
  toggleFavorite,
} from "src/store/features/favoritesSlice";
import { useToast } from "src/hooks/useToast";
import { Heart, Loader2 } from "lucide-react";
import { createClient } from "src/utils/supabase/client";
import { Skeleton } from "@components/ui/skeleton";

const FavoritesPage = () => {
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { favorites, isLoading, error } = useSelector(
    (state: RootState) => state.favorites
  );
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Fetch favorites on mount
  useEffect(() => {
    dispatch(fetchFavorites());
  }, [dispatch]);

  // Fetch product details when favorites change
  useEffect(() => {
    const fetchProducts = async () => {
      if (!favorites.length) {
        setProducts([]);
        setIsLoadingProducts(false);
        return;
      }

      setIsLoadingProducts(true);
      try {
        const supabase = createClient();
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .in("id", favorites);

        setProducts(products || []);
      } catch (error) {
        console.error("Error fetching products:", error);
        showToast("Failed to load product details", "error");
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [favorites, showToast]);

  const handleToggleFavorite = async (productId: string) => {
    try {
      await dispatch(toggleFavorite(productId));
    } catch (error: any) {
      if (error.message === "You must be logged in to modify favorites") {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(
          window.location.pathname
        )}`;
      } else {
        showToast(error.message || "Failed to update favorites", "error");
      }
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <p className="text-red-500">Error loading favorites: {error}</p>
      </div>
    );
  }

  return (
    <main>
      <div className="py-6 container mx-auto">
        <h1 className="h2-bold">My Favorites ({products.length})</h1>
        <Separator className="mt-2 mb-8" />

        {isLoading || isLoadingProducts ? (
          <FavoritesLoadingSkeleton />
        ) : products.length > 0 ? (
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
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <button
                        onClick={() => handleToggleFavorite(product.id)}
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
                    <TableCell>{formatDate(product.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Your favorites list is empty</p>
            <a
              href="/products"
              className="text-[#1B6013] hover:underline font-medium"
            >
              Browse products
            </a>
          </div>
        )}
      </div>
    </main>
  );
};

function FavoritesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center space-x-4 p-4 border rounded-lg"
        >
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-[200px]" />
            <Skeleton className="h-4 w-[150px]" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default FavoritesPage;
