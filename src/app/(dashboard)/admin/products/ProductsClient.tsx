"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Checkbox } from "@components/ui/checkbox";
import { formatNaira } from "src/lib/utils";
import { BiEdit } from "react-icons/bi";
import PaginationBar from "../../../../components/shared/pagination";
import { Separator } from "@components/ui/separator";
import Link from "next/link";
import { getProducts, deleteProduct } from "../../../../queries/products";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "../../../../hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "src/utils/supabase/client";
import { getCategoryById, getAllCategoriesQuery } from "src/queries/categories";
import { debounce } from "lodash";

function getImageSrc(src: string) {
  if (!src) return "/placeholder-product.png";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("ahisi/")) {
    return (
      "https://res.cloudinary.com/ahisi/image/upload/" +
      src.replace(/^ahisi\//, "")
    );
  }
  if (src.startsWith("/")) return src;
  return "/" + src;
}

// Sort options configuration
const sortOptions = [
  { value: "created_at:desc", label: "Newest First", icon: ChevronDown },
  { value: "created_at:asc", label: "Oldest First", icon: ChevronUp },
  { value: "name:asc", label: "Name A-Z", icon: ChevronUp },
  { value: "name:desc", label: "Name Z-A", icon: ChevronDown },
  { value: "price:asc", label: "Price Low to High", icon: ChevronUp },
  { value: "price:desc", label: "Price High to Low", icon: ChevronDown },
  { value: "num_sales:desc", label: "Best Selling", icon: ChevronDown },
  { value: "avg_rating:desc", label: "Highest Rated", icon: ChevronDown },
];

export default function ProductsClient({
  initialProducts,
  totalProductsCount,
  itemsPerPage,
  currentPage,
  initialSearch,
  initialCategories,
  initialStock,
  initialPublished,
  categoryNames: initialCategoryNames,
  allCategories,
  initialSortBy,
  initialSortOrder,
}: {
  initialProducts: any[];
  totalProductsCount: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
  initialCategories: string[];
  initialStock: string[];
  initialPublished: string[];
  categoryNames: Record<string, string>;
  allCategories: { id: string; title: string }[];
  initialSortBy: string;
  initialSortOrder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const supabase = createClient();

  // Local state for the input field
  const [inputValue, setInputValue] = useState(initialSearch || "");

  // Always sync inputValue with the URL param
  useEffect(() => {
    const urlSearch = searchParams?.get("search") || "";
    setInputValue(urlSearch);
  }, [searchParams]);

  // Filter and sort state always in sync with URL
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialCategories || []
  );
  const [selectedStock, setSelectedStock] = useState<string[]>(
    initialStock || []
  );
  const [selectedPublished, setSelectedPublished] = useState<string[]>(
    initialPublished || []
  );
  const [sortBy, setSortBy] = useState(initialSortBy || "created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (initialSortOrder as "asc" | "desc") || "desc"
  );

  // Sync filter and sort state with URL params
  useEffect(() => {
    // Helper to get array params from URL
    const getArrayParam = (param: string) => {
      const values = searchParams?.getAll(param) || [];
      return values.length > 0 ? values : [];
    };
    // Helper to get string param from URL with fallback
    const getStringParam = (param: string, fallback: string) => {
      return searchParams?.get(param) || fallback;
    };

    setSelectedCategories(getArrayParam("category"));
    setSelectedStock(getArrayParam("stock"));
    setSelectedPublished(getArrayParam("published"));
    setSortBy(getStringParam("sortBy", "created_at"));
    setSortOrder(getStringParam("sortOrder", "desc") as "asc" | "desc");
  }, [searchParams]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>(
    initialCategoryNames || {}
  );

  // State for all categories mapping
  const [allCategoryMap, setAllCategoryMap] = useState<Record<string, string>>(
    {}
  );

  // Fetch all categories on mount
  useEffect(() => {
    async function fetchAllCategories() {
      try {
        const client = createClient();
        const { data, error } = await getAllCategoriesQuery(client);
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach((cat: { id: string; title: string }) => {
          map[String(cat.id)] = cat.title;
        });
        setAllCategoryMap(map);
      } catch (err) {
        console.error("Failed to fetch all categories", err);
      }
    }
    fetchAllCategories();
  }, []);

  const page = currentPage;

  // URL update helper
  const updateURL = useCallback(
    (updates: Record<string, any>) => {
      const newSearchParams = new URLSearchParams(
        searchParams?.toString() || ""
      );

      Object.entries(updates).forEach(([key, value]) => {
        if (value === "" || value === null || value === undefined) {
          newSearchParams.delete(key);
        } else if (Array.isArray(value)) {
          newSearchParams.delete(key);
          value.forEach((v) => newSearchParams.append(key, v));
        } else {
          newSearchParams.set(key, String(value));
        }
      });

      router.push(`?${newSearchParams.toString()}`);
    },
    [searchParams, router]
  );

  // Debounced search function
  const debouncedUpdateURL = useRef(
    debounce((searchTerm: string) => {
      updateURL({ search: searchTerm, page: 1 });
    }, 300)
  );

  useEffect(() => {
    debouncedUpdateURL.current = debounce((searchTerm: string) => {
      updateURL({ search: searchTerm, page: 1 });
    }, 300);
    return () => {
      debouncedUpdateURL.current.cancel?.();
    };
  }, [updateURL]);

  const urlSearch = searchParams?.get("search") || "";
  const urlCategories = searchParams?.getAll("category") || [];
  const urlStock = searchParams?.getAll("stock") || [];
  const urlPublished = searchParams?.getAll("published") || [];
  const urlSortBy = searchParams?.get("sortBy") || "created_at";
  const urlSortOrder =
    (searchParams?.get("sortOrder") as "asc" | "desc") || "desc";

  const {
    data: queryResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      "products",
      page,
      urlSearch,
      urlCategories,
      urlStock,
      urlPublished,
      urlSortBy,
      urlSortOrder,
    ],
    queryFn: async () => {
      const { data, count } = await getProducts({
        page: page,
        limit: itemsPerPage,
        search: urlSearch,
        category: urlCategories[0] || "",
        stockStatus: urlStock[0] || "",
        publishedStatus: urlPublished[0] || "",
        sortBy: urlSortBy,
        sortOrder: urlSortOrder,
      });

      // Fetch category names for each product
      if (data && data.length > 0) {
        const categoryIds = data
          .flatMap((p: any) => p.category_ids || [])
          .filter(Boolean);

        if (categoryIds.length > 0) {
          const uniqueCategoryIds = [...new Set(categoryIds)].filter(
            (id): id is string => typeof id === 'string' && !(id in categoryNames)
          );
          if (uniqueCategoryIds.length > 0) {
            const fetchedCategoryNames: Record<string, string> = {};
            await Promise.all(
              uniqueCategoryIds.map(async (id) => {
                try {
                  const category = await getCategoryById(supabase, id);
                  if (category) {
                    fetchedCategoryNames[id] = category.title;
                  }
                } catch (error) {
                  console.error(
                    `Failed to fetch category with ID ${id}:`,
                    error
                  );
                }
              })
            );
            // Update local state with new category names
            setCategoryNames((prev) => ({ ...prev, ...fetchedCategoryNames }));
          }
        }
      }

      return { data: data || [], count: count || 0 };
    },
    placeholderData: (prev) => prev,
    initialData: { data: initialProducts, count: totalProductsCount },
  });

  const products = queryResult?.data || initialProducts || [];
  const currentTotalCount = queryResult?.count ?? totalProductsCount;

  const stockStatuses = ["In stock", "Out of stock"];
  const publishedStatuses = ["Published", "Archived"];

  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    debouncedUpdateURL.current(newValue);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split(":");
    setSortBy(field);
    setSortOrder(order as "asc" | "desc");
    updateURL({ sortBy: field, sortOrder: order, page: 1 });
  };

  const toggleFilter = (
    value: string,
    filterType: "category" | "stock" | "published"
  ) => {
    let currentFilters: string[];
    let setFilters: (filters: string[]) => void;

    switch (filterType) {
      case "category":
        currentFilters = selectedCategories;
        setFilters = setSelectedCategories;
        break;
      case "stock":
        currentFilters = selectedStock;
        setFilters = setSelectedStock;
        break;
      case "published":
        currentFilters = selectedPublished;
        setFilters = setSelectedPublished;
        break;
    }

    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter((item) => item !== value)
      : [...currentFilters, value];

    setFilters(newFilters);
    updateURL({ [filterType]: newFilters, page: 1 });
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedStock([]);
    setSelectedPublished([]);
    setInputValue("");
    setSortBy("created_at");
    setSortOrder("desc");
    updateURL({
      category: [],
      stock: [],
      published: [],
      search: "",
      sortBy: "created_at",
      sortOrder: "desc",
      page: 1,
    });
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
      console.error("Error deleting product:", err);
      showToast(err.message || "Failed to delete product", "error");
    }
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const totalPages = Math.ceil((currentTotalCount || 0) / itemsPerPage);

  // Get current sort option display
  const currentSortOption =
    sortOptions.find((option) => option.value === `${sortBy}:${sortOrder}`) ||
    sortOptions[0];

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
        <div className="justify-between items-center space-x-8">
          <Link
            href={`/admin/upload`}>
            <Button className="bg-green-100 text-[#1B6013] font-extrabold hover:text-white">
              <Plus size={16} /> Update Price List
            </Button>
          </Link>
          <Link
            href={`/admin/products/add-new${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}>
            <Button className="bg-[#1B6013] text-white">
              <Plus size={16} /> Add New Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between w-full py-4">
        <div className="relative w-full max-w-[400px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search products by name, description, or brand..."
            className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]"
            value={inputValue}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={`${sortBy}:${sortOrder}`}
            onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown size={16} />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <Icon size={14} />
                      {option.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <ListFilter size={16} />
                Filters
                {(selectedCategories.length > 0 ||
                  selectedStock.length > 0 ||
                  selectedPublished.length > 0) && (
                  <Badge variant="secondary" className="ml-1">
                    {selectedCategories.length +
                      selectedStock.length +
                      selectedPublished.length}
                  </Badge>
                )}
              </Button>
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
                    className="p-2 hover:bg-gray-100 rounded-md">
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
                  {allCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center gap-2 mb-2 pl-2">
                      <Checkbox
                        id={`category-${cat.id}`}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleFilter(cat.id, "category")}
                      />
                      <label
                        className="font-medium text-sm"
                        htmlFor={`category-${cat.id}`}>
                        {cat.title}
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
                      className="flex items-center gap-2 mb-2 pl-2">
                      <Checkbox
                        id={`stock-${status}`}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={selectedStock.includes(status)}
                        onCheckedChange={() => toggleFilter(status, "stock")}
                      />
                      <label
                        className="font-medium text-sm"
                        htmlFor={`stock-${status}`}>
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
                      className="flex items-center gap-2 mb-2 pl-2">
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
                        htmlFor={`published-${status}`}>
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
                    onClick={clearAllFilters}>
                    Clear all filters
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={"outline"}
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }>
                      Cancel
                    </Button>
                    <Button
                      className="bg-[#1B6013]"
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }>
                      Apply
                    </Button>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Active filters display */}
      {(selectedCategories.length > 0 ||
        selectedStock.length > 0 ||
        selectedPublished.length > 0 ||
        inputValue) && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>
            {inputValue && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {inputValue}
                <button
                  onClick={() => {
                    setInputValue("");
                    updateURL({ search: "", page: 1 });
                  }}
                  className="ml-1 hover:text-red-500">
                  <X size={12} />
                </button>
              </Badge>
            )}
            {selectedCategories.map((catId) => {
              const cat = allCategories.find((c) => c.id === catId);
              return (
                <Badge
                  key={catId}
                  variant="secondary"
                  className="flex items-center gap-1">
                  Category: {cat?.title || catId}
                  <button
                    onClick={() => toggleFilter(catId, "category")}
                    className="ml-1 hover:text-red-500">
                    <X size={12} />
                  </button>
                </Badge>
              );
            })}
            {selectedStock.map((status) => (
              <Badge
                key={status}
                variant="secondary"
                className="flex items-center gap-1">
                Stock: {status}
                <button
                  onClick={() => toggleFilter(status, "stock")}
                  className="ml-1 hover:text-red-500">
                  <X size={12} />
                </button>
              </Badge>
            ))}
            {selectedPublished.map((status) => (
              <Badge
                key={status}
                variant="secondary"
                className="flex items-center gap-1">
                Status: {status}
                <button
                  onClick={() => toggleFilter(status, "published")}
                  className="ml-1 hover:text-red-500">
                  <X size={12} />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700">
              Clear all
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Image</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>List Price</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, idx) => (
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
            ) : !isLoading && products && products.length > 0 ? (
              products.map((product: any) => (
                <TableRow key={product.id}>
                  <TableCell className="">
                    {product.images?.[0] && (
                      <div className="w-[60px] h-[60px] relative rounded-md overflow-hidden">
                        <Image
                          src={getImageSrc(
                            typeof product.images[0] === "string"
                              ? product.images[0]
                              : (() => {
                                  try {
                                    const parsed = JSON.parse(
                                      product.images[0]
                                    );
                                    return (
                                      parsed.url || "/placeholder-product.png"
                                    );
                                  } catch (e) {
                                    console.error(
                                      "Failed to parse image URL JSON:",
                                      product.images[0],
                                      e
                                    );
                                    return "/placeholder-product.png";
                                  }
                                })()
                          )}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium cursor-pointer hover:bg-gray-50">
                    <div className="">{product.name}</div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      if (
                        Array.isArray(product.category_ids) &&
                        product.category_ids.length > 0
                      ) {
                        return (
                          product.category_ids
                            .map((catId: string) => {
                              // Try multiple lookup strategies
                              const categoryName =
                                allCategoryMap[String(catId)] ||
                                categoryNames[String(catId)] ||
                                allCategories.find((cat) => cat.id === catId)
                                  ?.title ||
                                allCategories.find(
                                  (cat) => String(cat.id) === String(catId)
                                )?.title ||
                                `Category ${catId}`;
                              return categoryName;
                            })
                            .filter(
                              (name: string) => !name.startsWith(`Category `)
                            ) // Filter out failed lookups
                            .join(", ") || "Unknown Categories"
                        );
                      } else {
                        return "Uncategorized";
                      }
                    })()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Check if product has options with pricing
                      if (
                        product.options &&
                        Array.isArray(product.options) &&
                        product.options.length > 0
                      ) {
                        const firstOption = product.options[0];
                        if (
                          firstOption &&
                          typeof firstOption === "object" &&
                          firstOption.price
                        ) {
                          return formatNaira(firstOption.price);
                        }
                      }
                      // Fall back to product price
                      if (
                        product.price !== null &&
                        product.price !== undefined
                      ) {
                        return formatNaira(product.price);
                      }
                      return "N/A";
                    })()}
                  </TableCell>
                  <TableCell>
                    {product.list_price !== undefined &&
                    product.list_price !== null
                      ? formatNaira(product.list_price)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      // Check if product has options with stock status
                      if (
                        product.options &&
                        Array.isArray(product.options) &&
                        product.options.length > 0
                      ) {
                        // Check if any option is in stock
                        const hasInStock = product.options.some(
                          (option: any) =>
                            option &&
                            typeof option === "object" &&
                            (option.stockStatus === "In Stock" ||
                              option.stock_status === "in_stock")
                        );
                        const isInStock = hasInStock;
                        return (
                          <Badge
                            className={
                              isInStock
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }>
                            {isInStock ? "In stock" : "Out of stock"}
                          </Badge>
                        );
                      }

                      // Fall back to product stock status
                      const isInStock =
                        product.stock_status === "in_stock" ||
                        product.stock_status === "In Stock" ||
                        product.stockStatus === "In Stock";
                      return (
                        <Badge
                          className={
                            isInStock
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }>
                          {isInStock ? "In stock" : "Out of stock"}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        product.is_published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-700"
                      }>
                      {product.is_published ? "Published" : "Archived"}
                    </Badge>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Link href={`/admin/products/edit/${product.id}`}>
                      <Button variant="outline" size="icon">
                        <BiEdit size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(product)}>
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  {isLoading ? "Loading products..." : "No products found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-center">
        <PaginationBar
          page={page}
          totalPages={totalPages}
          urlParamName="page"
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the product &apos;
              {productToDelete?.name}&apos;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}>
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
