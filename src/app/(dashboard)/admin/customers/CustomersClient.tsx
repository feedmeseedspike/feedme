"use client";

import { FetchedCustomerData } from "../../../../queries/customers";
import CustomersTable from "./CustomersTable";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Download, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface CustomersClientProps {
  initialCustomers: FetchedCustomerData[];
  totalCustomersCount: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
  initialRole: string;
  initialStatus: string;
  initialStartDate: string;
  initialEndDate: string;
  initialSortBy: string;
  initialSortOrder: string;
}

export default function CustomersClient({
  initialCustomers,
  totalCustomersCount,
  itemsPerPage,
  currentPage,
  initialSearch,
  initialRole,
  initialStatus,
  initialStartDate,
  initialEndDate,
  initialSortBy,
  initialSortOrder,
}: CustomersClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Local state for search to allow debouncing
  const [search, setSearch] = useState(initialSearch);
  const [role, setRole] = useState(initialRole);
  const [status, setStatus] = useState(initialStatus);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  // Sync state with props when they change (e.g. navigation)
  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);
  
  useEffect(() => {
    setRole(initialRole);
  }, [initialRole]);
  
  useEffect(() => {
     setStatus(initialStatus);
  }, [initialStatus]);
  
  useEffect(() => {
     setStartDate(initialStartDate);
  }, [initialStartDate]);
  
  useEffect(() => {
     setEndDate(initialEndDate);
  }, [initialEndDate]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      
      // Reset page to 1 when filters change (except 'page' itself)
      if (name !== "page") {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );
  
  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== initialSearch) {
        router.push(pathname + "?" + createQueryString("search", search));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, router, pathname, createQueryString, initialSearch]);

  const handleRoleChange = (val: string) => {
    setRole(val);
    router.push(pathname + "?" + createQueryString("role", val === "all" ? "" : val));
  };
  
  const handleStatusChange = (val: string) => {
    setStatus(val);
    router.push(pathname + "?" + createQueryString("status", val === "all" ? "" : val));
  };
  
  const handleDateChange = (type: 'startDate' | 'endDate', val: string) => {
     if (type === 'startDate') setStartDate(val);
     else setEndDate(val);
     
     router.push(pathname + "?" + createQueryString(type, val));
  };

  const handlePageChange = (page: number) => {
    router.push(pathname + "?" + createQueryString("page", page.toString()));
  };
  
  const totalPages = Math.ceil(totalCustomersCount / itemsPerPage);

  const clearFilters = () => {
    setSearch("");
    setRole("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    router.push(pathname);
  };

  const handleExport = async () => {
    try {
      showToast("Preparing export...", "info");
      
      // Construct query params for the export API
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (role && role !== "all") params.append("role", role);
      if (status && status !== "all") params.append("status", status);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      const response = await fetch(`/api/admin/customers/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to export customers");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `customers_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      
      showToast("Customers exported successfully", "success");
    } catch (error) {
      console.error("Export error:", error);
      showToast("Failed to export customers", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
               Customers
               <span className="inline-flex items-center justify-center bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
                  {totalCustomersCount}
               </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                Manage your customer base, track their orders, and update detailed profile information.
            </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 md:flex-none">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
          {/* ... existing filters ... */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
             <div className="flex-1 max-w-sm">
                <Input 
                   placeholder="Search by name or email..."
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                />
             </div>
             <div className="flex items-center gap-2">
                 {(search || role || status || startDate || endDate) && (
                    <Button variant="ghost" onClick={clearFilters} size="sm" className="whitespace-nowrap text-red-600 hover:text-red-700 hover:bg-red-50">
                        Clear filters
                    </Button>
                 )}
             </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
              <div className="w-[180px] space-y-1">
                 <label className="text-xs font-medium text-gray-500 ml-1">Role</label>
                 <Select value={role || "all"} onValueChange={handleRoleChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="buyer">Buyer</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                 </Select>
              </div>

              {/* Status Filter if needed - assuming 'active', 'blocked' etc exist in your data model, 
                  but fetchedCustomers handles 'status' param so we include it */}
              <div className="w-[180px] space-y-1">
                 <label className="text-xs font-medium text-gray-500 ml-1">Status</label>
                 <Select value={status || "all"} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 ml-1">From</label>
                      <Input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => handleDateChange("startDate", e.target.value)}
                        className="w-[140px]"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 ml-1">To</label>
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => handleDateChange("endDate", e.target.value)}
                        className="w-[140px]"
                      />
                  </div>
              </div>
          </div>
      </div>

      <CustomersTable data={initialCustomers} />

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
                <PaginationPrevious 
                   onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                   className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                />
            </PaginationItem>
            
            {/* Simple pagination logic: show current, nice to have range but keeping it simple for now */}
            {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                // Show first, last, current, and adjacent
                if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                   return (
                       <PaginationItem key={page}>
                            <PaginationLink 
                                isActive={page === currentPage}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </PaginationLink>
                       </PaginationItem>
                   );
                } else if (
                    (page === currentPage - 2 && page > 1) || 
                    (page === currentPage + 2 && page < totalPages)
                ) {
                    return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>
                }
                return null;
            })}

            <PaginationItem>
                <PaginationNext 
                    onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
