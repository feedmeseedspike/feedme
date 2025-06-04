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
  // Create a new URLSearchParams object with existing params
  const searchParams = new URLSearchParams(params);

  // Update or remove parameters
  if (category) searchParams.set("category", category);
  if (tag) searchParams.set("tag", tag);
  if (price) searchParams.set("price", price);
  if (rating) searchParams.set("rating", rating);
  if (sort) searchParams.set("sort", sort);
  if (page) searchParams.set("page", page);

  // Remove parameters if they are "all"
  if (category === "all") searchParams.delete("category");
  if (tag === "all") searchParams.delete("tag");
  if (price === "all") searchParams.delete("price");
  if (rating === "all") searchParams.delete("rating");
  if (sort === "best-selling") searchParams.delete("sort");
  if (page === "1") searchParams.delete("page");

  // For category pages
  if (params.category && params.category !== "all") {
    const categorySlug = category?.toLowerCase().replace(/ /g, "-");
    return `/category/${categorySlug}?${searchParams.toString()}`;
  }

  // For search pages
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
      console.log(`SUCCESS: ${message}`);
      // toast.success(message); // Uncomment if using a toast library
      break;
    case 'error':
      console.error(`ERROR: ${message}`);
      // toast.error(message); // Uncomment if using a toast library
      break;
    case 'info':
      console.info(`INFO: ${message}`);
      // toast.info(message); // Uncomment if using a toast library
      break;
    case 'warning':
      console.warn(`WARNING: ${message}`);
      // toast.warning(message); // Uncomment if using a toast library
      break;
    default:
      console.log(message);
      // toast(message); // Uncomment if using a toast library
  }
}
  