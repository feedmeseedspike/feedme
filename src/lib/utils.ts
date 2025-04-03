import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

import qs from 'query-string'

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
    .replace(/[^\w\s-]+/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')

    export function formatNaira(amount: number): string {
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
      params,
    }: {
      category?: string;
      tag?: string;
      price?: string;
      rating?: string;
      sort?: string;
      page?: string;
      params: any;
    }) => {
      const { q = "all" } = params;
    
      if (typeof window === "undefined") {
        return "/search";
      }
    
      // Check if we're on a tag page
      const isTagPage = window.location.pathname.startsWith('/');
    
      // Create a new URLSearchParams object
      const searchParams = new URLSearchParams();
    
      // Add all the filter parameters
      if (tag && tag !== "all") searchParams.set("tag", tag);
      if (price && price !== "all") searchParams.set("price", price);
      if (rating && rating !== "all") searchParams.set("rating", rating);
      if (sort && sort !== "best-selling") searchParams.set("sort", sort);
      if (page && page !== "1") searchParams.set("page", page);
    
      // For tag pages
      if (isTagPage) {
        const currentPath = window.location.pathname;
        return `${currentPath}?${searchParams.toString()}`;
      }
    
      // For category pages
      const isCategoryPage = params.category && params.category !== "all";
      if (isCategoryPage) {
        const categorySlug = category?.toLowerCase().replace(/ /g, "-");
        return `/category/${categorySlug}?${searchParams.toString()}`;
      }
    
      // For search pages
      if (category && category !== "all") searchParams.set("category", category);
      if (q && q !== "all") searchParams.set("q", q);
    
      return `/search?${searchParams.toString()}`;
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
  
  
  