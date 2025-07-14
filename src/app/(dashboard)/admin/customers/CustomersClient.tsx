"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import CustomersTable from "./CustomersTable";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
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
import { ListFilter, X, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { debounce } from "lodash";
import PaginationBar from "../../../../components/shared/pagination";

const sortOptions = [
  { value: "created_at:desc", label: "Newest First", icon: ChevronDown },
  { value: "created_at:asc", label: "Oldest First", icon: ChevronUp },
  { value: "display_name:asc", label: "Name A-Z", icon: ChevronUp },
  { value: "display_name:desc", label: "Name Z-A", icon: ChevronDown },
];

const roleOptions = [
  { value: "buyer", label: "Buyer" },
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
];

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function CustomersClient({
  initialCustomers,
  totalCustomersCount,
  itemsPerPage,
  currentPage,
  initialSearch,
  initialRole,
  initialStatus,
  initialSortBy,
  initialSortOrder,
}: {
  initialCustomers: any[];
  totalCustomersCount: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
  initialRole: string;
  initialStatus: string;
  initialSortBy: string;
  initialSortOrder: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State management
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedRole, setSelectedRole] = useState(initialRole || "");
  const [selectedStatus, setSelectedStatus] = useState(initialStatus || "");
  const [sortBy, setSortBy] = useState(initialSortBy || "created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    (initialSortOrder as "asc" | "desc") || "desc"
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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
        } else {
          newSearchParams.set(key, String(value));
        }
      });
      router.push(`?${newSearchParams.toString()}`);
    },
    [searchParams, router]
  );

  // Debounced search function
  const debouncedSearch = useRef(
    debounce((searchTerm: string) => {
      updateURL({ search: searchTerm, page: 1 });
    }, 300)
  );

  useEffect(() => {
    debouncedSearch.current = debounce((searchTerm: string) => {
      updateURL({ search: searchTerm, page: 1 });
    }, 300);
    return () => {
      debouncedSearch.current.cancel?.();
    };
  }, [updateURL]);

  // Event handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    debouncedSearch.current(newSearch);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split(":");
    setSortBy(field);
    setSortOrder(order as "asc" | "desc");
    updateURL({ sortBy: field, sortOrder: order, page: 1 });
  };

  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    updateURL({ role: value, page: 1 });
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    updateURL({ status: value, page: 1 });
  };

  const clearAllFilters = () => {
    setSelectedRole("");
    setSelectedStatus("");
    updateURL({ role: "", status: "", page: 1 });
  };

  // Render
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={handleSearchChange}
            className="w-full md:w-64"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFilterSheetOpen(true)}
            aria-label="Open filters"
          >
            <ListFilter className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={`${sortBy}:${sortOrder}`}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent side="left" className="w-[300px]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <div className="font-medium mb-2">Role</div>
              <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="font-medium mb-2">Status</div>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="mt-8">
            <Button variant="outline" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-2" /> Clear Filters
            </Button>
          </SheetFooter>
        </SheetContent>
        <SheetTrigger asChild />
      </Sheet>
      {/* Customers Table */}
      <CustomersTable data={initialCustomers || []} />
      {/* Pagination Bar */}
      {totalCustomersCount > itemsPerPage && (
        <div className="mt-4 flex justify-center">
          <PaginationBar
            page={page}
            totalPages={Math.ceil(totalCustomersCount / itemsPerPage)}
          />
        </div>
      )}
    </div>
  );
}
