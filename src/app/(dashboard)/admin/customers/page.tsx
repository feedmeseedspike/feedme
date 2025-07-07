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
import CustomersTable from "./CustomersTable";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const currentPage = Number(searchParams?.page) || 1;
  const ITEMS_PER_PAGE = 10;
  const search = searchParams?.search || "";

  const { data, count } = await fetchCustomers({
    page: currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
    search: search || undefined,
  });
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);

  return (
    <div className="p-4">
      <h2 className="text-3xl font-semibold mb-4">Customers</h2>

      {/* Search Bar */}
      <form
        className="flex items-center justify-between mb-4"
        action=""
        method="get"
      >
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search customers..."
            className="pl-10"
            name="search"
            defaultValue={search}
          />
        </div>
        <button
          type="submit"
          className="ml-4 px-4 py-2 bg-[#1B6013] text-white rounded-lg font-semibold"
        >
          Search
        </button>
      </form>

      {/* Customers Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Birthday</TableHead>
              <TableHead>Favorite Fruit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((customer: any) => {
                const {
                  id = "",
                  display_name = "",
                  email = "",
                  birthday = "",
                  favorite_fruit = "",
                  avatar_url = "",
                  created_at = "",
                  addresses = [],
                } = customer;
                return (
                  <TableRow key={id} className="hover:bg-gray-100">
                    <TableCell>
                      {id ? (
                        <Link
                          href={`/admin/customers/${id}`}
                          className="text-blue-600 underline"
                        >
                          {id.substring(0, 8)}...
                        </Link>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={avatar_url || ""} alt="Avatar" />
                        <AvatarFallback>
                          {display_name
                            ? display_name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()
                            : ""}
                        </AvatarFallback>
                      </Avatar>
                      {display_name || "N/A"}
                    </TableCell>
                    <TableCell>{email || "N/A"}</TableCell>
                    <TableCell>
                      {addresses && addresses.length > 0 && addresses[0]?.phone
                        ? addresses[0].phone
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {created_at ? format(new Date(created_at), "PPP") : "N/A"}
                    </TableCell>
                    <TableCell>
                      ₦{Math.floor(Math.random() * 100000).toLocaleString()}
                    </TableCell>
                    <TableCell>{Math.floor(Math.random() * 50)}</TableCell>
                    <TableCell>
                      {addresses && addresses.length > 0 && addresses[0]?.city
                        ? addresses[0].city
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {birthday ? format(new Date(birthday), "PPP") : "N/A"}
                    </TableCell>
                    <TableCell>{favorite_fruit || "N/A"}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
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
