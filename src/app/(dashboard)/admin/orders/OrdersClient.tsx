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
import PaginationBar from "@components/shared/pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchOrders, markOrdersAsViewed } from "../../../../queries/orders";
import { useToast } from "../../../../hooks/useToast";
import { Database } from "../../../../utils/database.types";
import { format, parseISO } from "date-fns";
import { useDebounce } from "src/hooks/use-debounce";
import { useTransition } from "react";
import { updateOrderStatusAction, updatePaymentStatusAction } from "./actions";

interface Order {
  id: string;
  user_id: string | null;
  status:
    | "In transit"
    | "order delivered"
    | "order confirmed"
    | "Cancelled"
    | null;
  total_amount: number | null;
  voucher_id: string | null;
  shipping_address: { city?: string | null; [key: string]: any } | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string | null;
  payment_status: "Pending" | "Paid" | "Cancelled" | null;
  users: { display_name: string | null } | null;
  admin_viewed: boolean;
}

type OrderRow = Omit<Order, "created_at" | "updated_at"> & {
  created_at: string | null;
  updated_at: string | null;
  delivery_fee?: number | null;
  local_government?: string | null;
  total_amount_paid?: number | null;
  reference?: string | null;
};

const progressOptions: Database["public"]["Enums"]["order_status_enum"][] = [
  "In transit",
  "order delivered",
  "order confirmed",
];

const paymentStatusOptions: Database["public"]["Enums"]["payment_status_enum"][] =
  ["Pending", "Paid", "Cancelled"];

export default function OrdersClient({
  initialOrders,
  totalOrdersCount,
  itemsPerPage,
  currentPage,
  initialSearch,
  initialStatus,
}: {
  initialOrders: OrderRow[];
  totalOrdersCount: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
  initialStatus: Database["public"]["Enums"]["order_status_enum"][];
}) {
  // --- DRAFT STATE (for filter sheet) ---
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draftSearch, setDraftSearch] = useState(initialSearch || "");
  const [draftStatus, setDraftStatus] = useState<
    Database["public"]["Enums"]["order_status_enum"][]
  >(initialStatus || []);
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<
    Database["public"]["Enums"]["payment_status_enum"][]
  >([]);
  const [draftPaymentMethod, setDraftPaymentMethod] = useState<string[]>([]);
  const [draftStartDate, setDraftStartDate] = useState<string | undefined>(
    undefined
  );
  const [draftEndDate, setDraftEndDate] = useState<string | undefined>(
    undefined
  );
  const debouncedDraftSearch = useDebounce(draftSearch, 300);

  // --- ACTIVE STATE (used in query) ---
  const [activeFilters, setActiveFilters] = useState({
    search: initialSearch || "",
    status: initialStatus || [],
    paymentStatus: [] as Database["public"]["Enums"]["payment_status_enum"][],
    paymentMethod: [] as string[],
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined,
  });
  const [filterVersion, setFilterVersion] = useState(0);

  // --- LOADING STATE FOR ROW UPDATES ---
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(
    null
  );
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<
    string | null
  >(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const page = currentPage;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // Extract unique payment methods from initialOrders for filter options
  const paymentMethodOptions = Array.from(
    new Set(initialOrders.map((o) => o.payment_method).filter(Boolean))
  ) as string[];

  // --- APPLY FILTERS ---
  const applyFilters = () => {
    setActiveFilters({
      search: debouncedDraftSearch,
      status: draftStatus,
      paymentStatus: draftPaymentStatus,
      paymentMethod: draftPaymentMethod,
      startDate: draftStartDate,
      endDate: draftEndDate,
    });
    setFilterVersion((v) => v + 1);
    setIsSheetOpen(false);
  };

  // --- CLEAR FILTERS ---
  const clearFilters = () => {
    setDraftStatus([]);
    setDraftPaymentStatus([]);
    setDraftPaymentMethod([]);
    setDraftStartDate(undefined);
    setDraftEndDate(undefined);
    setDraftSearch("");
    setActiveFilters({
      search: "",
      status: [],
      paymentStatus: [],
      paymentMethod: [],
      startDate: undefined,
      endDate: undefined,
    });
  };

  // --- FILTER SHEET TOGGLE ---
  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  // --- useQuery ---
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", page, activeFilters, filterVersion],
    queryFn: () => {
      console.log("[FETCH ORDERS PARAMS]", {
        page,
        itemsPerPage,
        ...activeFilters,
      });
      return fetchOrders({
        page: page,
        itemsPerPage: itemsPerPage,
        ...activeFilters,
      });
    },
    placeholderData: (previousData) => previousData,
    initialData: {
      data: initialOrders.map((order) => ({
        ...order,
        order_id: order.id ?? null, // Add order_id mapping from id
        delivery_fee: order.delivery_fee ?? null,
        local_government: order.local_government ?? null,
        total_amount_paid: order.total_amount_paid ?? null,
        profiles: (order as any).profiles ?? null, // Ensure profiles is always present
        reference: order.reference ?? null, // Ensure reference is always present
      })),
      count: totalOrdersCount,
    },
  });

  // Refactored: Use server actions for updating order status
  const updateOrderStatus = (
    orderId: string,
    newStatus: Database["public"]["Enums"]["order_status_enum"]
  ) => {
    setUpdatingOrderStatus(orderId);
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, newStatus);
        showToast("Order status updated successfully.", "success");
        // Optimistically update the cache
        queryClient.setQueryData(
          ["orders", page, activeFilters, filterVersion],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((order: OrderRow) =>
                order.id === orderId ? { ...order, status: newStatus } : order
              ),
            };
          }
        );
      } catch (err: unknown) {
        showToast(
          (err as Error).message || "Failed to update order status.",
          "error"
        );
      } finally {
        setUpdatingOrderStatus(null);
      }
    });
  };

  // Refactored: Use server actions for updating payment status
  const updatePaymentStatus = (
    orderId: string,
    newStatus: Database["public"]["Enums"]["payment_status_enum"]
  ) => {
    setUpdatingPaymentStatus(orderId);
    startTransition(async () => {
      try {
        await updatePaymentStatusAction(orderId, newStatus);
        showToast("Payment status updated successfully.", "success");
        // Optimistically update the cache
        queryClient.setQueryData(
          ["orders", page, activeFilters, filterVersion],
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((order: OrderRow) =>
                order.id === orderId
                  ? { ...order, payment_status: newStatus }
                  : order
              ),
            };
          }
        );
      } catch (err: unknown) {
        showToast(
          (err as Error).message || "Failed to update payment status.",
          "error"
        );
      } finally {
        setUpdatingPaymentStatus(null);
      }
    });
  };

  const totalPages = Math.ceil((data?.count || 0) / itemsPerPage);

  // Toggle filter for status
  const toggleFilter = (value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      status: (
        prev.status as Database["public"]["Enums"]["order_status_enum"][]
      ).includes(value as Database["public"]["Enums"]["order_status_enum"])
        ? (
            prev.status as Database["public"]["Enums"]["order_status_enum"][]
          ).filter(
            (item) =>
              item !==
              (value as Database["public"]["Enums"]["order_status_enum"])
          )
        : [
            ...(prev.status as Database["public"]["Enums"]["order_status_enum"][]),
            value as Database["public"]["Enums"]["order_status_enum"],
          ],
    }));
  };

  // After data is loaded, mark all visible unviewed orders as viewed
  useEffect(() => {
    // Temporarily disabled due to missing admin_viewed column
    // if (data && data.data) {
    //   const unviewedIds = data.data
    //     .filter((order) => order.admin_viewed === false)
    //     .map((order) => order.id);
    //   if (unviewedIds.length > 0) {
    //     markOrdersAsViewed(unviewedIds);
    //   }
    // }
  }, [data]);

  console.log("[TABLE DATA]", data?.data);

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
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Sheet */}
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <button
                className="flex items-center gap-1 px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]"
                onClick={openSheet}
              >
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
                {progressOptions.map((status) => {
                  const statusValue =
                    status as Database["public"]["Enums"]["order_status_enum"];
                  return (
                    <div
                      key={status}
                      className="flex items-center gap-2 mb-2 pl-2"
                    >
                      <Checkbox
                        id={status}
                        className="size-4 !rounded-md border-[#D0D5DD]"
                        checked={activeFilters.status.includes(statusValue)}
                        onCheckedChange={() => {
                          toggleFilter(status);
                        }}
                      />
                      <label className="font-medium text-sm" htmlFor={status}>
                        {status}
                      </label>
                    </div>
                  );
                })}

                <h3 className="text-sm text-[#344054] font-medium mb-2 mt-6">
                  Payment Status
                </h3>
                {paymentStatusOptions.map((status) => (
                  <div
                    key={status}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={`payment-status-${status}`}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={activeFilters.paymentStatus.includes(status)}
                      onCheckedChange={() => {
                        setActiveFilters((prev) => ({
                          ...prev,
                          paymentStatus: prev.paymentStatus.includes(status)
                            ? prev.paymentStatus.filter((s) => s !== status)
                            : [...prev.paymentStatus, status],
                        }));
                      }}
                    />
                    <label
                      className="font-medium text-sm"
                      htmlFor={`payment-status-${status}`}
                    >
                      {status}
                    </label>
                  </div>
                ))}

                <h3 className="text-sm text-[#344054] font-medium mb-2 mt-6">
                  Payment Method
                </h3>
                {paymentMethodOptions.map((method) => (
                  <div
                    key={method}
                    className="flex items-center gap-2 mb-2 pl-2"
                  >
                    <Checkbox
                      id={`payment-method-${method}`}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={activeFilters.paymentMethod.includes(method)}
                      onCheckedChange={() => {
                        setActiveFilters((prev) => ({
                          ...prev,
                          paymentMethod: prev.paymentMethod.includes(method)
                            ? prev.paymentMethod.filter((m) => m !== method)
                            : [...prev.paymentMethod, method],
                        }));
                      }}
                    />
                    <label
                      className="font-medium text-sm"
                      htmlFor={`payment-method-${method}`}
                    >
                      {method}
                    </label>
                  </div>
                ))}

                <h3 className="text-sm text-[#344054] font-medium mb-2 mt-6">
                  Date Range
                </h3>
                <div className="flex gap-2 items-center mb-4">
                  <input
                    type="date"
                    value={activeFilters.startDate || ""}
                    onChange={(e) =>
                      setActiveFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value || undefined,
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={activeFilters.endDate || ""}
                    onChange={(e) =>
                      setActiveFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value || undefined,
                      }))
                    }
                    className="border rounded px-2 py-1 text-sm"
                  />
                </div>
              </div>
              <SheetFooter className="border-t pt-4 !w-full">
                <div className="font-semibold text-sm flex justify-between items-end px-4">
                  <div
                    className="text-[#B42318] cursor-pointer"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </div>
                  <div className="flex gap-2">
                    <Button variant={"outline"} onClick={closeSheet}>
                      Cancel
                    </Button>
                    <Button className="bg-[#1B6013]" onClick={applyFilters}>
                      Apply
                    </Button>
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
              Array.from({ length: itemsPerPage }).map((_, index) => (
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
                <TableRow
                  key={order.id}
                  className={
                    // Temporarily disabled due to missing admin_viewed column
                    // order.admin_viewed === false
                    //   ? "border-2 border-gray-400"
                    //   : ""
                    ""
                  }
                >
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
                        {order.profiles?.display_name
                          ? order.profiles.display_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {order.profiles?.display_name || "Unknown User"}
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
                      value={
                        paymentStatusOptions.includes(
                          order.payment_status as any
                        )
                          ? order.payment_status!
                          : paymentStatusOptions[0]
                      }
                      onValueChange={(newValue) =>
                        updatePaymentStatus(
                          order.id,
                          newValue as Database["public"]["Enums"]["payment_status_enum"]
                        )
                      }
                      disabled={updatingPaymentStatus === order.id}
                    >
                      <SelectTrigger className="w-[150px] flex items-center justify-between">
                        {updatingPaymentStatus === order.id ? (
                          <span className="animate-spin mr-2 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full inline-block"></span>
                        ) : null}
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
                    {order.shipping_address &&
                    typeof order.shipping_address === "object" &&
                    !Array.isArray(order.shipping_address)
                      ? [
                          order.shipping_address.city,
                          order.shipping_address.state,
                          order.shipping_address.local_government,
                          order.shipping_address.country,
                          order.shipping_address.street,
                          order.shipping_address.zip,
                        ]
                          .filter(
                            (v) => v && typeof v === "string" && v.trim() !== ""
                          )
                          .join(", ") || "Unknown Location"
                      : "Unknown Location"}
                  </TableCell>

                  {/* Progress Dropdown */}
                  <TableCell>
                    <Select
                      value={
                        progressOptions.includes(order.status as any)
                          ? order.status!
                          : progressOptions[0]
                      }
                      onValueChange={(newValue) =>
                        updateOrderStatus(
                          order.id,
                          newValue as Database["public"]["Enums"]["order_status_enum"]
                        )
                      }
                      disabled={updatingOrderStatus === order.id}
                    >
                      <SelectTrigger className="w-[150px] flex items-center justify-between">
                        {updatingOrderStatus === order.id ? (
                          <span className="animate-spin mr-2 w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full inline-block"></span>
                        ) : null}
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
        <PaginationBar totalPages={totalPages} page={page} />
      </div>
    </div>
  );
}
