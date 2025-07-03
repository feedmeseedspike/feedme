export const dynamic = "force-dynamic";

import { Button } from "@components/ui/button";
import { ArrowLeft, Edit, Trash2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Category } from "src/types/category";
import CategoryDetails from "@components/admin/categories/CategoryDetails";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { createClient } from "src/utils/supabase/client";
import type { Database } from "src/utils/database.types";
import type { Category as AppCategory } from "src/types/category";

export default async function ViewCategory({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = createClient();

  // Fetch category
  const { data: categoryRow, error: catError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle<Database["public"]["Tables"]["categories"]["Row"]>();
  if (catError || !categoryRow) {
    return notFound();
  }
  // Map to app Category type
  const category: AppCategory & { banner_url?: string } = {
    id: categoryRow.id,
    title: categoryRow.title,
    description: categoryRow.description || "",
    thumbnail:
      categoryRow.thumbnail &&
      typeof categoryRow.thumbnail === "object" &&
      "url" in categoryRow.thumbnail
        ? (categoryRow.thumbnail as { url: string; public_id: string })
        : { url: "", public_id: "" },
    keynotes: categoryRow.keynotes || [],
    tags: categoryRow.tags || [],
    products: [], // not used in details
    banner_url: categoryRow.banner_url || undefined,
  };

  // Fetch products in this category (category_ids contains id)
  const { data: categoryProductsRaw } = await supabase
    .from("products")
    .select("*")
    .contains("category_ids", [id]);
  const categoryProducts = Array.isArray(categoryProductsRaw)
    ? categoryProductsRaw
    : [];

  return (
    <div className="p-4">
      {/* Category Banner */}
      {category.banner_url ? (
        <div className="mb-6 w-full h-40 md:h-56 rounded-lg overflow-hidden relative">
          <Image
            src={category.banner_url}
            alt={category.title + " banner"}
            fill
            className="object-cover w-full h-full"
          />
        </div>
      ) : null}

      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Categories
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-semibold">{category.title}</h2>
          <p className="text-[#475467]">Category details</p>
        </div>
        <div className="flex gap-3">
          <Link href={`/admin/categories/edit/${category.id}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <Edit size={16} />
              Edit
            </Button>
          </Link>
          <Button variant="destructive" className="flex items-center gap-2">
            <Trash2 size={16} />
            Delete
          </Button>
        </div>
      </div>

      {/* Category Details */}
      <CategoryDetails category={category} />

      {/* Products in this Category */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Products in {category.title}</CardTitle>
              <CardDescription>
                {categoryProducts.length} products in this category
              </CardDescription>
            </div>
            <Link href={`/admin/products/add-new?category=${category.title}`}>
              <Button className="bg-[#1B6013] text-white">
                <Plus size={16} className="mr-2" /> Add Product
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {categoryProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100">
                    <TableHead>Image</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={
                            Array.isArray(product.images) && product.images[0]
                              ? product.images[0]
                              : "/images/default.png"
                          }
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{formatNaira(product.price ?? 0)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            product.stock_status === "in_stock"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {product.stock_status === "in_stock"
                            ? "In stock"
                            : "Out of stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            href={{
                              pathname: "/admin/products/edit",
                              query: { slug: product.slug },
                            }}
                          >
                            <Button variant="ghost" size="icon">
                              <Edit
                                className="text-gray-600 hover:text-gray-900"
                                size={18}
                              />
                            </Button>
                          </Link>
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                          >
                            <Button variant="ghost" size="icon">
                              <ExternalLink
                                className="text-gray-600 hover:text-gray-900"
                                size={18}
                              />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <p>No products in this category yet.</p>
                <Link
                  href={`/admin/products/add-new?category=${category.title}`}
                >
                  <Button variant="outline" className="mt-4">
                    <Plus size={16} className="mr-2" /> Add Your First Product
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
