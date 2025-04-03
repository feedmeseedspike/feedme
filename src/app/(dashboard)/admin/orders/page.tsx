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
import Pagination from "@components/admin/productPagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Avatar, AvatarFallback } from "@components/ui/avatar";

const orders = [
  {
    id: 1,
    orderNo: "#0001",
    date: "Nov 11 at 7:56pm",
    customer: { name: "Bola Adeleke", phone: "09035857775" },
    amount: "₦5,000.00",
    location: "Ikeja, Lagos",
    progress: "Order Confirmed",
  },
  {
    id: 2,
    orderNo: "#0002",
    date: "Nov 12 at 8:30am",
    customer: { name: "John Doe", phone: "08012345678" },
    amount: "₦7,500.00",
    location: "Victoria Island, Lagos",
    progress: "Shipped",
  },
  {
    id: 3,
    orderNo: "#0003",
    date: "Nov 13 at 12:15pm",
    customer: { name: "Jane Smith", phone: "08123456789" },
    amount: "₦10,000.00",
    location: "Lekki, Lagos",
    progress: "Delivered",
  },
  {
    id: 4,
    orderNo: "#0004",
    date: "Nov 14 at 3:45pm",
    customer: { name: "Michael Brown", phone: "07098765432" },
    amount: "₦3,000.00",
    location: "Surulere, Lagos",
    progress: "Pending",
  },
  {
    id: 5,
    orderNo: "#0005",
    date: "Nov 15 at 9:20am",
    customer: { name: "Sarah Johnson", phone: "09087654321" },
    amount: "₦6,000.00",
    location: "Yaba, Lagos",
    progress: "Cancelled",
  },
];

// Progress options for the Select component
const progressOptions = [
  "Pending",
  "Order Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export default function Orders() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);

  // Filter orders based on search and selected status
  const filteredOrders = orders.filter(
    (order) =>
      order.customer.name.toLowerCase().includes(search.toLowerCase()) &&
      (selectedStatus.length === 0 || selectedStatus.includes(order.progress))
  );

  // Pagination logic
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Toggle filter for status
  const toggleFilter = (value: string) => {
    setSelectedStatus((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Orders</h2>
          <p className="text-[#475467]">Manage your orders here.</p>
        </div>
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
            placeholder="Search for orders"
            className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
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
                  Status
                </h3>
                {progressOptions.map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={status}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedStatus.includes(status)}
                      onCheckedChange={() => toggleFilter(status)}
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
                      setSelectedStatus([]);
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
      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Order No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.orderNo}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback>
                      {order.customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer.phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>{order.location}</TableCell>
                <TableCell>
                  <Select defaultValue={order.progress}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="!border !border-gray-300">
                      {progressOptions.map((option) => (
                        <SelectItem key={option} value={option} >
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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