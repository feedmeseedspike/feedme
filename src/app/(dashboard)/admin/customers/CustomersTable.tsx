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
import { useRouter } from "next/navigation";
import { Copy, Mail, Phone } from "lucide-react";
import { formatNaira } from "src/lib/utils";
import { useToast } from "src/hooks/useToast";

export default function CustomersTable({ data }: { data: any[] }) {
  const router = useRouter();
  const { showToast } = useToast();
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
      showToast(
        !current ? "User promoted to staff" : "User demoted from staff",
        "success"
      );
    } catch (e) {
      showToast("Failed to update staff status", "error");
      setLocalStaff((prev) => ({ ...prev, [userId]: current })); // Revert
    } finally {
      setUpdating(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("ID copied to clipboard", "success");
  };

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">ID</TableHead>
            <TableHead className="min-w-[250px] text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</TableHead>
            <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</TableHead>
            <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Value/Orders</TableHead>
            <TableHead className="w-[120px] text-xs font-semibold uppercase tracking-wider text-gray-500">Wallet/Pts</TableHead>
            <TableHead className="w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-500">Last Purchase</TableHead>
            <TableHead className="w-[150px] text-xs font-semibold uppercase tracking-wider text-gray-500">Joined</TableHead>
            <TableHead className="w-[80px] text-xs font-semibold uppercase tracking-wider text-gray-500 text-center">Staff</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((customer: any) => {
              const {
                user_id = "",
                display_name = "",
                email = "",
                avatar_url = "",
                created_at = "",
                addresses = [],
                is_staff = false,
                totalOrders = 0,
                totalAmountSpent = 0,
                wallet_balance = 0,
                loyalty_points = 0,
                lastOrderAt = null,
              } = customer;
              const staffValue =
                localStaff[user_id] !== undefined
                  ? localStaff[user_id]
                  : is_staff;
              
              const phone = addresses && addresses.length > 0 ? addresses[0].phone : null;
              const city = addresses && addresses.length > 0 ? addresses[0].city : null;

              return (
                <TableRow
                  key={user_id}
                  className="cursor-pointer hover:bg-gray-50/80 transition-colors h-16 group"
                  onClick={() => router.push(`/admin/customers/${user_id}`)}
                >
                  <TableCell className="font-mono text-xs font-medium text-blue-600">
                    <div className="flex items-center gap-2">
                      <span className="group-hover:underline" title={user_id}>
                        #{user_id ? user_id.substring(0, 8) + '...' : "N/A"}
                      </span>
                      {user_id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(user_id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity"
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-9 h-9 border border-gray-200">
                        <AvatarImage src={avatar_url || ""} alt="Avatar" />
                        <AvatarFallback className="bg-gray-100 text-xs font-medium text-gray-600">
                          {display_name
                            ? display_name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col max-w-[180px]">
                        <span className="text-sm font-medium text-gray-900 truncate" title={display_name}>
                          {display_name || "Unknown Customer"}
                        </span>
                        {city && (
                           <span className="text-xs text-gray-500 truncate">{city}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[180px]" title={email}>{email || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{phone || "—"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="font-medium text-sm text-gray-900">{formatNaira(totalAmountSpent)}</span>
                       <span className="text-[10px] text-gray-400 font-medium">{totalOrders} orders</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                       <span className="font-bold text-sm text-[#1B6013]">{formatNaira(wallet_balance)}</span>
                       <span className="text-[10px] text-gray-400 font-medium">{loyalty_points || 0} pts</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    <div className="flex flex-col">
                        <span className="font-medium">{lastOrderAt ? format(new Date(lastOrderAt), "MMM d, yyyy") : "Never"}</span>
                        {lastOrderAt && (
                           <span className="text-[10px] text-gray-400">{format(new Date(lastOrderAt), "h:mm a")}</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                    {created_at ? format(new Date(created_at), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={!!staffValue}
                      onCheckedChange={() =>
                        handleStaffToggle(user_id, !!staffValue)
                      }
                      disabled={updating === user_id}
                      aria-label="Toggle staff status"
                      className="data-[state=checked]:bg-[#1B6013] border-[#1B6013]"
                    />
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                No customers found matching your filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
