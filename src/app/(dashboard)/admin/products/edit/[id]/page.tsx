export const dynamic = "force-dynamic";

import EditProductClient from "./EditProductClient";
import {
  getProductById,
  getAllCategories,
} from "src/lib/actions/product.actions";
import { notFound } from "next/navigation";

function normalizeProduct(product: any) {
  // Handle both old array format and new object format for options
  let options = product.options;
  
  if (typeof product.options === "string" && product.options.trim().startsWith("[")) {
    // Handle stringified arrays (legacy)
    try {
      options = JSON.parse(product.options);
      if (!Array.isArray(options)) {
        options = [];
      }
    } catch (e) {
      options = [];
    }
  } else if (product.options === null || product.options === undefined) {
    // Handle null/undefined
    options = [];
  }
  // Keep arrays and objects as-is (both old and new formats)

  // Ensure images is always an array of strings
  let images = [];
  if (Array.isArray(product.images)) {
    images = product.images
      .map((img: any) => {
        if (typeof img === "string") {
          return img;
        } else if (img && typeof img === "object" && img.url) {
          return img.url;
        }
        return null;
      })
      .filter(Boolean);
  } else if (typeof product.images === "string" && product.images) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) {
        images = parsed.filter(Boolean);
      } else {
        images = [product.images];
      }
    } catch (e) {
      images = [product.images];
    }
  }

  // Ensure stock_status is properly formatted
  let stock_status = product.stock_status || null;
  if (stock_status === "in_stock") {
    stock_status = "In Stock";
  } else if (stock_status === "out_of_stock") {
    stock_status = "Out of Stock";
  }

  // Ensure category_ids is an array
  let category_ids = [];
  if (Array.isArray(product.category_ids)) {
    category_ids = product.category_ids;
  } else if (typeof product.category_ids === "string") {
    try {
      const parsed = JSON.parse(product.category_ids);
      category_ids = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      category_ids = [];
    }
  }

  const normalized = {
    ...product,
    options,
    images,
    stock_status,
    category_ids,
    is_published: Boolean(product.is_published),
  };
  return normalized;
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
    [product, allCategories] = await Promise.all([
      getProductById(productId),
      getAllCategories(),
    ]);

    if (!product) {
      return notFound();
    }
  } catch (error) {
    return notFound();
  }

  // Normalize product data for the client
  const normalizedProduct = normalizeProduct(product);

  return (
    <EditProductClient
      product={normalizedProduct}
      allCategories={allCategories}
    />
  );
}
