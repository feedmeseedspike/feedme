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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import { createClient } from "@utils/supabase/client";
import { formatNaira } from "src/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationBar from "@components/shared/pagination";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders } from "../../../../queries/orders";
import { useToast } from "../../../../hooks/useToast";

// Assuming the structure of an order object from Supabase (copied from overview/page.tsx for type consistency)
interface Order {
  id: string;
  user_id: string | null;
  status: string | null;
  total_amount: number | null;
  voucher_id: string | null;
  shipping_address: { city?: string; [key: string]: any } | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string | null;
  payment_status: string | null;
}

// const orders = [
//   {
//     id: 1,
//     orderNo: "#0001",
//     date: "Nov 11 at 7:56pm",
//     customer: { name: "Bola Adeleke", phone: "09035857775" },
//     amount: "₦5,000.00",
//     location: "Ikeja, Lagos",
//     progress: "Order Confirmed",
//   },
//   {
//     id: 2,
//     orderNo: "#0002",
//     date: "Nov 12 at 8:30am",
//     customer: { name: "John Doe", phone: "08012345678" },
//     amount: "₦7,500.00",
//     location: "Victoria Island, Lagos",
//     progress: "Shipped",
//   },
//   {
//     id: 3,
//     orderNo: "#0003",
//     date: "Nov 13 at 12:15pm",
//     customer: { name: "Jane Smith", phone: "08123456789" },
//     amount: "₦10,000.00",
//     location: "Lekki, Lagos",
//     progress: "Delivered",
//   },
//   {
//     id: 4,
//     orderNo: "#0004",
//     date: "Nov 14 at 3:45pm",
//     customer: { name: "Michael Brown", phone: "07098765432" },
//     amount: "₦3,000.00",
//     location: "Surulere, Lagos",
//     progress: "Pending",
//   },
//   {
//     id: 5,
//     orderNo: "#0005",
//     date: "Nov 15 at 9:20am",
//     customer: { name: "Sarah Johnson", phone: "09087654321" },
//     amount: "₦6,000.00",
//     location: "Yaba, Lagos",
//     progress: "Cancelled",
//   },
// ];

// Progress options for the Select component
const progressOptions = ["In transit", "order delivered", "order confirmed"];

// Payment Status options for the Select component
const paymentStatusOptions = ["Pending", "Paid", "Cancelled"];

export default function Orders() {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data from Supabase using Tanstack Query
  const ITEMS_PER_PAGE = 5; // Define items per page
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", currentPage, search, selectedStatus],
    queryFn: () =>
      fetchOrders({
        page: currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        search: search,
        status: selectedStatus,
      }),
    // Keep previous data while fetching new data
    placeholderData: (previousData) => previousData,
  });

  // Function to update order status in Supabase
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status.", "error");
    } else {
      console.log(`Order ${orderId} status updated to ${newStatus}`);
      showToast("Order status updated successfully.", "success");
      // Invalidate the orders query to refetch data
      queryClient.invalidateQueries({
        queryKey: ["orders", currentPage, search, selectedStatus] as const,
      });
    }
  };

  // Function to update payment status in Supabase
  const updatePaymentStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: newStatus })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating payment status:", error);
      showToast("Failed to update payment status.", "error");
    } else {
      console.log(`Order ${orderId} payment status updated to ${newStatus}`);
      showToast("Payment status updated successfully.", "success");
      // Invalidate the orders query to refetch data
      queryClient.invalidateQueries({
        queryKey: ["orders", currentPage, search, selectedStatus] as const,
      });
    }
  };

  // Filter orders based on search and selected status
  // const filteredOrders = supabaseOrders.filter(
  //   (order) =>
  //     // Filter by customer name (from display_name) or order ID, and status
  //     (order.users?.display_name
  //       ?.toLowerCase()
  //       .includes(search.toLowerCase()) ||
  //       order.id?.toLowerCase().includes(search.toLowerCase())) && // Search by customer name or order ID
  //     (selectedStatus.length === 0 ||
  //       (order.status && selectedStatus.includes(order.status)))
  // );

  // Pagination logic
  // const ITEMS_PER_PAGE = 5;
  // const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  // const paginatedOrders = filteredOrders.slice(
  //   (currentPage - 1) * ITEMS_PER_PAGE,
  //   currentPage * ITEMS_PER_PAGE
  // );

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

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
              <TableHead>Payment Status</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id?.substring(0, 8) || "N/A"}</TableCell>
                  <TableCell>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString()
                      : "N/A"}
                  </TableCell>
                  {/* Display customer information from separately fetched user data */}
                  <TableCell className="flex items-center gap-2">
                    <Avatar>
                      <AvatarFallback>
                        {order.users?.display_name
                          ? order.users.display_name
                              .split(" ")
                              .map((n: string) => n[0]) // Explicitly type 'n' as string
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {order.users?.display_name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.users?.phone || "N/A"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.total_amount
                      ? `${formatNaira(order.total_amount)}`
                      : "₦0.00"}
                  </TableCell>
                  {/* Payment Status Dropdown */}
                  <TableCell>
                    <Select
                      value={order.payment_status || "Unknown Status"} // Use order.payment_status as the value
                      onValueChange={(newValue) =>
                        updatePaymentStatus(order.id, newValue)
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select Payment Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatusOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {order.shipping_address?.city || "Unknown Location"}
                  </TableCell>

                  {/* Progress Dropdown */}
                  <TableCell>
                    <Select
                      value={order.status || "Unknown Status"} // Use order.status as the value
                      onValueChange={(newValue) =>
                        updateOrderStatus(order.id, newValue)
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {progressOptions.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // No orders message
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Section */}
      <div className="flex justify-center mt-6">
        <PaginationBar totalPages={totalPages} page={currentPage} />
      </div>
    </div>
  );
}
