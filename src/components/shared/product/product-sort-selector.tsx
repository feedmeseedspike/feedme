'use client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select'
import { getFilterUrl } from '../../../lib/utils'
import { useRouter, usePathname } from 'next/navigation'
import React from 'react'

export default function ProductSortSelector({
  sortOrders,
  sort,
  params,
}: {
  sortOrders: { value: string; name: string }[]
  sort: string
  params: {
    q?: string
    category?: string
    tag?: string
    price?: string
    rating?: string
    sort?: string
    page?: string
    season?: string
  }
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleSortChange = (value: string) => {
    // Create new params object without undefined values
    const newParams = {
      ...params,
      sort: value,
      page: '1' // Reset to first page when changing sort
    }
    
    // Remove undefined values
    Object.keys(newParams).forEach(key => {
      if (newParams[key as keyof typeof newParams] === undefined) {
        delete newParams[key as keyof typeof newParams]
      }
    })

    // For tag pages
    if (pathname?.startsWith('/')) {
      const queryString = new URLSearchParams(newParams as Record<string, string>).toString()
      router.push(`${pathname}?${queryString}`)
      return
    }

    // For other pages use the existing getFilterUrl
    router.push(getFilterUrl({ 
      params: newParams, 
      category: newParams.category,
      tag: newParams.tag,
      price: newParams.price,
      rating: newParams.rating,
      sort: value,
      page: newParams.page,
      season: newParams.season
    }))
  }

  return (
    <Select
      onValueChange={handleSortChange}
      value={sort}
    >
      <SelectTrigger className='border px-3 rounded-md'>
        <SelectValue>
          Sort By: {sortOrders.find((s) => s.value === sort)?.name || 'Best Selling'}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        {sortOrders.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            {s.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}