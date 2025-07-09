export const dynamic = "force-dynamic";
import EditProductClient from "./EditProductClient";
import { getProductById, getAllCategories } from "src/queries/products";
import { notFound } from "next/navigation";

function normalizeProduct(product: any) {
  // Robustly handle options: array, stringified array, or fallback
  let options = [];
  if (Array.isArray(product.options)) {
    options = product.options;
  } else if (
    typeof product.options === "string" &&
    product.options.trim().startsWith("[")
  ) {
    try {
      options = JSON.parse(product.options);
    } catch (e) {
      options = [];
    }
  }
  // Ensure images is always an array of strings
  let images = [];
  if (Array.isArray(product.images)) {
    images = product.images.filter(Boolean);
  } else if (typeof product.images === "string" && product.images) {
    images = [product.images];
  }
  // Ensure stock_status is a string or null
  let stock_status = product.stock_status || null;
  return {
    ...product,
    options,
    images,
    stock_status,
  };
}

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const productId = params.id;
  let product = null;
  let allCategories = [];
  try {
    product = await getProductById(productId);
    allCategories = await getAllCategories();
    if (!product) {
      console.error(`[EditProductPage] Product not found for id: ${productId}`);
      return notFound();
    }
  } catch (error) {
    console.error(
      `[EditProductPage] Error fetching product or categories for id: ${productId}`,
      error
    );
    return notFound();
  }
  // Normalize product data for the client
  const normalizedProduct = normalizeProduct(product);
  // Debug log for options
  console.log(
    "[DEBUG] Product options after fetch:",
    normalizedProduct
  );
  return (
    <>
      {/* <pre>{JSON.stringify(normalizedProduct.options, null, 2)}</pre> */}
      <EditProductClient
        product={normalizedProduct}
        allCategories={allCategories}
      />
    </>
  );
}
