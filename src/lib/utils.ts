import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import qs from 'query-string'
import { OptionType } from "./validator";
import { IProductInput } from "../types";
import { Tables } from "../utils/database.types";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import Link from "next/link";
import { Badge } from "@components/ui/badge";
import { useToast } from "src/hooks/useToast";
import { useMemo, useCallback } from "react";
import {
  useCartQuery,
  useUpdateCartMutation,
  useRemoveFromCartMutation,
  ItemToUpdateMutation,
} from "src/queries/cart";
import { CartItem } from "src/lib/actions/cart.actions";
import { useUser } from "src/hooks/useUser";
import {
  getUsersPurchasedProductIds,
  getAllProducts,
} from "src/queries/products";
import { createClient } from "@utils/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ProductSlider from "@components/shared/product/product-slider";

export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string
  key: string
  value: string | null
}) {
  const currentUrl = qs.parse(params)

  currentUrl[key] = value

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/&/g, '') // Remove & specifically first
    .replace(/[^\w\s-]+/g, '') // Remove other special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single

export function formatNaira(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "N/A"; // Or "0", depending on desired behavior for invalid input
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

export const generateId = () =>
  Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)).join('')

export const getFilterUrl = ({
  category,
  tag,
  price,
  rating,
  sort,
  page,
  season,
  params,
}: {
  category?: string;
  tag?: string;
  price?: string;
  rating?: string;
  sort?: string;
  page?: string;  
  season?: string;
  params: any;
}) => {
  // Create a new URLSearchParams object
  const searchParams = new URLSearchParams();

  // Only add non-default parameters
  const q = params.q || "";
  if (q && q !== "" && q !== "all") {
    searchParams.set("q", q);
  }

  if (category && category !== "all") {
    searchParams.set("category", category);
  }

  if (tag && tag !== "all") {
    searchParams.set("tag", tag);
  }

  if (price && price !== "all") {
    searchParams.set("price", price);
  }

  if (rating && rating !== "all") {
    searchParams.set("rating", rating);
  }

  // Only add sort if it's not the default
  if (sort && sort !== "price-low-to-high") {
    searchParams.set("sort", sort);
  }

  // Only add page if it's not page 1
  if (page && page !== "1") {
    searchParams.set("page", page);
  }

  // Only add season if it's not the default
  if (season && season !== "all") {
    searchParams.set("season", season);
  }

  const queryString = searchParams.toString();

  // For category pages
  if (category && category !== "all") {
    const categorySlug = category.toLowerCase().replace(/ /g, "-");
    return queryString ? `/category/${categorySlug}?${queryString}` : `/category/${categorySlug}`;
  }

  // For search pages
  return queryString ? `/search?${queryString}` : `/search`;
};

export const formatError = (error: any): string => {
  if (error.name === 'ZodError') {
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const errorMessage = error.errors[field].message
      return `${error.errors[field].path}: ${errorMessage}` // field: errorMessage
    })
    return fieldErrors.join('. ')
  } else if (error.name === 'ValidationError') {
    const fieldErrors = Object.keys(error.errors).map((field) => {
      const errorMessage = error.errors[field].message
      return errorMessage
    })
    return fieldErrors.join('. ')
  } else if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue)[0]
    return `${duplicateField} already exists`
  } else {
    // return 'Something went wrong. please try again'
    return typeof error.message === 'string'
      ? error.message
      : JSON.stringify(error.message)
  }
}

export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
};

export function generateClientId(item: {
  product: string;       
  option?: string | null; 
  price: number;        
}): string {
  // Create a stable hash from the item's unique properties
  const optionKey = item.option 
    ? encodeURIComponent(item.option.toLowerCase().trim())
    : 'base';
  
  // Round price to avoid floating point issues
  const priceKey = Math.round(item.price * 100); // handles decimals
  
  // Combine all components with separators
  return `${item.product}::${optionKey}::${priceKey}`;
}

export function showToast(message: string, type: 'success' | 'error' | 'info' | 'warning') {
  // Assuming toast from 'sonner' or similar library is available globally or handled by context
  // For now, we can just console log or use a basic alert if no toast library is set up
  switch (type) {
    case 'success':
      // toast.success(message); // Uncomment if using a toast library
      break;
    case 'error':
      // toast.error(message); // Uncomment if using a toast library
      break;
    case 'info':
      // toast.info(message); // Uncomment if using a toast library
      break;
    case 'warning':
      // toast.warning(message); // Uncomment if using a toast library
      break;
    default:
      // toast(message); // Uncomment if using a toast library
  }
}

export interface CategoryData {
  id: string;
  title: string;
  thumbnail: { url: string; public_id?: string } | null;
}

export const mapSupabaseProductToIProductInput = (
  supabaseProduct: Tables<'products'>,
  allCategories: CategoryData[]
): IProductInput => {
  // Ensure category is an array of IDs, as expected by the filter
  const categories = (supabaseProduct.category_ids || []) as string[];

  return {
    id: supabaseProduct.id || '',
    name: supabaseProduct.name || '',
    slug: supabaseProduct.slug || '',
    description: supabaseProduct.description || '',
    price: supabaseProduct.price || 0,
    list_price: supabaseProduct.list_price || 0,
    brand: supabaseProduct.brand || '',
    avg_rating: supabaseProduct.avg_rating || 0,
    num_reviews: supabaseProduct.num_reviews || 0,
    numSales: supabaseProduct.num_sales || 0,
    countInStock: supabaseProduct.count_in_stock || 0,
    is_published: supabaseProduct.is_published || false,
    category: categories, // Now contains IDs
    tags: supabaseProduct.tags || [],
    images: Array.isArray(supabaseProduct.images)
      ? supabaseProduct.images.filter((img): img is string => typeof img === 'string' && !!img)
      : [],
    options: Array.isArray(supabaseProduct.options)
      ? (supabaseProduct.options as any[]).filter((opt) => opt && typeof opt === 'object' && 'name' in opt && 'price' in opt)
      : [],
    ratingDistribution: (supabaseProduct.rating_distribution as { rating: number; count: number }[] || []),
    stockStatus: supabaseProduct.stock_status || 'In Stock',
    vendor: undefined,
    reviews: [],
    colors: [],
    in_season: supabaseProduct.in_season ?? null,
  };
};

export const mapSupabaseBundleToIProductInput = (
  supabaseBundle: Tables<'bundles'>
): IProductInput => {
  return {
    id: supabaseBundle.id || '',
    name: supabaseBundle.name || '',
    slug: supabaseBundle.name?.toLowerCase().replace(/ /g, '-') || '', // Assuming slug can be derived from name
    description: "", // Bundles do not have a direct description field in your DB schema, providing a default empty string.
    price: supabaseBundle.price || 0,
    list_price: supabaseBundle.price || 0, // Assuming list_price is same as price for bundles
    brand: '', // Bundles might not have a brand, or you can set a default
    avg_rating: 0, // Bundles might not have direct ratings
    num_reviews: 0, // Bundles might not have direct reviews
    numSales: 0, // Bundles might not have direct sales count
    countInStock: supabaseBundle.stock_status === 'in_stock' ? 9999 : 0, // Derive countInStock from stock_status, assuming a large number if in stock
    is_published: supabaseBundle.published_status === 'published',
    category: [], // Bundles might not have categories directly
    tags: [], // Bundles might not have tags directly
    images: supabaseBundle.thumbnail_url ? [supabaseBundle.thumbnail_url] : [], // Use thumbnail as main image
    options: [], // Bundles typically don't have options like products
    ratingDistribution: [],
    stockStatus: supabaseBundle.stock_status || 'In Stock',
    vendor: undefined,
    reviews: [],
    colors: [],
    in_season: null, // Default bundles to null (no badge)
    bundleId: supabaseBundle.id, // Crucially, set the bundleId here
  };
};
  