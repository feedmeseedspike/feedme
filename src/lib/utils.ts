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