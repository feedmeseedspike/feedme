"use client";

import { useState, useEffect } from "react";
import { Tables } from "@/utils/database.types";
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
  Copy,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { fetchOrders, markOrdersAsViewed, fetchOrderById } from "../../../../queries/orders";
import { useToast } from "../../../../hooks/useToast";
import { Database } from "../../../../utils/database.types";
import { format, parseISO } from "date-fns";
import { useDebounce } from "src/hooks/use-debounce";
import { useTransition } from "react";
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
  fetchOrderDetailsAction,
} from "./actions";

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
  "Cancelled",
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
  initialPaymentStatus,
  initialPaymentMethod,
  initialStartDate,
  initialEndDate,
}: {
  initialOrders: OrderRow[];
  totalOrdersCount: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
  initialStatus: Database["public"]["Enums"]["order_status_enum"][];
  initialPaymentStatus?: Database["public"]["Enums"]["payment_status_enum"][];
  initialPaymentMethod?: string[];
  initialStartDate?: string;
  initialEndDate?: string;
}) {
  // --- DRAFT STATE (for filter sheet) ---
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  // Initialize drafts from props (URL)
  const [draftSearch, setDraftSearch] = useState(initialSearch || "");
  const [draftStatus, setDraftStatus] = useState<
    Database["public"]["Enums"]["order_status_enum"][]
  >(initialStatus || []);
  const [draftPaymentStatus, setDraftPaymentStatus] = useState<
    Database["public"]["Enums"]["payment_status_enum"][]
  >(initialPaymentStatus || []);
  const [draftPaymentMethod, setDraftPaymentMethod] = useState<string[]>(initialPaymentMethod || []);
  const [draftStartDate, setDraftStartDate] = useState<string | undefined>(
    initialStartDate
  );
  const [draftEndDate, setDraftEndDate] = useState<string | undefined>(
    initialEndDate
  );
  const debouncedDraftSearch = useDebounce(draftSearch, 300);

  // --- ACTIVE STATE (used in query) ---
  const [activeFilters, setActiveFilters] = useState({
    search: initialSearch || "",
    status: initialStatus || [],
    paymentStatus: initialPaymentStatus || [],
    paymentMethod: initialPaymentMethod || [],
    startDate: initialStartDate,
    endDate: initialEndDate,
  });

  // Sync active filters from props (when URL changes)
  useEffect(() => {
    setActiveFilters({
      search: initialSearch || "",
      status: initialStatus || [],
      paymentStatus: initialPaymentStatus || [],
      paymentMethod: initialPaymentMethod || [],
      startDate: initialStartDate,
      endDate: initialEndDate,
    });
    // Also sync drafts if sheet is closed to keep them fresh
    if (!isSheetOpen) {
       setDraftSearch(initialSearch || "");
       setDraftStatus(initialStatus || []);
       setDraftPaymentStatus(initialPaymentStatus || []);
       setDraftPaymentMethod(initialPaymentMethod || []);
       setDraftStartDate(initialStartDate);
       setDraftEndDate(initialEndDate);
    }
  }, [
    initialSearch, 
    initialStatus, 
    initialPaymentStatus, 
    initialPaymentMethod, 
    initialStartDate, 
    initialEndDate, 
    isSheetOpen
  ]);
  const [filterVersion, setFilterVersion] = useState(0);

  // --- LOADING STATE FOR ROW UPDATES ---
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState<string | null>(
    null
  );
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState<
    string | null
  >(null);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const page = currentPage;
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();



  // --- URL SYNC FOR DEEP LINKING ---
  // Sync URL with Selected Order
  useEffect(() => {
    const orderIdParam = searchParams.get("orderId");
    if (orderIdParam && (!selectedOrder || selectedOrder.id !== orderIdParam)) {
      handleOrderClick(orderIdParam);
    } else if (!orderIdParam && isOrderDetailOpen) {
       setIsOrderDetailOpen(false);
    }
  }, [searchParams]);

  // Update URL when drawer state changes
  const updateUrlWithOrderId = (orderId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (orderId) {
      params.set("orderId", orderId);
    } else {
      params.delete("orderId");
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const handleOrderClick = async (orderId: string) => {
    // 1. Try to find in current list
    let basicOrderData = data?.data?.find((order: any) => order.id === orderId);

    // 2. Setup initial drawer state
    setIsOrderDetailOpen(true);
    // If not in list, show loading state immediately without basic data
    setSelectedOrder(basicOrderData ? {
      ...basicOrderData,
      loading: false,
      loadingItems: true,
       order_items: [],
    } : {
      id: orderId,
      loading: true, // Full loading state
      loadingItems: true,
      order_items: [],
    });

    // 3. Update URL
    // We only update if the param isn't already there to avoid infinite loops with the useEffect above
    if (searchParams.get("orderId") !== orderId) {
        updateUrlWithOrderId(orderId);
    }

    try {
      // 4. Fetch User & Order Details (Unified fetch or separate?)
      // We'll use the existing action which fetches everything
      const fullOrderData = await fetchOrderDetailsAction(orderId);
      
      if (!fullOrderData) {
         showToast("Order details could not be found.", "error");
         setIsOrderDetailOpen(false);
         updateUrlWithOrderId(null);
         return;
      }

      setSelectedOrder((prev: any) => ({
        ...prev,
        ...fullOrderData,
        loading: false, // Ensure loading is False now
        order_items: fullOrderData?.order_items || [],
        loadingItems: false,
      }));
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      showToast("Failed to fetch order details", "error");
      // Don't close immediately so user sees error, but maybe clear loading?
      setSelectedOrder((prev: any) => ({ ...prev, loading: false, loadingItems: false }));
    }
  };

  // Close handler to clean up URL
  const handleCloseDrawer = (open: boolean) => {
      setIsOrderDetailOpen(open);
      if (!open) {
          updateUrlWithOrderId(null);
          setSelectedOrder(null);
      }
  }

  // Extract unique payment methods from initialOrders for filter options
  const paymentMethodOptions = Array.from(
    new Set(initialOrders.map((o) => o.payment_method).filter(Boolean))
  ) as string[];

  // --- APPLY FILTERS ---
  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Search
    if (draftSearch) params.set("search", draftSearch);
    else params.delete("search");
    
    // Status
    params.delete("status");
    draftStatus.forEach(s => params.append("status", s));

    // Payment Status
    params.delete("paymentStatus");
    draftPaymentStatus.forEach(s => params.append("paymentStatus", s));

    // Payment Method
    params.delete("paymentMethod");
    draftPaymentMethod.forEach(s => params.append("paymentMethod", s));

    // Dates
    if (draftStartDate) params.set("startDate", draftStartDate);
    else params.delete("startDate");
    
    if (draftEndDate) params.set("endDate", draftEndDate);
    else params.delete("endDate");
    
    // Reset page to 1 on filter change
    params.set("page", "1");

    router.replace(`?${params.toString()}`);
    setIsSheetOpen(false);
  };

  // --- CLEAR FILTERS ---
  // --- CLEAR FILTERS ---
  const clearFilters = () => {
    // Clear drafts
    setDraftStatus([]);
    setDraftPaymentStatus([]);
    setDraftPaymentMethod([]);
    setDraftStartDate(undefined);
    setDraftEndDate(undefined);
    setDraftSearch("");

    // Push cleared params to URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("status");
    params.delete("paymentStatus");
    params.delete("paymentMethod");
    params.delete("startDate");
    params.delete("endDate");
    params.set("page", "1");
    
    router.replace(`?${params.toString()}`);
  };

  // --- FILTER SHEET TOGGLE ---
  const openSheet = () => setIsSheetOpen(true);
  const closeSheet = () => setIsSheetOpen(false);

  // --- useQuery ---
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", page, activeFilters, filterVersion],
    queryFn: async () => {
      console.log('Fetching orders with filters:', activeFilters);
      const result = await fetchOrders({
        page: page,
        itemsPerPage: itemsPerPage,
        ...activeFilters,
      });

      // Normalize shipping_address for client-side fetches
      if (result.data) {
        result.data = result.data.map((order: any) => ({
          ...order,
          shipping_address:
            typeof order.shipping_address === "string"
              ? (() => {
                  try {
                    return JSON.parse(order.shipping_address);
                  } catch {
                    return null;
                  }
                })()
              : order.shipping_address || null,
        }));
      }
      return result;
    },
    initialData: { data: initialOrders, count: totalOrdersCount },
    staleTime: 1000 * 60, // 1 minute
  });

  // --- AUTO-OPEN SINGLE SEARCH RESULT ---
  useEffect(() => {
    // Only run if not loading, we have an active search, and exactly one result
    if (!isLoading && activeFilters.search && data?.data && data.data.length === 1) {
      const order = data.data[0];
      
      // If the URL param is already set to this order, we are good.
      // If not, and we haven't manually closed it (need state for that?), open it.
      if (searchParams.get("orderId") !== order.id) {
         handleOrderClick(order.id);
      }
    }
  }, [data, activeFilters.search, isLoading]); // Added isLoading dependency

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Order ID copied to clipboard", "success");
  };

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
            placeholder="Search by Order ID, Customer Name..."
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
                <SheetDescription className="text-[#475467] text-sm">
                  Apply filters to table data.
                </SheetDescription>
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
                        checked={draftStatus.includes(statusValue)}
                        onCheckedChange={() => {
                          setDraftStatus((prev) =>
                            prev.includes(statusValue)
                              ? prev.filter((s) => s !== statusValue)
                              : [...prev, statusValue]
                          );
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
                      checked={draftPaymentStatus.includes(status)}
                      onCheckedChange={() => {
                        setDraftPaymentStatus((prev) =>
                          prev.includes(status)
                            ? prev.filter((s) => s !== status)
                            : [...prev, status]
                        );
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
                      checked={draftPaymentMethod.includes(method)}
                      onCheckedChange={() => {
                        setDraftPaymentMethod((prev) =>
                          prev.includes(method)
                            ? prev.filter((m) => m !== method)
                            : [...prev, method]
                        );
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
                    value={draftStartDate || ""}
                    onChange={(e) =>
                      setDraftStartDate(e.target.value || undefined)
                    }
                    className="border rounded px-2 py-1 text-sm"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={draftEndDate || ""}
                    onChange={(e) =>
                      setDraftEndDate(e.target.value || undefined)
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
                    <Button type="button" variant={"outline"} onClick={closeSheet}>
                      Cancel
                    </Button>
                    <Button type="button" className="bg-[#1B6013]" onClick={applyFilters}>
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
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Order No</TableHead>
              <TableHead className="w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-500">Date</TableHead>
              <TableHead className="min-w-[250px] text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</TableHead>
              <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Amount</TableHead>
              <TableHead className="w-[170px] text-xs font-semibold uppercase tracking-wider text-gray-500">Payment Status</TableHead>
              <TableHead className="max-w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-500">Location</TableHead>
              <TableHead className="w-[170px] text-xs font-semibold uppercase tracking-wider text-gray-500">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: itemsPerPage }).map((_, index) => (
                <TableRow key={index} className="h-16">
                  <TableCell><div className="h-4 bg-gray-100 rounded w-16"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-100 rounded w-24"></div></TableCell>
                  <TableCell><div className="flex items-center gap-3"><div className="h-9 w-9 circle bg-gray-100"></div><div className="space-y-1"><div className="h-3 bg-gray-100 w-24"></div><div className="h-3 bg-gray-100 w-32"></div></div></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-100 rounded w-16"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-100 rounded w-24"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-100 rounded w-32"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-100 rounded w-24"></div></TableCell>
                </TableRow>
              ))
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((order: any) => (
                <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-gray-50/80 transition-colors h-16 group"
                    onClick={() => handleOrderClick(order.id)}
                  >
                    <TableCell className="font-mono text-xs font-medium text-blue-600">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:underline">#{order.id?.substring(0, 8)}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(order.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                      {(() => {
                        if (!order.created_at) return "N/A";
                        try {
                          const date = new Date(order.created_at);
                          return isNaN(date.getTime()) ? "Invalid" : format(date, "MMM d, yyyy");
                        } catch {
                          return "Error";
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9 border border-gray-200">
                          <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-600">
                            {(() => {
                               let name = "Unknown";
                               if (order.profiles?.display_name) name = order.profiles.display_name;
                               else if (order.shipping_address && typeof order.shipping_address === 'object' && 'fullName' in order.shipping_address) name = (order.shipping_address as any).fullName;
                               return name.substring(0, 2).toUpperCase();
                            })()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col max-w-[180px]">
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {order.profiles?.display_name || (order.shipping_address as any)?.fullName || "Unknown Customer"}
                          </span>
                          <span className="text-xs text-gray-500 truncate">
                            {order.profiles?.email || (order.shipping_address as any)?.email || ""}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-sm text-gray-900">
                      {order.total_amount ? formatNaira(Number(order.total_amount)) : "₦0.00"}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Select
                        value={order.payment_status || "Pending"}
                        onValueChange={(val) => updatePaymentStatus(order.id, val as any)}
                        disabled={updatingPaymentStatus === order.id}
                      >
                        <SelectTrigger className={`h-8 w-[140px] text-xs border-transparent bg-opacity-10 ${
                          order.payment_status === 'Paid' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 
                          order.payment_status === 'Cancelled' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 
                          'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        } focus:ring-0 rounded-full px-3`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="truncate text-xs text-gray-600" title={
                         order.shipping_address && typeof order.shipping_address === 'object' 
                         ? [order.shipping_address.street, order.shipping_address.city].filter(Boolean).join(", ")
                         : "No address"
                      }>
                        {order.shipping_address && typeof order.shipping_address === 'object' 
                         ? [order.shipping_address.street, order.shipping_address.city].filter(Boolean).join(", ")
                         : <span className="text-gray-400 italic">No address</span>}
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                       <Select
                        value={order.status || "order confirmed"}
                        onValueChange={(val) => updateOrderStatus(order.id, val as any)}
                        disabled={updatingOrderStatus === order.id}
                      >
                        <SelectTrigger className="h-8 w-[160px] text-xs border-gray-200 bg-white">
                          <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${
                               order.status === 'order delivered' ? 'bg-green-500' :
                               order.status === 'In transit' ? 'bg-blue-500' :
                               order.status === 'Cancelled' ? 'bg-red-500' : 'bg-gray-400'
                             }`} />
                             <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {progressOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
              ))
            ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-gray-500">
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

      {/* Order Detail Drawer */}
      <Sheet open={isOrderDetailOpen} onOpenChange={handleCloseDrawer}>
        <SheetContent
          side="left"
          className="w-[600px] sm:max-w-[600px] overflow-y-auto"
        >
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>
              {selectedOrder?.loading
                ? "Loading Order..."
                : `Order #${selectedOrder?.id?.substring(0, 8) || "N/A"}`}
            </SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => handleCloseDrawer(false)}>
                <X className="h-5 w-5" />
            </Button>
          </SheetHeader>

          {selectedOrder?.loading ? (
            <div className="mt-6 space-y-4">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 p-3 border rounded">
                      <div className="w-12 h-12 bg-gray-200 rounded"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : selectedOrder ? (
            <div className="mt-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Customer Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong>{" "}
                    {(() => {
                      if (selectedOrder.profiles?.display_name) return selectedOrder.profiles.display_name;
                      if (selectedOrder.shipping_address && typeof selectedOrder.shipping_address === 'object' && 'fullName' in selectedOrder.shipping_address) {
                        return (selectedOrder.shipping_address as any).fullName || "Unknown User";
                      }
                      return "Unknown User";
                    })()}
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                     {(() => {
                       if (selectedOrder.shipping_address && typeof selectedOrder.shipping_address === 'object' && 'email' in selectedOrder.shipping_address) {
                         return (selectedOrder.shipping_address as any).email || "N/A";
                       }
                       return "N/A";
                    })()}
                  </p>
                  <p>
                    <strong>Phone:</strong>{" "}
                     {(() => {
                       if (selectedOrder.shipping_address && typeof selectedOrder.shipping_address === 'object' && 'phone' in selectedOrder.shipping_address) {
                         return (selectedOrder.shipping_address as any).phone || "N/A";
                       }
                       return "N/A";
                    })()}
                  </p>
                  <p>
                    <strong>User ID:</strong> {selectedOrder.user_id || "N/A"}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                     {(() => {
                        const addr = selectedOrder.shipping_address;
                        if (!addr || typeof addr !== 'object') return "N/A";
                        // Construct address string if fields available
                        const parts = [
                            (addr as any).street,
                            (addr as any).location || (addr as any).local_government,
                            (addr as any).city,
                            (addr as any).state
                        ].filter(Boolean);
                        
                        return parts.length > 0 ? parts.join(", ") : "N/A";
                     })()}
                  </p>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Status:</strong> {selectedOrder.status || "N/A"}
                  </p>
                  <p>
                    <strong>Payment Status:</strong>{" "}
                    {selectedOrder.payment_status || "N/A"}
                  </p>
                  {selectedOrder.vouchers && (
                    <p>
                      <strong>Voucher Applied:</strong>{" "}
                      <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                        {selectedOrder.vouchers.code} ({selectedOrder.vouchers.discount_value}% OFF)
                      </span>
                    </p>
                  )}
                  <p>
                    <strong>Payment Method:</strong>{" "}
                    {selectedOrder.payment_method || "N/A"}
                  </p>
                  <p>
                    <strong>Subtotal:</strong>{" "}
                    {formatNaira(
                      (selectedOrder.order_items || []).reduce(
                        (sum: number, item: any) =>
                          sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
                        0
                      )
                    )}
                  </p>
                  {selectedOrder.delivery_fee !== null && selectedOrder.delivery_fee !== undefined && (
                    <p>
                      <strong>Delivery Fee:</strong>{" "}
                      {formatNaira(Number(selectedOrder.delivery_fee))}
                    </p>
                  )}
                   {(() => {
                      const subtotal = (selectedOrder.order_items || []).reduce(
                        (sum: number, item: any) =>
                          sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
                        0
                      );
                      const delivery = Number(selectedOrder.delivery_fee || 0);
                      const total = Number(selectedOrder.total_amount || 0);
                      const discount = (subtotal + delivery) - total;

                      if (discount > 1) { // Use > 1 to avoid floating point tiny diffs
                        return (
                          <p className="text-green-600">
                            <strong>Discount:</strong>{" "}
                            -{formatNaira(discount)}
                          </p>
                        )
                      }
                      return null;
                  })()}
                  <p>
                    <strong>Total Amount:</strong>{" "}
                    {formatNaira(Number(selectedOrder.total_amount || 0))}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {(() => {
                      if (!selectedOrder.created_at) return "N/A";
                      try {
                        const date = new Date(selectedOrder.created_at);
                        return isNaN(date.getTime()) ? "Invalid Date" : date.toLocaleString();
                      } catch {
                        return "Date Error";
                      }
                    })()}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Order Items ({selectedOrder.order_items?.length || 0})
                  {selectedOrder.loadingItems && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      Loading...
                    </span>
                  )}
                </h3>
                <div className="space-y-3">
                  {selectedOrder.loadingItems ? (
                    // Loading skeleton for items
                    [1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex gap-3 p-3 border rounded animate-pulse"
                      >
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    ))
                  ) : (selectedOrder.order_items || []).length > 0 ? (
                    (selectedOrder.order_items || []).map((item: any) => (
                      <div
                        key={item.id}
                        className="flex gap-3 p-3 border rounded"
                      >
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.products?.images?.[0] ? (
                            <img
                              src={item.products.images[0]}
                              alt={item.products.name || "Item"}
                              className="w-full h-full object-cover"
                            />
                          ) : item.bundles?.thumbnail_url ? (
                            <img
                              src={item.bundles.thumbnail_url}
                              alt={item.bundles.name || "Bundle"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                              Item
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {item.products?.name ||
                              item.bundles?.name ||
                              item.offers?.title ||
                              "Order Item"}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            Quantity: {item.quantity} ×{" "}
                            {formatNaira(Number(item.price || 0))}
                          </p>
                          {item.option && (
                            <div className="mt-2 text-xs text-gray-600">
                              {item.option.name && (
                                <div className="mb-2">
                                  <span className="font-medium">
                                    Variation:
                                  </span>{" "}
                                  {item.option.name}
                                </div>
                              )}
                              {item.option.customizations && (
                                <div>
                                  <div className="font-medium mb-1">
                                    Customizations:
                                  </div>
                                  {Object.entries(
                                    item.option.customizations
                                  ).map(([key, value]) => (
                                    <div key={key} className="ml-2">
                                      •{" "}
                                      {key
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                      :{" "}
                                      {String(value)
                                        .replace(/_/g, " ")
                                        .replace(/\b\w/g, (l) =>
                                          l.toUpperCase()
                                        )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatNaira(Number(item.price || 0) * Number(item.quantity))}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No items found for this order
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
