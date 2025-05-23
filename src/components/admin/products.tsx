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
import Pagination from "@components/admin/productPagination";
import { Separator } from "@components/ui/separator";
import Link from "next/link";
import { getProducts, deleteProduct } from "../../../src/lib/api";
import Image from "next/image";
import { useRouter } from "next/navigation";

// const products = [
//   {
//     id: 1,
//     name: "Large Tomatoes",
//     category: "Pepper",
//     price: 5000,
//     stock: "In stock",
//     published: "Published",
//   },
//   {
//     id: 2,
//     name: "Onions",
//     category: "Onions",
//     price: 5000,
//     stock: "In stock",
//     published: "Published",
//   },
//   {
//     id: 3,
//     name: "Rodo",
//     category: "Fruits",
//     price: 5000,
//     stock: "In stock",
//     published: "Published",
//   },
//   {
//     id: 4,
//     name: "Tete",
//     category: "Pepper",
//     price: 5000,
//     stock: "Out of stock",
//     published: "Published",
//   },
//   {
//     id: 5,
//     name: "Potatoes",
//     category: "Vegetables",
//     price: 5000,
//     stock: "In stock",
//     published: "Published",
//   },
//   {
//     id: 6,
//     name: "Banana",
//     category: "Tubers",
//     price: 5000,
//     stock: "In stock",
//     published: "Archived",
//   },
//   {
//     id: 7,
//     name: "Tatashe",
//     category: "Fruits",
//     price: 5000,
//     stock: "Out of stock",
//     published: "Archived",
//   },
//   {
//     id: 8,
//     name: "Watermelon",
//     category: "Fruits",
//     price: 5000,
//     stock: "Out of stock",
//     published: "Archived",
//   },
// ];

export default function Product() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStock, setSelectedStock] = useState<string[]>([]);
  const [selectedPublished, setSelectedPublished] = useState<string[]>([]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    getProducts()
      .then((data) => {
        setProducts(data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch products");
        setLoading(false);
      });
  }, []);

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

  const toggleFilter = (
    value: string,
    setFilter: Function,
    selectedFilter: string[]
  ) => {
    setFilter((prev: string[]) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const filteredProducts = products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategories.length === 0 ||
        selectedCategories.includes(
          p.category?.[0] || p.category_ids?.[0] || ""
        )) &&
      (selectedStock.length === 0 ||
        selectedStock.includes(p.stockStatus || p.stock_status)) &&
      (selectedPublished.length === 0 ||
        selectedPublished.includes(
          p.isPublished || p.is_published ? "Published" : "Archived"
        ))
  );

  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.id || productToDelete._id);
      setProducts((prev) =>
        prev.filter(
          (p) => (p.id || p._id) !== (productToDelete.id || productToDelete._id)
        )
      );
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      // Optionally show a toast here
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  if (loading) return <div className="p-4">Loading products...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

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

      {/* Search & Filter Section */}
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
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]">
            <ArrowUpDown size={16} />
            Sort
          </button>

          {/* Filter Sheet */}
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
              <div className="mt-6 px-4">
                <h3 className="text-sm text-[#344054] font-medium mb-2">
                  Category
                </h3>
                {["Pepper", "Onions", "Fruits", "Vegetables", "Tubers"].map(
                  (category) => (
                    <div
                      key={category}
                      className="flex items-center gap-3 mb-2 pl-2"
                    >
                      <Checkbox
                        id={category}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={() =>
                          toggleFilter(
                            category,
                            setSelectedCategories,
                            selectedCategories
                          )
                        }
                      />
                      <label className="font-medium text-sm" htmlFor={category}>
                        {category}
                      </label>
                    </div>
                  )
                )}
                <h3 className="text-sm text-[#344054] font-medium mb-2 mt-4">
                  Stock Status
                </h3>
                {["In stock", "Out of stock"].map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={status}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedStock.includes(status)}
                      onCheckedChange={() =>
                        toggleFilter(status, setSelectedStock, selectedStock)
                      }
                    />
                    <label className="font-medium text-sm" htmlFor={status}>
                      {status}
                    </label>
                  </div>
                ))}
                <h3 className="text-sm text-[#344054] font-medium mb-2 mt-4">
                  Published Status
                </h3>
                {["Published", "Archived"].map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={status}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedPublished.includes(status)}
                      onCheckedChange={() =>
                        toggleFilter(
                          status,
                          setSelectedPublished,
                          selectedPublished
                        )
                      }
                    />
                    <label className="font-medium text-sm" htmlFor={status}>
                      {status}
                    </label>
                  </div>
                ))}
              </div>
              <SheetFooter className="border-t pt-4 !w-full">
                <div className="font-semibold text-sm flex justify-between items-end px-4">
                  <div
                    className="text-[#B42318] cursor-pointer"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedStock([]);
                      setSelectedPublished([]);
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
                    <Button className="bg-[#1B6013]">Apply</Button>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Table Section */}
      <div className="w-full max-w-[1200px] mx-auto">
        <Table className="border border-gray-300 rounded-lg shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)] overflow-hidden w-full">
          <TableHeader>
            <TableRow className="bg-[#EAECF0]">
              {[
                "Product",
                "Category",
                "Unit Price",
                "Stock Status",
                "Published Status",
              ].map((head) => (
                <TableHead
                  key={head}
                  className="text-center px-6 py-3 font-medium text-gray-700"
                >
                  <div className="flex items-center justify-center gap-1">
                    {head} <ArrowDown size={16} strokeWidth={0.7} />
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center px-6 py-3 font-medium text-gray-700"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedProducts.map((product) => (
              <TableRow key={product._id}>
                <TableCell className="text-left px-6 py-4 flex gap-2 items-center">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded-[12px]"
                  />
                  {product.name}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Badge className="bg-gray-100 text-gray-700 rounded-full">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {formatNaira(product.price)}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                      product.stockStatus === "In Stock"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {product.stockStatus}
                  </span>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        product.isPublished === true
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    ></span>
                    <span
                      className={
                        product.isPublished === true
                          ? "text-green-700"
                          : "text-gray-600"
                      }
                    >
                      {product.isPublished === true ? "Published" : "Archived"}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-center px-6 py-4 flex gap-2 justify-center">
                  <Link
                    href={{
                      pathname: "/admin/products/edit",
                      query: { slug: product.slug },
                    }}
                  >
                    <BiEdit
                      className="text-gray-600 hover:text-gray-900 cursor-pointer"
                      size={20}
                    />
                  </Link>
                  <button
                    className="text-red-500 hover:text-red-700 ml-2"
                    onClick={() => {
                      setProductToDelete(product);
                      setDeleteDialogOpen(true);
                    }}
                    title="Delete Product"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center mt-6">
        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete{" "}
              <span className="font-bold">{productToDelete?.name}</span>? This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
