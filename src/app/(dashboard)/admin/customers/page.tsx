"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "../../../../queries/customers";
import { Tables } from "../../../../utils/database.types";
import { format } from "date-fns";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Input } from "@components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Search } from "lucide-react";
import PaginationBar from "@components/shared/pagination";

export default function CustomersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentPage = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = 10; // You can adjust this

  const { data, isLoading, error } = useQuery<{
    data: Tables<"users">[] | null;
    count: number | null;
  }>({
    queryKey: ["customers", currentPage, search],
    queryFn: () =>
      fetchCustomers({
        page: currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        search,
      }),
    placeholderData: (previousData) => previousData,
  });

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      newSearchParams.set("search", e.target.value);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.set("page", "1"); // Reset to first page on new search
    router.push(`?${newSearchParams.toString()}`);
  };

  if (error) return <div>Error loading customers</div>; // Basic error handling

  return (
    <div className="p-4">
      <h2 className="text-3xl font-semibold mb-4">Customers</h2>

      {/* Search Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search customers..."
            className="pl-10"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        {/* Add other filter/sort options here if needed */}
      </div>

      {/* Customers Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Total Amount Spent</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Location</TableHead>
              {/* Add other relevant customer info headers */}
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
                  <TableCell className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
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
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  {/* Add skeleton cells for other columns */}
                </TableRow>
              ))
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((customer: Tables<"users">) => (
              <TableRow
                key={customer.id}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => router.push(`/admin/customers/${customer.id}`)}
              >
                  <TableCell>
                    {customer.id ? `${customer.id.substring(0, 8)}...` : "N/A"}
                </TableCell>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      {/* You might need to add an avatar_url column to your users table */}
                      <AvatarImage src="" alt="Avatar" />
                      <AvatarFallback>
                        {customer.display_name
                          ? customer.display_name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()
                          : ""}
                      </AvatarFallback>
                    </Avatar>
                    {customer.display_name || "N/A"}
                </TableCell>
                  <TableCell>{customer.email || "N/A"}</TableCell>
                  <TableCell>{customer.phone || "N/A"}</TableCell>
                  <TableCell>
                    {customer.created_at
                      ? format(new Date(customer.created_at), "PPP")
                      : "N/A"}
                </TableCell>
                  <TableCell>
                    ₦{Math.floor(Math.random() * 100000).toLocaleString()}
                </TableCell>
                  <TableCell>{Math.floor(Math.random() * 50)}</TableCell>
                  <TableCell>
                    {(customer.address as any)?.city || "N/A"}
                </TableCell>
                </TableRow>
              ))
            ) : (
              // No customers message
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No customers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <PaginationBar page={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
