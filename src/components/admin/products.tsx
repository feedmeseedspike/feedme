"use client";

import { useState } from "react";
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
import { products } from "src/lib/data";
import Image from "next/image";

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
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedCategories.length === 0 ||
        selectedCategories.includes(p.category)) &&
      (selectedStock.length === 0 || selectedStock.includes(p.stockStatus)) &&
      (selectedPublished.length === 0 ||
        selectedPublished.includes(p.isPublished ? "Published" : "Archived"))
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
                  <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded-[12px]" />
                  {product.name}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Badge className="bg-gray-100 text-gray-700">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {formatNaira(product.price)}
                </TableCell>
                <TableCell
                  className={`text-center px-6 py-4 ${
                    product.stockStatus === "In stock"
                      ? "text-green-600"
                      : "text-orange-600"
                  }`}
                >
                  {product.stockStatus}
                </TableCell>
                <TableCell
                  className={`text-center px-6 py-4 ${
                    product.isPublished === true
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {product.isPublished === true ? "Published" : "Archived"}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
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
    </div>
  );
}
