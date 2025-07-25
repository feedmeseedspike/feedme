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
import { useState, useEffect } from "react";
import { Checkbox } from "@components/ui/checkbox";

export default function CustomersTable({ data }: { data: any[] }) {
  const [updating, setUpdating] = useState<string | null>(null);
  const [localStaff, setLocalStaff] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLocalStaff({});
  }, [data]);

  const handleStaffToggle = async (userId: string, current: boolean) => {
    setUpdating(userId);
    setLocalStaff((prev) => ({ ...prev, [userId]: !current }));
    try {
      await fetch("/api/admin/update-staff-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isStaff: !current }),
      });
    } catch (e) {
      // Optionally show error
    } finally {
      setUpdating(null);
    }
  };

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
          <TableHead>Staff</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data && data.length > 0 ? (
          data.map((customer: any) => {
            const {
              user_id = "",
              display_name = "",
              email = "",
              birthday = "",
              favorite_fruit = "",
              avatar_url = "",
              created_at = "",
              addresses = [],
              is_staff = false,
              totalOrders = 0,
              totalAmountSpent = 0,
            } = customer;
            const staffValue =
              localStaff[user_id] !== undefined
                ? localStaff[user_id]
                : is_staff;
            return (
              <TableRow
                key={user_id}
                className="cursor-pointer hover:bg-gray-100"
                onClick={() =>
                  (window.location.href = `/admin/customers/${user_id}`)
                }
              >
                <TableCell>
                  {user_id ? `${user_id.substring(0, 8)}...` : "N/A"}
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
                  {/* Display phone from the first address if available */}
                  {addresses && addresses.length > 0 && addresses[0]?.phone
                    ? addresses[0].phone
                    : "N/A"}
                </TableCell>
                <TableCell>
                  {created_at ? format(new Date(created_at), "PPP") : "N/A"}
                </TableCell>
                <TableCell>₦{totalAmountSpent.toLocaleString()}</TableCell>
                <TableCell>{totalOrders}</TableCell>
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
                <TableCell>
                  <Checkbox
                    checked={!!staffValue}
                    onCheckedChange={() =>
                      handleStaffToggle(user_id, !!staffValue)
                    }
                    disabled={updating === user_id}
                    aria-label="Toggle staff status"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                </TableCell>
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell colSpan={11} className="text-center py-8">
              No customers found.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
