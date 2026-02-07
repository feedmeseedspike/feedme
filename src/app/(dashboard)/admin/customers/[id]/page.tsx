"use client";
export const dynamic = "force-dynamic";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  useCustomer,
  useCustomerOrders,
} from "../../../../../queries/customers";
import { Customer, Order } from "../../../../../types/customer";
import { Tables } from "../../../../../utils/database.types";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Apple,
  User,
  Mail,
  Phone,
  MapPin,
  Wallet,
  Gift,
  Ticket,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { formatNaira } from "../../../../../lib/utils";
// import { useWalletBalanceQuery, useTransactionsQuery } from "../../../../../queries/wallet"; // Replaced by admin actions
// import { useUserVouchersQuery } from "../../../../../queries/vouchers"; // Replaced by admin actions
import {
  getCustomerWalletBalanceAction,
  getCustomerTransactionsAction,
  getCustomerVouchersAction
} from "@/lib/actions/admin-dashboard.actions";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Input } from "@components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { createClient } from "@utils/supabase/client";
import { useToast } from "../../../../../hooks/useToast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Separator } from "@components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import { Calendar } from "@components/ui/calendar";
import { cn } from "../../../../../lib/utils";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";

// Progress options from the orders page (should match order_status_enum)
const progressOptions = [
  "In transit",
  "order delivered",
  "order confirmed",
  "Cancelled",
];

import { CartPrizesList, SpinEligibilityStatus } from "../components/SpinStatusHelpers";


export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = params?.id as string; // Get customer ID from URL

  // Fetch customer details using the hook
  const {
    data: customer,
    isLoading: isCustomerLoading,
    error: customerError,
  } = useCustomer(customerId);

  // Ensure customer fields are always string or string | null
  const safeCustomer = customer as typeof customer & {
    birthday?: string | null;
    favorite_fruit?: string | null;
  };

  // Define schema for form validation
  const CustomerDetailsSchema = z.object({
    display_name: z.string().optional(),
    birthday: z.string().optional().nullable(),
    favorite_fruit: z.string().optional().nullable(),
  });

  type CustomerDetailsFormData = z.infer<typeof CustomerDetailsSchema>;

  const form = useForm<CustomerDetailsFormData>({
    resolver: zodResolver(CustomerDetailsSchema),
    defaultValues: {
      display_name: safeCustomer?.display_name || "",
      birthday: safeCustomer?.birthday
        ? format(new Date(safeCustomer.birthday), "yyyy-MM-dd")
        : "",
      favorite_fruit: safeCustomer?.favorite_fruit || "",
    },
  });

  // Mutation for updating customer details
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerDetailsFormData) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: data.display_name,
          birthday: data.birthday,
          favorite_fruit: data.favorite_fruit,
        })
        .eq("user_id", customerId);

      if (error) throw error;
    },
    onSuccess: () => {
      showToast("Customer details updated successfully.", "success");
      queryClient.invalidateQueries({
        queryKey: ["customers", "detail", customerId],
      });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error) => {
      showToast(`Failed to update customer details: ${error.message}`, "error");
    },
  });

  const onSubmit = (data: CustomerDetailsFormData) => {
    updateCustomerMutation.mutate(data);
  };

  // Fetch customer orders using the hook
  const {
    data: orders,
    isLoading: isOrdersLoading,
    error: ordersError,
  } = useCustomerOrders(customerId);

  // --- NEW: WALLET & REWARDS DATA (Admin Actions) ---
  const { data: walletBalance, isLoading: isWalletLoading } = useQuery({
    queryKey: ["admin", "customer", customerId, "wallet-balance"],
    queryFn: () => getCustomerWalletBalanceAction(customerId)
  });

  const { data: vouchers, isLoading: isVouchersLoading } = useQuery({
    queryKey: ["admin", "customer", customerId, "vouchers"],
    queryFn: () => getCustomerVouchersAction(customerId)
  });

  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["admin", "customer", customerId, "transactions"],
    queryFn: () => getCustomerTransactionsAction(customerId, 1, 5)
  });
  const transactions = transactionsData?.data || [];

  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Function to update order status in Supabase
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus as Tables<"orders">["status"] })
      .eq("id", orderId);

    if (error) {
      console.error("Error updating order status:", error);
      showToast("Failed to update order status.", "error");
    } else {
      showToast("Order status updated successfully.", "success");
      // Invalidate the customer orders query to refetch data
      queryClient.invalidateQueries({
        queryKey: ["customers", "detail", customerId, "orders"],
      });
    }
  };

  if (customerError) return <div>Error loading customer details.</div>;
  if (!customer && !isCustomerLoading) return <div>Customer not found.</div>;

  return (
    <div className="p-4">
      {/* Breadcrumbs */}
      <div className="mb-4 text-sm">
        <Link href="/admin/customers" className="text-gray-500 hover:underline">
          Customers
        </Link>
        <span className="mx-1 text-gray-500">/</span>
        {isCustomerLoading ? (
          <div className="h-4 bg-gray-200 rounded w-32 inline-block"></div>
        ) : (
          <span className="font-semibold text-gray-800">
            {customer?.display_name || "N/A"}
          </span>
        )}
      </div>

      {isCustomerLoading ? (
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
      ) : (
        <h1 className="text-3xl font-semibold mb-6">
          {customer?.display_name || "N/A"}
        </h1>
      )}

      {/* Customer Details Form */}
      <Card className="border-0 shadow-lg mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="w-6 h-6 text-[#1B6013]" />
            Customer Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-[#1B6013]" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter full name"
                          className="h-10 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-md"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email (Read-only) */}
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#1B6013]" />
                    Email Address
                  </FormLabel>
                  <Input
                    value={customer?.email || "N/A"}
                    readOnly
                    className="h-10 bg-gray-50 border-gray-200 text-gray-600 rounded-md cursor-not-allowed"
                  />
                </FormItem>
                {/* Birthday Field */}
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#1B6013]" />
                        Birthday
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? format(date, "yyyy-MM-dd") : ""
                              )
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Favorite Fruit Field */}
                <FormField
                  control={form.control}
                  name="favorite_fruit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Apple className="w-4 h-4 text-[#1B6013]" />
                        Favorite Fruit
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          placeholder="e.g., Apple, Banana"
                          className="h-10 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-md"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone (Read-only from addresses) */}
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#1B6013]" />
                    Phone
                  </FormLabel>
                  <Input
                    value={
                      customer?.addresses && customer.addresses.length > 0
                        ? customer.addresses[0]?.phone || "N/A"
                        : "N/A"
                    }
                    readOnly
                    className="h-10 bg-gray-50 border-gray-200 text-gray-600 rounded-md cursor-not-allowed"
                  />
                </FormItem>
                {/* Location (Read-only from addresses) */}
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1B6013]" />
                    Location
                  </FormLabel>
                  <Input
                    value={
                      customer?.addresses && customer.addresses.length > 0
                        ? customer.addresses[0]?.city || "N/A"
                        : "N/A"
                    }
                    readOnly
                    className="h-10 bg-gray-50 border-gray-200 text-gray-600 rounded-md cursor-not-allowed"
                  />
                </FormItem>
              </div>

              <Button
                type="submit"
                className="w-full py-2 text-lg font-semibold bg-[#1B6013] text-white hover:bg-[#1B6013]/90 transition-colors rounded-md"
                disabled={updateCustomerMutation.isPending}
              >
                {updateCustomerMutation.isPending
                  ? "Updating..."
                  : "Update Details"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Wallet & Rewards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Wallet Balance Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-[#1B6013] to-[#2a8b1f] text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2 opacity-90">
              <Wallet className="w-4 h-4" />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isWalletLoading ? (
              <div className="h-10 w-32 bg-white/20 animate-pulse rounded"></div>
            ) : (
              <div className="text-3xl font-black">{formatNaira(walletBalance || 0)}</div>
            )}
            <p className="text-xs mt-2 opacity-70 italic">Available for making purchases</p>
          </CardContent>
        </Card>

        {/* Loyalty Points Card */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Gift className="w-4 h-4 text-[#f7a838]" />
              Loyalty Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{customer?.loyalty_points || 0} Points</div>
            <p className="text-xs mt-2 text-gray-400">Earned from completed orders</p>
          </CardContent>
        </Card>

        {/* Active Vouchers Card */}
        <Card className="border-0 shadow-lg bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-blue-500" />
              Active Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isVouchersLoading ? (
              <div className="h-10 w-24 bg-gray-100 animate-pulse rounded"></div>
            ) : (
              <div className="text-3xl font-black text-gray-900">{vouchers?.length || 0} Active</div>
            )}
            {vouchers && vouchers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {vouchers.slice(0, 2).map((v: any) => (
                   <span key={v.id} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">
                      {v.code}
                   </span>
                ))}
                {vouchers.length > 2 && <span className="text-[10px] text-gray-400">+{vouchers.length - 2} more</span>}
              </div>
            )}
            {(!vouchers || vouchers.length === 0) && <p className="text-xs mt-2 text-gray-400">No active vouchers found</p>}
          </CardContent>
        </Card>
      </div>

      {/* Spin & Bonus Status Section */}
      <div className="grid grid-cols-1 mb-8">
        <Card className="border-0 shadow-lg bg-indigo-50 border-indigo-100">
           <CardHeader className="pb-2">
             <CardTitle className="text-lg font-bold flex items-center gap-2 text-indigo-900">
               <Gift className="w-5 h-5 text-indigo-600 animate-pulse" />
               Spin & Bonus Status
             </CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                   <h4 className="text-sm font-bold text-gray-700 mb-2">Pending Prizes in Cart</h4>
                   <CartPrizesList customerId={customerId} />
                </div>
                <div className="flex-1 border-l pl-6 border-indigo-200">
                   <h4 className="text-sm font-bold text-gray-700 mb-2">Spin Eligibility</h4>
                   <p className="text-xs text-gray-600 mb-2">
                     Logic: Users spin after every completed order. 
                   </p>
                   {/* Checks based on recent delivered orders */}
                   <SpinEligibilityStatus customerId={customerId} />
                </div>
             </div>
           </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
           <Card className="border-0 shadow-lg h-full">
             <CardHeader>
               <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <Wallet className="w-5 h-5 text-[#1B6013]" />
                 Recent Wallet Transactions
               </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                   {isTransactionsLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                      ))
                   ) : transactions.length > 0 ? (
                      transactions.map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                           <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-lg",
                                tx.type === 'wallet_funding' || tx.description?.includes('Credit') || tx.amount > 0 
                                  ? "bg-green-100 text-green-600" 
                                  : "bg-red-100 text-red-600"
                              )}>
                                 {tx.type === 'wallet_funding' || tx.description?.includes('Credit') || tx.amount > 0 
                                   ? <ArrowUpRight className="w-4 h-4" /> 
                                   : <ArrowDownLeft className="w-4 h-4" />
                                 }
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-gray-800 line-clamp-1">{tx.description || tx.type?.replace('_', ' ') || 'Transaction'}</p>
                                 <p className="text-[10px] text-gray-500">{format(new Date(tx.created_at), "MMM d, yyyy")}</p>
                              </div>
                           </div>
                           <div className={cn(
                             "text-sm font-black text-right",
                             tx.type === 'wallet_funding' || tx.description?.includes('Credit') || tx.amount > 0 
                               ? "text-green-600" 
                               : "text-red-600"
                           )}>
                              {tx.type === 'wallet_funding' || tx.description?.includes('Credit') || tx.amount > 0 ? "+" : "-"}
                              {formatNaira(Math.abs(tx.amount))}
                           </div>
                        </div>
                      ))
                   ) : (
                      <p className="text-center py-8 text-gray-400 text-sm">No transaction history found</p>
                   )}
                </div>
                {transactions.length > 0 && (
                   <Button variant="ghost" size="sm" className="w-full mt-4 text-[#1B6013] font-bold" disabled>
                      View All Transactions
                   </Button>
                )}
             </CardContent>
           </Card>
        </div>

        <div>
           {/* Address & Extra Details Card */}
           <Card className="border-0 shadow-lg h-full">
             <CardHeader>
               <CardTitle className="text-lg font-bold flex items-center gap-2">
                 <MapPin className="w-5 h-5 text-[#1B6013]" />
                 Saved Addresses
               </CardTitle>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                   {customer?.addresses && customer.addresses.length > 0 ? (
                      customer.addresses.map((addr: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                           <p className="text-sm font-bold text-gray-900">{addr.label || `Address ${i+1}`}</p>
                           <p className="text-xs text-gray-500 mt-1">{addr.street}</p>
                           <p className="text-xs text-gray-500">{addr.city}, {addr.state}</p>
                           <div className="flex items-center gap-2 mt-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-[10px] font-medium text-gray-600">{addr.phone}</span>
                           </div>
                        </div>
                      ))
                   ) : (
                      <p className="text-center py-8 text-gray-400 text-sm">No addresses saved</p>
                   )}
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
      <div className="">
        <Separator className="my-4 mb-8" />
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Orders</h2>
          <div className="relative w-full max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input type="text" placeholder="Search Orders" className="pl-10" />
          </div>
        </div>

        {/* Orders Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Order No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isOrdersLoading ? (
                // Skeleton loading rows for orders
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
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
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </TableCell>
                    <TableCell>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </TableCell>
                  </TableRow>
                ))
              ) : orders && orders.length > 0 ? (
                (orders as Tables<"orders">[]).map((order) => (
                  <TableRow key={order.id}>
                    {/* Map fetched data to Order interface structure for display */}
                    <TableCell className="font-mono text-xs font-medium text-blue-600">
                      <span title={`Internal ID: ${order.id}`} className="cursor-pointer hover:underline">
                        {(order as any).reference || (order.id?.substring(0, 8) + '...')}
                      </span>
                    </TableCell>
                    {/* Mapping id to Order No */}
                    <TableCell>
                      {order.created_at
                        ? format(new Date(order.created_at), "MMM d 'at' h:mma")
                        : "N/A"}
                    </TableCell>{" "}
                    {/* Mapping created_at to Date - Fixed format string */}
                    <TableCell>
                      {order.total_amount
                        ? `₦${order.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                        : "₦0.00"}
                    </TableCell>{" "}
                    {/* Mapping total_amount to Amount */}
                    <TableCell>Website</TableCell>{" "}
                    {/* Placeholder for Platform */}
                    <TableCell>
                      {(() => {
                        const addr = order.shipping_address as any;
                        if (!addr) return "N/A";
                        return [addr.street, addr.city, addr.local_government, addr.state]
                          .filter(part => part && typeof part === 'string' && part !== 'undefined')
                          .join(", ");
                      })()}
                    </TableCell>{" "}
                    {/* Mapping shipping_address to Address */}
                    <TableCell>
                      <Select
                        value={order.status || "Unknown Status"} // Use order.status as the value
                        onValueChange={(newValue) =>
                          updateOrderStatus(order.id, newValue)
                        }
                      >
                        <SelectTrigger className="w-[150px]">
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
                    </TableCell>{" "}
                    {/* Mapping status to Progress with dropdown */}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No orders found for this customer.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination for orders can be added here if needed */}
      </div>
    </div>
  );
}
