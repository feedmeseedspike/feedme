import { NextRequest, NextResponse } from 'next/server'
import { products } from 'src/lib/data'

export const GET = async (request: NextRequest) => {
  const listType = request.nextUrl.searchParams.get('type') || 'history'
  const productIdsParam = request.nextUrl.searchParams.get('ids')
  const categoriesParam = request.nextUrl.searchParams.get('categories')

  if (!productIdsParam || !categoriesParam) {
    return NextResponse.json([])
  }

  const productIds = productIdsParam.split(',')
  const categories = categoriesParam.split(',')

  let filteredProducts = []

  if (listType === 'history') {
    // Return only products in browsing history (matching productIds)
    filteredProducts = products.filter((product) =>
      productIds.includes(product._id)
    )

    // Preserve the original order
    filteredProducts.sort(
      (a, b) => productIds.indexOf(a._id) - productIds.indexOf(b._id)
    )
  } else {
    // Return related products from the same categories but exclude history
    filteredProducts = products.filter(
      (product) =>
        categories.includes(product.category) && !productIds.includes(product._id)
    )
  }

  return NextResponse.json(filteredProducts)
}
