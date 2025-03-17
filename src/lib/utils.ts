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
    params,
    category,
    tag,
    sort,
    price,
    rating,
    page,
  }: {
    params: {
      q?: string
      category?: string
      tag?: string
      price?: string
      rating?: string
      sort?: string
      page?: string
    }
    tag?: string
    category?: string
    sort?: string
    price?: string
    rating?: string
    page?: string
  }) => {
    const newParams = { ...params }
    if (category) newParams.category = category
    if (tag) newParams.tag = toSlug(tag)
    if (price) newParams.price = price
    if (rating) newParams.rating = rating
    if (page) newParams.page = page
    if (sort) newParams.sort = sort
    return `/search?${new URLSearchParams(newParams).toString()}`
  }

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
  
  
  