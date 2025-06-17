"use client";

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
} from "lucide-react";

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

export default function CustomerDetailsPage() {
  const params = useParams();
  const customerId = params.id as string; // Get customer ID from URL

  // Fetch customer details using the hook
  const {
    data: customer,
    isLoading: isCustomerLoading,
    error: customerError,
  } = useCustomer(customerId);

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
      display_name: customer?.display_name || "",
      birthday: customer?.birthday
        ? format(new Date(customer.birthday), "yyyy-MM-dd")
        : "",
      favorite_fruit: customer?.favorite_fruit || "",
    },
  });

  // Mutation for updating customer details
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: CustomerDetailsFormData) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("users")
        .update({
          display_name: data.display_name,
          birthday: data.birthday,
          favorite_fruit: data.favorite_fruit,
        })
        .eq("id", customerId);

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
      console.log(`Order ${orderId} status updated to ${newStatus}`);
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

      {/* Orders Section */}
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
                orders.map((order: Tables<"orders">) => (
                  <TableRow key={order.id}>
                    {/* Map fetched data to Order interface structure for display */}
                    <TableCell>{order.id?.substring(0, 8) || "#N/A"}</TableCell>{" "}
                    {/* Mapping id to Order No */}
                    <TableCell>
                      {order.created_at
                        ? format(new Date(order.created_at), "MMM d 'at' h:mma")
                        : "N/A"}
                    </TableCell>{" "}
                    {/* Mapping created_at to Date - Fixed format string */}
                    <TableCell>
                      {order.total_amount
                        ? `₦${order.total_amount.toFixed(2)}`
                        : "₦0.00"}
                    </TableCell>{" "}
                    {/* Mapping total_amount to Amount */}
                    <TableCell>Website</TableCell>{" "}
                    {/* Placeholder for Platform */}
                    <TableCell>
                      {(order.shipping_address as any)?.street
                        ? `${(order.shipping_address as any)?.street}, ${
                            (order.shipping_address as any)?.city
                          }, ${(order.shipping_address as any)?.state}`
                        : "N/A"}
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
