import { NextRequest, NextResponse } from 'next/server'
import { products } from 'src/lib/data'
import { Products } from 'src/lib/validator'

export const GET = async (request: NextRequest) => {
  const listType = request.nextUrl.searchParams.get('type') || 'history'
  const productIdsParam = request.nextUrl.searchParams.get('ids')
  const categoriesParam = request.nextUrl.searchParams.get('categories')

  if (!productIdsParam) {
    return NextResponse.json([])
  }

  const productIds = productIdsParam.split(',')
  const categories = categoriesParam ? categoriesParam.split(',') : []

  console.log('Product IDs:', productIds)
  console.log('Categories:', categories)

  let filteredProducts = []

  if (listType === 'history') {
    // Return only products in browsing history (matching productIds)
    filteredProducts = products.filter((product: any) =>
      productIds.includes(product._id)
    )

    // Preserve the original order
    filteredProducts.sort(
      (a: any, b: any) => productIds.indexOf(a._id) - productIds.indexOf(b._id)
    )
  } else {
    // Return related products from the same categories but exclude history
    filteredProducts = products.filter(
      (product: any) =>
        product.category.some((cat: string) => categories.includes(cat)) && 
        !productIds.includes(product._id)
    )
  }

  return NextResponse.json(filteredProducts)
}
