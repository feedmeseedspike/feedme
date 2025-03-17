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
import { Input } from "@components/ui/input";
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
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useRouter } from "next/navigation";

// Dummy data for customers
const customers = [
  {
    id: 1,
    name: "John Doe",
    phoneNumber: "+234 812 345 6789",
    email: "johndoe@example.com",
    totalAmountSpent: 50000,
    totalOrders: 10,
    location: "Ikeja, Lagos",
    image: "/images/customer1.jpg",
    orders: [
      {
        orderNo: "#0001",
        date: "Nov 11 at 7:56pm",
        amount: "N5,000.00",
        platform: "WhatsApp",
        address: "17, ABC Street, Ikeja, Lagos",
        progress: "Out for Delivery",
      },
      {
        orderNo: "#0002",
        date: "Nov 10 at 5:30pm",
        amount: "N3,000.00",
        platform: "Mobile App",
        address: "17, ABC Street, Ikeja, Lagos",
        progress: "Processing order",
      },
    ],
  },
  {
    id: 2,
    name: "Jane Smith",
    phoneNumber: "+234 812 345 6789",
    email: "janesmith@example.com",
    totalAmountSpent: 75000,
    totalOrders: 15,
    location: "Victoria Island, Lagos",
    image: "/images/customer2.jpg",
    orders: [
      {
        orderNo: "#0003",
        date: "Nov 9 at 8:00pm",
        amount: "N7,000.00",
        platform: "Website",
        address: "12, XYZ Street, Victoria Island, Lagos",
        progress: "Order Continued",
      },
    ],
  },
];

export default function Customers() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    location: string;
    image: string;
    totalAmountSpent: number;
    totalOrders: number;
    orders: {
      orderNo: string;
      date: string;
      amount: string;
      platform: string;
      address: string;
      progress: string;
    }[];
  } | null>(null);

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const router = useRouter();

  // When a customer row is clicked, navigate to their page
  const handleCustomerClick = (customerId: number) => {
    console.log("Customer ID:", customerId);
    // router.push(`/customers/${customerId}`);
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Customers</h2>
          <p className="text-[#475467]">View customers and their orders here.</p>
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
            placeholder="Search customers"
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
                {["Active", "Inactive"].map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={status}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedStatus.includes(status)}
                      onCheckedChange={() =>
                        setSelectedStatus((prev) =>
                          prev.includes(status)
                            ? prev.filter((item) => item !== status)
                            : [...prev, status]
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
      <div className="w-full max-w-[1200px] mx-auto">
        <Table className="border border-gray-300 rounded-lg shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)] overflow-hidden w-full">
          <TableHeader>
            <TableRow className="bg-[#EAECF0]">
              {[
                "Customer ID",
                "Full Name",
                "Phone Number",
                "Email Address",
                "Total Amount Spent",
                "Total Orders",
                "Location",
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
            {paginatedCustomers.map((customer) => (
              <TableRow
                key={customer.id}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handleCustomerClick(customer.id)} 
              >
                <TableCell className="text-center px-6 py-4">
                  {customer.id}
                </TableCell>
                <TableCell className="text-left px-6 py-4 flex gap-2 items-center">
                  <Image
                    src={customer.image}
                    alt={customer.name}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  {customer.name}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {customer.phoneNumber}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {customer.email}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  ₦{customer.totalAmountSpent.toLocaleString()}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {customer.totalOrders}
                </TableCell>
                <TableCell className="text-center px-6 py-4">
                  {customer.location}
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


      {/* Customer Orders Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{selectedCustomer.name}</h2>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left">Order No</th>
                    <th className="px-4 py-2 text-left">Date</th>
                    <th className="px-4 py-2 text-left">Amount</th>
                    <th className="px-4 py-2 text-left">Platform</th>
                    <th className="px-4 py-2 text-left">Address</th>
                    <th className="px-4 py-2 text-left">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCustomer.orders.map((order, index) => (
                    <tr key={index} className="border-b">
                      <td className="px-4 py-2">{order.orderNo}</td>
                      <td className="px-4 py-2">{order.date}</td>
                      <td className="px-4 py-2">{order.amount}</td>
                      <td className="px-4 py-2">{order.platform}</td>
                      <td className="px-4 py-2">{order.address}</td>
                      <td className="px-4 py-2">{order.progress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-between items-center mt-4">
              <button className="text-gray-500 hover:text-gray-700">
                Previous
              </button>
              <span>Page 1 of 10</span>
              <button className="text-gray-500 hover:text-gray-700">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}