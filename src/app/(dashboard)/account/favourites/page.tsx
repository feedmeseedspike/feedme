"use client";
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { Skeleton } from "@components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Badge } from "@components/ui/badge";
import { Separator } from "@components/ui/separator";
import Image from "next/image";
import Link from "next/link";
import { Tables } from "src/utils/database.types";
import {
  getFavoritesQuery,
  useRemoveFavoriteMutation,
} from "src/queries/favorites";
import { formatDate, formatNaira } from "src/lib/utils";
import { useToast } from "src/hooks/useToast";
import {
  Heart,
  Search,
  Filter,
  Grid3X3,
  List,
  ShoppingCart,
  Trash2,
  Package,
  Star,
  Calendar,
  Tag,
  Eye,
  X,
  Menu,
} from "lucide-react";
import { toast } from "sonner";

type FavoriteProductDetails = Tables<"products">;

const FavoritesPage = () => {
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("date-newest");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Use useQuery to fetch favorite product IDs
  const {
    data: favoriteProductIds,
    isLoading: isLoadingFavorites,
    error: favoritesError,
  } = useQuery(getFavoritesQuery());

  // Use a dependent query to fetch product details based on favoriteProductIds
  const {
    data: products,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["favoriteProducts", favoriteProductIds],
    queryFn: async () => {
      if (!favoriteProductIds || favoriteProductIds.length === 0) {
        return [];
      }
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .in("id", favoriteProductIds);

      if (error) throw error;
      return (data || []) as FavoriteProductDetails[];
    },
    enabled: !!favoriteProductIds,
  });

  // Use mutation for removing a favorite
  const removeFavoriteMutation = useRemoveFavoriteMutation();
  const isLoading =
    isLoadingFavorites || isLoadingProducts || removeFavoriteMutation.isPending;
  const error = favoritesError || productsError;

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-newest":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "date-oldest":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "price-low-high":
          return a.price - b.price;
        case "price-high-low":
          return b.price - a.price;
        case "name-a-z":
          return a.name.localeCompare(b.name);
        case "name-z-a":
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy]);

  // Get unique categories
  const categories = useMemo(() => {
    if (!products) return [];
    const uniqueCategories = [
      ...new Set(products.map((product) => product.category)),
    ];
    return uniqueCategories.filter(Boolean);
  }, [products]);

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await removeFavoriteMutation.mutateAsync(productId);
      toast.success("Product removed from favorites");
    } catch (error: any) {
      if (error.message === "You must be logged in to modify favorites") {
        window.location.href = `/login?callbackUrl=${encodeURIComponent(
          window.location.pathname
        )}`;
      } else {
        toast.error(error.message || "Failed to remove from favorites");
      }
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 sm:p-12 text-center">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-red-600 mb-2">
                Error Loading Favorites
              </h3>
              <p className="text-sm sm:text-base text-red-500">
                {error.message || "An unknown error occurred"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Section */}
        <Card className="border-0 shadow-lg bg-[#1B6013]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-white">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 sm:w-8 sm:h-8" />
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    My Favorites
                  </h1>
                  <p className="text-sm sm:text-base text-white/90">
                    Products you love
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-2xl sm:text-3xl font-bold">
                  {filteredAndSortedProducts.length}
                </div>
                <div className="text-sm text-white/90">
                  {filteredAndSortedProducts.length === 1
                    ? "Product"
                    : "Products"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar - Always Visible */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search favorites..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 sm:h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Filters and Controls */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 sm:p-6">
            {/* Mobile Filter Toggle */}
            <div className="flex items-center justify-between mb-4 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                Filters
              </Button>

              {/* View Mode Toggle - Mobile */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`px-2 ${
                    viewMode === "grid" ? "bg-[#1B6013] hover:bg-green-700" : ""
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`px-2 ${
                    viewMode === "list" ? "bg-[#1B6013] hover:bg-green-700" : ""
                  }`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden sm:flex flex-wrap gap-3 items-center justify-between">
              <div className="flex flex-wrap gap-3 items-center">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-600" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1B6013] focus:ring-[#1B6013]/20 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1B6013] focus:ring-[#1B6013]/20 text-sm"
                >
                  <option value="date-newest">Date: Newest first</option>
                  <option value="date-oldest">Date: Oldest first</option>
                  <option value="price-low-high">Price: Low to High</option>
                  <option value="price-high-low">Price: High to Low</option>
                  <option value="name-a-z">Name: A to Z</option>
                  <option value="name-z-a">Name: Z to A</option>
                </select>
              </div>

              {/* View Mode Toggle - Desktop */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={
                    viewMode === "grid" ? "bg-[#1B6013] hover:bg-green-700" : ""
                  }
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={
                    viewMode === "list" ? "bg-[#1B6013] hover:bg-green-700" : ""
                  }
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Filters - Collapsible */}
            {showFilters && (
              <div className="sm:hidden space-y-3 mt-4 pt-4 border-t border-gray-200">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1B6013] focus:ring-[#1B6013]/20 text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:border-[#1B6013] focus:ring-[#1B6013]/20 text-sm"
                  >
                    <option value="date-newest">Date: Newest first</option>
                    <option value="date-oldest">Date: Oldest first</option>
                    <option value="price-low-high">Price: Low to High</option>
                    <option value="price-high-low">Price: High to Low</option>
                    <option value="name-a-z">Name: A to Z</option>
                    <option value="name-z-a">Name: Z to A</option>
                  </select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <FavoritesLoadingSkeleton viewMode={viewMode} />
        ) : filteredAndSortedProducts.length > 0 ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4"
                : "space-y-3 sm:space-y-4"
            }
          >
            {filteredAndSortedProducts.map((product) =>
              viewMode === "grid" ? (
                <ProductGridCard
                  key={product.id}
                  product={product}
                  onRemove={handleRemoveFavorite}
                  isRemoving={removeFavoriteMutation.isPending}
                />
              ) : (
                <ProductListCard
                  key={product.id}
                  product={product}
                  onRemove={handleRemoveFavorite}
                  isRemoving={removeFavoriteMutation.isPending}
                />
              )
            )}
          </div>
        ) : (
          <EmptyFavoritesState />
        )}
      </div>
    </div>
  );
};

// Product Grid Card Component
const ProductGridCard = ({
  product,
  onRemove,
  isRemoving,
}: {
  product: FavoriteProductDetails;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
    <div className="relative">
      <div className="aspect-square relative overflow-hidden rounded-t-lg">
        <img
          src={product.images?.[0] || "/placeholder-product.jpg"}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(product.id)}
            disabled={isRemoving}
            className="bg-white/90 hover:bg-white text-red-500 hover:text-red-600 rounded-full p-1.5 h-auto w-auto"
          >
            {isRemoving ? (
              <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="w-3 h-3" />
            )}
          </Button>
        </div>
        {product.stockStatus === "Out of Stock" && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>
    </div>

    <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
      <div>
        <h3 className="font-semibold text-sm sm:text-base text-gray-800 line-clamp-2 group-hover:text-[#1B6013] transition-colors">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs sm:text-sm text-gray-500 truncate">
            {product.brand}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
          <span className="text-xs sm:text-sm font-medium">
            {product.avgRating || 0}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          ({product.numReviews || 0})
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm sm:text-lg font-bold text-[#1B6013]">
          {formatNaira(product.price)}
        </div>
        <Badge
          variant={
            product.stockStatus === "In Stock" ? "default" : "destructive"
          }
          className="text-xs"
        >
          {product.stockStatus}
        </Badge>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <Link href={`/product/${product.slug}`} className="flex-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs sm:text-sm h-8 sm:h-9"
          >
            <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            View
          </Button>
        </Link>
        <Button
          size="sm"
          className="flex-1 bg-[#1B6013] hover:bg-green-700 text-xs sm:text-sm h-8 sm:h-9"
          disabled={product.stockStatus === "Out of Stock"}
        >
          <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
          <span className="hidden sm:inline">Add to Cart</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="text-xs text-gray-500 flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        <span className="truncate">Added {formatDate(product.created_at)}</span>
      </div>
    </CardContent>
  </Card>
);

// Product List Card Component
const ProductListCard = ({
  product,
  onRemove,
  isRemoving,
}: {
  product: FavoriteProductDetails;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) => (
  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
    <CardContent className="p-3 sm:p-4 md:p-6">
      <div className="flex gap-3 sm:gap-4 md:gap-6">
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={product.images?.[0] || "/placeholder-product.jpg"}
            alt={product.name}
            fill
            className="object-cover"
          />
          {product.stockStatus === "Out of Stock" && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-xs">
                Out of Stock
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-gray-800 hover:text-[#1B6013] transition-colors line-clamp-2">
                {product.name}
              </h3>
              {product.brand && (
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {product.brand}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(product.id)}
              disabled={isRemoving}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 p-1 h-auto w-auto flex-shrink-0"
            >
              {isRemoving ? (
                <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm font-medium">
                {product.avgRating || 0}
              </span>
              <span className="text-xs text-gray-500">
                ({product.numReviews || 0})
              </span>
            </div>
            <Badge
              variant={
                product.stockStatus === "In Stock" ? "default" : "destructive"
              }
              className="text-xs"
            >
              {product.stockStatus}
            </Badge>
            {product.category && (
              <Badge
                variant="outline"
                className="flex items-center gap-1 text-xs"
              >
                <Tag className="w-2 h-2 sm:w-3 sm:h-3" />
                <span className="truncate max-w-20 sm:max-w-none">
                  {product.category}
                </span>
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="text-lg sm:text-xl font-bold text-[#1B6013]">
              {formatNaira(product.price)}
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link
                href={`/product/${product.slug}`}
                className="flex-1 sm:flex-none"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">View Product</span>
                  <span className="sm:hidden">View</span>
                </Button>
              </Link>
              <Button
                size="sm"
                className="flex-1 sm:flex-none bg-[#1B6013] hover:bg-green-700 text-xs sm:text-sm"
                disabled={product.stockStatus === "Out of Stock"}
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="truncate">
              Added on {formatDate(product.created_at)}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty State Component
const EmptyFavoritesState = () => (
  <Card className="border-0 shadow-lg">
    <CardContent className="p-6 sm:p-12 text-center">
      <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
        No Favorites Yet
      </h3>
      <p className="text-sm sm:text-base text-gray-500 mb-6">
        Start adding products to your favorites to see them here
      </p>
      <Link href="/">
        <Button className="bg-[#1B6013] hover:bg-green-700">
          <Package className="w-4 h-4 mr-2" />
          Browse Products
        </Button>
      </Link>
    </CardContent>
  </Card>
);

// Loading Skeleton Component
function FavoritesLoadingSkeleton({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
          : "space-y-3 sm:space-y-4"
      }
    >
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="border-0 shadow-lg">
          <CardContent
            className={
              viewMode === "grid"
                ? "p-3 sm:p-4 space-y-2 sm:space-y-3"
                : "p-3 sm:p-4 md:p-6"
            }
          >
            {viewMode === "grid" ? (
              <>
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 sm:h-4 w-1/2" />
                <div className="flex justify-between">
                  <Skeleton className="h-5 sm:h-6 w-16" />
                  <Skeleton className="h-5 sm:h-6 w-20" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </>
            ) : (
              <div className="flex gap-3 sm:gap-4 md:gap-6">
                <Skeleton className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg" />
                <div className="flex-1 space-y-1 sm:space-y-2">
                  <Skeleton className="h-4 sm:h-5 w-3/4" />
                  <Skeleton className="h-3 sm:h-4 w-1/2" />
                  <div className="flex gap-2 sm:gap-4">
                    <Skeleton className="h-3 sm:h-4 w-16" />
                    <Skeleton className="h-3 sm:h-4 w-20" />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-between gap-2">
                    <Skeleton className="h-5 sm:h-6 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-20 sm:w-24" />
                      <Skeleton className="h-8 w-20 sm:w-28" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default FavoritesPage;
