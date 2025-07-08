"use client";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { format } from "date-fns";

export default function CustomersTable({ data }: { data: any[] }) {
  return (
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
              <TableRow
                key={id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  (window.location.href = `/admin/customers/${id}`)
                }
              >
                <TableCell>{id ? `${id.substring(0, 8)}...` : "N/A"}</TableCell>
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
                  {/* Display phone from the first address if available */}
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
                  {/* Display city from the first address if available */}
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
  );
}
