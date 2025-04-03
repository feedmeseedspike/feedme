'use client'

import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import ProductSlider from './product/product-slider'
import { Separator } from '../ui/separator'
import { RootState } from 'src/store'
import { cn } from 'src/lib/utils'

export default function BrowsingHistoryList({ className }: { className?: string }) {
  const products = useSelector((state: RootState) => state.browsingHistory.products)

  return (
    products.length > 0 && (
      <>
        {/* Related Products Section */}
        <div className={cn('bg-white rounded-[8px] p-4 mb-4', className)}>
          <ProductList 
            title="Related to items you've viewed" 
            type="related" 
            href="/recommended"
          />
        </div>
        
        {/* Browsing History Section */}
        <div className={cn('bg-white rounded-[8px] p-4', className)}>
          <ProductList 
            title="Your browsing history" 
            type="history" 
            hideDetails 
            href="/browsing-history"
          />
        </div>
      </>
    )
  )
}

function ProductList({
  title,
  type = 'history',
  hideDetails = false,
  excludeId = '',
  href,
}: {
  title: string
  type: 'history' | 'related'
  excludeId?: string
  hideDetails?: boolean
  href?: string
}) {
  const products = useSelector((state: RootState) => state.browsingHistory.products)
  const [data, setData] = useState([])

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch(
          `/api/products/browsing-history?type=${type}&excludeId=${excludeId}&categories=${products
            .map((product) => product.category)
            .join(',')}&ids=${products.map((product) => product.id).join(',')}`
        )
        const result = await res.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch browsing history:', error)
      }
    }
    fetchProducts()
  }, [excludeId, products, type])

  return data.length > 0 ? (
    <ProductSlider 
      title={title} 
      products={data} 
      hideDetails={hideDetails}
      href={href}
    />
  ) : null
}
