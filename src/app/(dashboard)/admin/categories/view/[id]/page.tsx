"use client";

import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { ArrowLeft, Edit, Trash2, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { categories, products } from "src/lib/data";
import { Category } from "src/types/category";
import CategoryDetails from "@components/admin/categories/CategoryDetails";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
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
import { getCategoryById, deleteCategory } from "../../../../../../lib/api";
import { useToast } from "../../../../../../hooks/useToast";

export default function ViewCategory({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const { showToast } = useToast();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true);
      setError(null);
      try {
        const foundCategory = await getCategoryById(id);
        if (foundCategory) {
          setCategory(foundCategory);
        } else {
          setError("Category not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch category");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchCategory();
    }
  }, [id]);

  const handleDeleteConfirm = async () => {
    if (category) {
      try {
        await deleteCategory(category.id);
        showToast("Category deleted successfully!", "success");
        router.push("/admin/categories");
      } catch (err: any) {
        showToast(err.message || "Failed to delete category", "error");
      } finally {
        setDeleteDialogOpen(false);
      }
    }
  };

  // Get products in this category
  const categoryProducts = category
    ? products.filter((product) => product.category[0] === category.title)
    : [];

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (!category) {
    return <div className="p-4">Category not found</div>;
  }

  return (
    <div className="p-4">
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
          <Button
            variant="destructive"
            className="flex items-center gap-2"
            onClick={() => setDeleteDialogOpen(true)}
          >
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
                          src={product.images[0]}
                          alt={product.name}
                          width={50}
                          height={50}
                          className="rounded-md object-cover"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{formatNaira(product.price)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            product.stockStatus === "In stock"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }
                        >
                          {product.stockStatus}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "{category.title}"?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
