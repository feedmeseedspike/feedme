"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import {
  ArrowDown,
  Search,
  Plus,
  ArrowUpDown,
  ListFilter,
  X,
  Eye,
  Trash2,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@components/ui/sheet";
import { Checkbox } from "@components/ui/checkbox";
import { formatNaira } from "src/lib/utils";
import { BiEdit } from "react-icons/bi";
import PaginationBar from "../shared/pagination";
import { Separator } from "@components/ui/separator";
import Link from "next/link";
import {
  getProducts,
  deleteProduct,
  getCategoryById,
} from "../../../src/lib/api";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "../../../src/hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { useQuery } from "@tanstack/react-query";

export default function Product() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.getAll("category") || []
  );
  const [selectedStock, setSelectedStock] = useState<string[]>(
    searchParams.getAll("stock") || []
  );
  const [selectedPublished, setSelectedPublished] = useState<string[]>(
    searchParams.getAll("published") || []
  );
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>(
    {}
  );

  const currentPage = Number(searchParams.get("page") || 1);
  const ITEMS_PER_PAGE = 10;

  // Use TanStack Query for products
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "products",
      currentPage,
      search,
      selectedCategories,
      selectedStock,
      selectedPublished,
    ],
    queryFn: async () => {
      const categoryFilter =
        selectedCategories.length > 0 ? selectedCategories[0] : "";
      const { data, count } = await getProducts({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search,
        category: categoryFilter,
      });
      setTotalProducts(count || 0);
      // Fetch category names for each product
      const categoryIds = data
        ?.map((p: any) => p.category_ids?.[0])
        .filter(Boolean);
      if (categoryIds && categoryIds.length > 0) {
        const uniqueCategoryIds = [...new Set(categoryIds)];
        const fetchedCategoryNames: Record<string, string> = {};
        const fetchPromises = uniqueCategoryIds.map(async (id) => {
          try {
            const category = await getCategoryById(id);
            if (category) {
              fetchedCategoryNames[id] = category.title;
            }
          } catch (error) {
            console.error(`Failed to fetch category with ID ${id}:`, error);
          }
        });
        await Promise.all(fetchPromises);
        setCategoryNames((prev) => ({ ...prev, ...fetchedCategoryNames }));
      }
      return data || [];
    },
    placeholderData: (prev) => prev,
  });

  const products = productsData || [];

  const categories = [
    "Pepper",
    "Onions",
    "Fruits",
    "Vegetables",
    "Tubers",
    "Grains",
    "Herbs",
    "Spices",
    "Dairy",
    "Meat",
  ];

  const stockStatuses = ["In stock", "Out of stock"];

  const publishedStatuses = ["Published", "Archived"];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (newSearch) {
      newSearchParams.set("search", newSearch);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.set("page", "1");
    router.push(`?${newSearchParams.toString()}`);
  };

  const toggleFilter = (
    value: string,
    filterType: "category" | "stock" | "published"
  ) => {
    const currentFilters = searchParams.getAll(filterType);
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((item) => item !== value)
      : [...currentFilters, value];

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete(filterType);
    newFilters.forEach((filter) => newSearchParams.append(filterType, filter));
    newSearchParams.set("page", "1");
    router.push(`?${newSearchParams.toString()}`);
  };

  const handleDeleteClick = (product: any) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id);
      showToast("Product deleted successfully!", "success");
      await refetch();
    } catch (err: any) {
      showToast(err.message || "Failed to delete product", "error");
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  if (error)
    return (
      <div className="p-4 text-red-500">
        {(error as any).message || "Failed to fetch products"}
      </div>
    );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Products</h2>
          <p className="text-[#475467]">Manage Products here.</p>
        </div>
        <Link href="/admin/products/add-new">
          <Button className="bg-[#1B6013] text-white">
            <Plus size={16} /> Add New Product
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between w-full py-4">
        <div className="relative w-full max-w-[400px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search for products"
            className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]">
            <ArrowUpDown size={16} />
            Sort
          </button>

          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1 px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]">
                <ListFilter size={16} />
                Filters
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="!px-0">
              <SheetHeader className="px-4">
                <div className="flex justify-between items-center">
                  <SheetTitle>Filters</SheetTitle>
                  <button
                    onClick={() =>
                      document.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "Escape" })
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[#475467] text-sm">
                  Apply filters to table data.
                </p>
              </SheetHeader>
              <div className="mt-6 px-4 space-y-6">
                <div>
                  <h3 className="text-sm text-[#344054] font-medium mb-2">
                    Categories
                  </h3>
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="flex items-center gap-2 mb-2 pl-2"
                    >
                      <Checkbox
                        id={`category-${category}`}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() =>
                          toggleFilter(category, "category")
                        }
                      />
                      <label
                        className="font-medium text-sm"
                        htmlFor={`category-${category}`}
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm text-[#344054] font-medium mb-2">
                    Stock Status
                  </h3>
                  {stockStatuses.map((status) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 mb-2 pl-2"
                    >
                      <Checkbox
                        id={`stock-${status}`}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={selectedStock.includes(status)}
                        onCheckedChange={() => toggleFilter(status, "stock")}
                      />
                      <label
                        className="font-medium text-sm"
                        htmlFor={`stock-${status}`}
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm text-[#344054] font-medium mb-2">
                    Published Status
                  </h3>
                  {publishedStatuses.map((status) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 mb-2 pl-2"
                    >
                      <Checkbox
                        id={`published-${status}`}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={selectedPublished.includes(status)}
                        onCheckedChange={() =>
                          toggleFilter(status, "published")
                        }
                      />
                      <label
                        className="font-medium text-sm"
                        htmlFor={`published-${status}`}
                      >
                        {status}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <SheetFooter className="border-t pt-4 !w-full">
                <div className="font-semibold text-sm flex justify-between items-end px-4">
                  <div
                    className="text-[#B42318] cursor-pointer"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedStock([]);
                      setSelectedPublished([]);
                      const newSearchParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      newSearchParams.delete("category");
                      newSearchParams.delete("stock");
                      newSearchParams.delete("published");
                      newSearchParams.set("page", "1");
                      router.push(`?${newSearchParams.toString()}`);
                    }}
                  >
                    Clear all filters
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={"outline"}
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#1B6013]"
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <div className="h-10 w-10 rounded bg-gray-200"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-5 w-5 rounded bg-gray-200 ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : products && products.length > 0 ? (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.images?.[0] && (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        width={60}
                        height={60}
                        className="rounded-md object-cover"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/admin/products/view/${product.id}`}
                      className="hover:underline text-blue-600"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {categoryNames[product.category_ids?.[0]] || "N/A"}
                  </TableCell>
                  <TableCell>{formatNaira(product.price)}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        product.stock_status === "In stock"
                          ? "bg-green-100 text-green-800"
                          : "bg-orange-100 text-orange-800"
                      }
                    >
                      {product.stock_status || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        product.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }
                    >
                      {product.is_published ? "Published" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Link href={`/admin/products/edit/${product.id}`}>
                      <Button variant="outline" size="icon">
                        <BiEdit size={16} />
                      </Button>
                    </Link>
                    <Link
                      href={`/product/${product.slug || product.id}`}
                      target="_blank"
                    >
                      <Button variant="outline" size="icon">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-center">
        <PaginationBar
          page={currentPage}
          totalPages={totalPages}
          urlParamName="page"
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product "
              {productToDelete?.name}"? This action cannot be undone.
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
