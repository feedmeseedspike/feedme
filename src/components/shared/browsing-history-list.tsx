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
      <div className="pt-6">
        {/* <Separator className={cn('mb-4', className)} /> */}
        <ProductList title="Related to items that you've viewed" type="related" />
        {/* <Separator className="mb-4" /> */}
        <div className="pt-6"></div>
        <ProductList title="Your browsing history" hideDetails type="history" />
      </div>
    )
  )
}

function ProductList({
  title,
  type = 'history',
  hideDetails = false,
  excludeId = '',
}: {
  title: string
  type: 'history' | 'related'
  excludeId?: string
  hideDetails?: boolean
}) {
  const products = useSelector((state: RootState) => state.browsingHistory.products)
  console.log(products)
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
        console.log(result)

        setData(result)
      } catch (error) {
        console.error('Failed to fetch browsing history:', error)
      }
    }
    fetchProducts()
  }, [excludeId, products, type])
  console.log(data)


  return data.length > 0 ? <ProductSlider title={title} products={data} hideDetails={hideDetails} /> : null
}
