export const dynamic = "force-dynamic";

import { fetchCustomers } from "../../../../queries/customers";
import { Tables } from "../../../../utils/database.types";
import { format } from "date-fns";
import PaginationBar from "@components/shared/pagination";
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
import Link from "next/link";
import CustomersClient from "./CustomersClient";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: any;
}) {
  // Fetch customers and count, handle search, filter, sort, and pagination from searchParams
  const page = parseInt(searchParams.page) || 1;
  const itemsPerPage = 20;
  const search = searchParams.search || "";
  const role = searchParams.role || "";
  const status = searchParams.status || "";
  const sortBy = searchParams.sortBy || "created_at";
  const sortOrder = searchParams.sortOrder || "desc";

  // Replace with your actual fetchCustomers implementation
  const { data: initialCustomers = [], count: totalCustomersCount = 0 } =
    await fetchCustomers({
      page,
      itemsPerPage,
      search,
    });

  return (
    <div className="space-y-4">
      <CustomersClient
        initialCustomers={initialCustomers || []}
        totalCustomersCount={totalCustomersCount || 0}
        itemsPerPage={itemsPerPage}
        currentPage={page}
        initialSearch={search}
        initialRole={role}
        initialStatus={status}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
      />
    </div>
  );
}
