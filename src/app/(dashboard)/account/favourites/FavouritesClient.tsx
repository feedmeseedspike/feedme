"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Trash2Icon, Heart } from "lucide-react";
import { formatNaira } from "src/lib/utils";
import Link from "next/link";
import { useToast } from "src/hooks/useToast";
import Container from "@components/shared/Container";
import CustomBreadcrumb from "@components/shared/breadcrumb";

interface FavouritesClientProps {
  user: any;
  favorites: any[];
  favoriteProducts: any[];
}

const FavouritesClient: React.FC<FavouritesClientProps> = ({
  user,
  favorites,
  favoriteProducts,
}) => {
  const { showToast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>(favoriteProducts);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    setProducts(favoriteProducts);
  }, [favoriteProducts]);

  const handleRemoveFavorite = async (productId: string) => {
    try {
      setRemovingId(productId);

      const { removeFromFavorite } = await import(
        "src/lib/actions/favourite.actions"
      );
      const result = await removeFromFavorite(productId);

      if (!result.success) {
        throw new Error(result.error);
      }

      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setRemovingId(null);
      showToast("Product removed from favorites", "success");
    } catch (error: any) {
      setRemovingId(null);
      showToast(error.message || "Failed to remove from favorites", "error");
    }
  };

  const getProductPrice = (product: any) => {
    if (
      product.options &&
      Array.isArray(product.options) &&
      product.options.length > 0
    ) {
      const prices = product.options
        .filter((option: any) => option.price && option.price > 0)
        .map((option: any) => option.price);

      if (prices.length > 0) {
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return minPrice === maxPrice
          ? minPrice
          : `${formatNaira(minPrice)} - ${formatNaira(maxPrice)}`;
      }
    }

    return product.price || product.list_price || 0;
  };

  return (
    <>
      {/* <div className="bg-white py-4 shadow-sm border-b border-gray-100">
        <Container>
          <CustomBreadcrumb />
        </Container>
      </div> */}

      <div className="min-h-screen bg-gray-50">
        <Container className="py-6">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Heart className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold text-primary mb-2">
                No favorites yet
              </h2>
              <p className="text-muted-foreground mb-8">
                Start adding products you love to your favorites!
              </p>
              <Link href="/">
                <Button className="bg-[#1B6013] text-primary-foreground px-8 py-3 rounded-xl shadow-lg hover:bg-[#1B6013]/90 font-semibold">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    My Favorites
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {products.length} {products.length === 1 ? "item" : "items"}{" "}
                    saved
                  </p>
                </div>
              </div>

              {/* Desktop Table (hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap flex items-center gap-4">
                          <button
                            className="text-gray-400 hover:text-red-500 focus:outline-none mr-2"
                            onClick={() => handleRemoveFavorite(product.id)}
                            disabled={removingId === product.id}
                            aria-label="Remove from favorites"
                          >
                            {removingId === product.id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2Icon className="w-4 h-4" />
                            )}
                          </button>
                          <Link href={`/product/${product.slug}`}>
                            <Image
                              width={60}
                              height={60}
                              src={product.images?.[0] || "/product-placeholder.png"}
                              alt={product.name}
                              className="h-14 w-14 rounded border border-gray-200"
                            />
                          </Link>
                          <div>
                            <div className="font-semibold text-gray-900 text-sm">
                              {product.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                          {typeof getProductPrice(product) === "string"
                            ? getProductPrice(product)
                            : formatNaira(getProductPrice(product))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link href={`/product/${product.slug}`}>
                            <Button
                              size="sm"
                              className="bg-[#1B6013] hover:bg-[#1B6013]/90 text-white"
                            >
                              View Product
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Favorites Items (shown only on mobile) */}
              <div className="md:hidden space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start gap-3">
                        <Link
                          href={`/product/${product.slug}`}
                          className="shrink-0"
                        >
                          <Image
                            width={80}
                            height={80}
                            src={product.images?.[0] || "/product-placeholder.png"}
                            alt={product.name}
                            className="h-16 w-16 rounded border border-gray-200"
                          />
                        </Link>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {typeof getProductPrice(product) === "string"
                              ? getProductPrice(product)
                              : formatNaira(getProductPrice(product))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(product.id)}
                        disabled={removingId === product.id}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove from favorites"
                      >
                        {removingId === product.id ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2Icon className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <Link href={`/product/${product.slug}`}>
                        <Button
                          size="sm"
                          className="bg-[#1B6013] hover:bg-[#1B6013]/90 text-white"
                        >
                          View Product
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Container>
      </div>
    </>
  );
};

export default FavouritesClient;
