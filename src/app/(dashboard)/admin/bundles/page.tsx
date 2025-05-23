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
import { BiEdit } from "react-icons/bi";
import Pagination from "@components/admin/productPagination";
import Link from "next/link";
import Image from "next/image";
import AgentModal from "@components/admin/agentModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import EditAgentModal from "@components/admin/editAgentModal";
import BundleModal from "@components/admin/addBundlesModal";

const bundles = [
  {
    id: 1,
    name: "Summer Essentials Bundle",
    price: "₦49,999",
    stockStatus: "In Stock",
    published: true,
    image: "/images/bundle1.jpg",
  },
  {
    id: 2,
    name: "Winter Warmth Bundle",
    price: "₦59,999",
    stockStatus: "Out of Stock",
    published: false,
    image: "/images/bundle2.jpg",
  },
  {
    id: 3,
    name: "Spring Refresh Bundle",
    price: "₦39,999",
    stockStatus: "In Stock",
    published: true,
    image: "/images/bundle3.jpg",
  },
  {
    id: 4,
    name: "Autumn Harvest Bundle",
    price: "₦69,999",
    stockStatus: "Low Stock",
    published: true,
    image: "/images/bundle4.jpg",
  },
  {
    id: 5,
    name: "Holiday Cheer Bundle",
    price: "₦79,999",
    stockStatus: "In Stock",
    published: true,
    image: "/images/bundle5.jpg",
  },
];

export default function Bundles() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStockStatus, setSelectedStockStatus] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<{
    id: number;
    name: string;

    email: string;
    phoneNumber: string;
    location: string;
    image: string;
  }>();

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

  const filteredBundles = bundles.filter(
    (bundle) =>
      bundle.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedStockStatus.length === 0 ||
        selectedStockStatus.includes(bundle.stockStatus))
  );

  const handleUpdateBundle = (updatedBundle: any) => {
    const updatedBundles = bundles.map((bundle) =>
      bundle.id === selectedBundle?.id
        ? { ...bundle, ...updatedBundle }
        : bundle
    );
    // console.log("Updated Bundles:", updatedBundles);
    setIsEditModalOpen(false);
  };

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredBundles.length / ITEMS_PER_PAGE);
  const paginatedBundles = filteredBundles.slice(
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
          <h2 className="text-3xl font-semibold">Bundles</h2>
          <p className="text-[#475467]">Manage bundles here.</p>
        </div>
        <Button
          className="bg-[#1B6013] text-white"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus size={16} /> Build New Bundle
        </Button>
        <BundleModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={(data) => {
            setIsDialogOpen(false);
          }}
        />
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
            placeholder="Search bundles"
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
                  Stock Status
                </h3>
                {["In Stock", "Out of Stock", "Low Stock"].map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={status}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedStockStatus.includes(status)}
                      onCheckedChange={() =>
                        toggleFilter(
                          status,
                          setSelectedStockStatus,
                          selectedStockStatus
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
                      setSelectedStockStatus([]);
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
              {["Bundles", "Price", "Stock Status", "Published"].map(
                (head, index) => (
                  <TableHead
                    key={head}
                    className="text-center px-6 py-3 font-medium text-gray-700"
                  >
                    <div
                      className={`flex items-center gap-1 ${
                        index === 0 ? "justify-start" : "justify-center"
                      }`}
                    >
                      {head} <ArrowDown size={16} strokeWidth={0.7} />
                    </div>
                  </TableHead>
                )
              )}
              <TableHead className="text-center px-6 py-3 font-medium text-gray-700"></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedBundles.map((bundle) => (
              <TableRow key={bundle.id}>
                <TableCell className="text-left px-6 py-4 flex gap-2 items-center">
                  <Image
                    src={bundle.image}
                    alt={bundle.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  {bundle.name}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {bundle.price}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Badge
                    variant={
                      bundle.stockStatus === "In Stock"
                        ? "secondary"
                        : bundle.stockStatus === "Out of Stock"
                        ? "destructive"
                        : "outline"
                    }
                  >
                    {bundle.stockStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <Badge
                    variant={bundle.published ? "secondary" : "destructive"}
                  >
                    {bundle.published ? "Published" : "Unpublished"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  <BiEdit
                    className="text-gray-600 hover:text-gray-900 cursor-pointer"
                    size={20}
                    onClick={() => {
                      setSelectedBundle({
                        id: bundle.id,
                        name: bundle.name,
                        email: "",
                        phoneNumber: "",
                        location: "",
                        image: bundle.image,
                      });
                      setIsEditModalOpen(true);
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}{" "}
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

      <EditAgentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateBundle}
        agent={selectedBundle}
      />
    </div>
  );
}
