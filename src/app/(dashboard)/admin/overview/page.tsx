"use client";

import Chart from "@components/admin/chart";
import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import { Avatar, AvatarFallback } from "@components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui/dropdown-menu";
import PendingOrders from "@components/admin/pendingOrders";
import BestSellingProducts from "@components/admin/sellingProducts";
import BestSellingBundles from "@components/admin/sellingBundles";
import Calendars from "@components/icons/calendar.svg";
import { Calendar } from "@components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { createClient } from "@utils/supabase/client";

// Define types for chart data
interface DailyMetrics {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

interface DeliveredOrdersChartData {
  date: string;
  orders: number;
}

interface TotalRevenueChartData {
  date: string;
  revenue: number;
  averageOrderValue: number;
}

// Removing the problematic type definition for now

// Assuming the structure of an order object from Supabase
interface Order {
  id: string;
  user_id: string | null;
  status: string | null;
  total_amount: number | null;
  voucher_id: string | null;
  shipping_address: { city?: string; [key: string]: any } | null; // Assuming shipping_address is JSONB with an optional city
  payment_method: string | null;
  created_at: string; // Or Date, depending on how Supabase returns it
  updated_at: string | null; // Or Date
}

// Define type for PendingOrders component data
interface PendingOrderData {
  orderNo: string;
  date: string;
  customer: { name: string; phone: string };
  amount: string; // Keep as string for formatted currency
  platform: string;
  location: string;
  progress: string;
}

const Overview = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });
  const [selected, setSelected] = useState("Today");
  const [compareTo, setCompareTo] = useState<
    "Previous period" | "Previous year" | null
  >(null);
  const [orders, setOrders] = useState<Order[]>([]); // Use Order type
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]); // Use Order type
  const [pendingOrdersData, setPendingOrdersData] = useState<
    PendingOrderData[]
  >([]); // State for PendingOrders data

  // State for chart data and metrics
  const [totalOrdersChartData, setTotalOrdersChartData] = useState<
    DailyMetrics[]
  >([]);
  const [totalOrdersMetrics, setTotalOrdersMetrics] = useState({
    total: 0,
    percentageChange: 0,
  });

  const [deliveredOrdersChartData, setDeliveredOrdersChartData] = useState<
    DeliveredOrdersChartData[]
  >([]);
  const [deliveredOrdersMetrics, setDeliveredOrdersMetrics] = useState({
    total: 0,
    percentageChange: 0,
  });

  const [totalRevenueChartData, setTotalRevenueChartData] = useState<
    TotalRevenueChartData[]
  >([]);
  const [totalRevenueMetrics, setTotalRevenueMetrics] = useState({
    total: 0,
    percentageChange: 0,
  });

  // Using a less strict type for location chart data for now
  const [topLocationsSalesChartData, setTopLocationsSalesChartData] = useState<
    any[]
  >([]);
  const [topLocationsSalesTotal, setTopLocationsSalesTotal] = useState(0);

  // Using a less strict type for location chart data for now
  const [topLocationsOrdersChartData, setTopLocationsOrdersChartData] =
    useState<any[]>([]);
  const [topLocationsOrdersTotal, setTopLocationsOrdersTotal] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase.from("orders").select("*");
      console.log(data);

      if (error) {
        console.error("Error fetching orders:", error);
      } else {
        setOrders((data as Order[]) || []); // Cast data to Order[]
      }
    };

    fetchOrders();
  }, []); // Fetch orders on component mount

  useEffect(() => {
    // Implement filtering logic here based on `date` and selected locations
    let ordersToFilter = [...orders];

    // Date filtering
    /*
    if (date?.from && date?.to) {
      ordersToFilter = ordersToFilter.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date.from! && orderDate <= date.to!;
      });
    }
    */

    // Location filtering (for Lagos cities)
    // This assumes the order object has a `shipping_address` field
    // which is a JSON object with a `city` property.
    /*
    const lagosCities = ["Yaba", "Alimosho", "Ikeja", "Lekki", "Surulere", "Apapa", "Victoria Island"]; // Add more Lagos cities as needed
    ordersToFilter = ordersToFilter.filter(order => {
        try {
            const shippingAddress = order.shipping_address;
            if (shippingAddress && shippingAddress.city) {
                return lagosCities.includes(shippingAddress.city);
            }
            return false; // Filter out orders without a valid Lagos city
        } catch (e) {
            console.error("Error parsing shipping address:", e);
            return false; // Filter out orders with invalid shipping address data
        }
    });
    */

    setFilteredOrders(ordersToFilter);

    // Transform filtered orders for PendingOrders component
    const transformedPendingOrders: PendingOrderData[] = ordersToFilter.map(
      (order) => ({
        orderNo: order.id.substring(0, 8), // Use a portion of the ID as order number
        date: format(new Date(order.created_at), "MMM d 'at' h:mma"), // Fixed format string
        customer: { name: order.user_id || "Unknown User", phone: "N/A" }, // Use user_id as a placeholder, you might need to fetch user details
        amount: `₦${order.total_amount?.toFixed(2) || "0.00"}`,
        platform: "N/A", // Assuming platform is not in your order data
        location: order.shipping_address?.city || "Unknown Location",
        progress: order.status || "Unknown Status",
      })
    );
    setPendingOrdersData(transformedPendingOrders);

    // --- Data Processing for Charts ---

    // 1. Total Orders with Sales Over Time
    const totalOrdersData = ordersToFilter.reduce<{
      [key: string]: DailyMetrics;
    }>((acc, order) => {
      const orderDate = format(new Date(order.created_at), "MMM. d");
      if (!acc[orderDate]) {
        acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
      }
      acc[orderDate].orders += 1;
      acc[orderDate].sales += order.total_amount || 0; // Assuming total_amount represents sales
      acc[orderDate].revenue += order.total_amount || 0; // Assuming total_amount represents revenue
      return acc;
    }, {});
    const totalOrdersChartDataProcessed: DailyMetrics[] = Object.values(
      totalOrdersData
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTotalOrdersChartData(totalOrdersChartDataProcessed);
    console.log("Total Orders Chart Data:", totalOrdersChartDataProcessed);

    // 2. Orders Delivered with Orders Over Time
    const deliveredOrdersData = ordersToFilter
      .filter((order) => order.status === "delivered")
      .reduce<{ [key: string]: DeliveredOrdersChartData }>((acc, order) => {
        const orderDate = format(new Date(order.created_at), "MMM. d");
        if (!acc[orderDate]) {
          acc[orderDate] = { date: orderDate, orders: 0 };
        }
        acc[orderDate].orders += 1;
        return acc;
      }, {});
    const deliveredOrdersChartDataProcessed: DeliveredOrdersChartData[] =
      Object.values(deliveredOrdersData).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    setDeliveredOrdersChartData(deliveredOrdersChartDataProcessed);
    console.log(
      "Delivered Orders Chart Data:",
      deliveredOrdersChartDataProcessed
    );

    // 3. Total Revenue with Average Order Value
    const totalRevenueData = ordersToFilter.reduce<{
      [key: string]: { date: string; revenue: number; totalOrders: number };
    }>((acc, order) => {
      const orderDate = format(new Date(order.created_at), "MMM. d");
      if (!acc[orderDate]) {
        acc[orderDate] = { date: orderDate, revenue: 0, totalOrders: 0 };
      }
      acc[orderDate].revenue += order.total_amount || 0;
      acc[orderDate].totalOrders += 1;
      return acc;
    }, {});

    const totalRevenueChartDataProcessed: TotalRevenueChartData[] =
      Object.values(totalRevenueData)
        .map((item) => ({
          date: item.date,
          revenue: item.revenue,
          averageOrderValue:
            item.totalOrders > 0 ? item.revenue / item.revenue : 0, // Fixed potential division by zero
        }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
    setTotalRevenueChartData(totalRevenueChartDataProcessed);
    console.log("Total Revenue Chart Data:", totalRevenueChartDataProcessed);

    // 4. Top Locations with Sales Over Time
    const topLocationsSalesData: { [key: string]: { [date: string]: number } } =
      {};
    ordersToFilter.forEach((order) => {
      try {
        const city = order.shipping_address?.city;
        if (city) {
          const orderDate = format(new Date(order.created_at), "MMM. d");
          if (!topLocationsSalesData[city]) {
            topLocationsSalesData[city] = {};
          }
          if (!topLocationsSalesData[city][orderDate]) {
            topLocationsSalesData[city][orderDate] = 0;
          }
          topLocationsSalesData[city][orderDate] += order.total_amount || 0;
        }
      } catch (e) {
        console.error("Error processing location for sales:", e);
      }
    });
    // Convert to chart data format (array of objects with date and location sales)
    const topLocationsSalesChartDataProcessed: any[] = Object.entries(
      topLocationsSalesData
    )
      .reduce((acc: any[], [location, salesByDate]) => {
        Object.entries(salesByDate).forEach(([date, sales]) => {
          const existingItem = acc.find((item) => item.date === date);
          if (existingItem) {
            existingItem[location] = sales;
          } else {
            acc.push({ date: date, [location]: sales });
          }
        });
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTopLocationsSalesChartData(topLocationsSalesChartDataProcessed);
    console.log(
      "Top Locations Sales Chart Data:",
      topLocationsSalesChartDataProcessed
    );

    // 5. Top Locations in Lagos with Orders Over Time
    const topLocationsOrdersData: {
      [key: string]: { [date: string]: number };
    } = {};
    ordersToFilter.forEach((order) => {
      try {
        const city = order.shipping_address?.city;
        if (city) {
          const orderDate = format(new Date(order.created_at), "MMM. d");
          if (!topLocationsOrdersData[city]) {
            topLocationsOrdersData[city] = {};
          }
          if (!topLocationsOrdersData[city][orderDate]) {
            topLocationsOrdersData[city][orderDate] = 0;
          }
          topLocationsOrdersData[city][orderDate] += 1; // Count orders
        }
      } catch (e) {
        console.error("Error processing location for orders:", e);
      }
    });
    // Convert to chart data format (array of objects with date and location orders)
    const topLocationsOrdersChartDataProcessed: any[] = Object.entries(
      topLocationsOrdersData
    )
      .reduce((acc: any[], [location, ordersByDate]) => {
        Object.entries(ordersByDate).forEach(([date, orders]) => {
          const existingItem = acc.find((item) => item.date === date);
          if (existingItem) {
            existingItem[location] = orders;
          } else {
            acc.push({ date: date, [location]: orders });
          }
        });
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTopLocationsOrdersChartData(topLocationsOrdersChartDataProcessed);
    console.log(
      "Top Locations Orders Chart Data:",
      topLocationsOrdersChartDataProcessed
    );

    // --- Calculate Key Metrics and Percentage Change ---

    // Helper to calculate total and percentage change
    const calculateMetrics = (data: any[], valueKey: string) => {
      const total = data.reduce(
        (sum, item) => sum + ((item[valueKey] as number) || 0),
        0
      ); // Cast item[valueKey] to number
      let percentageChange = 0;
      if (data.length > 1) {
        const firstValue = (data[0][valueKey] as number) || 0; // Cast to number
        const lastValue = (data[data.length - 1][valueKey] as number) || 0; // Cast to number
        if (firstValue !== 0) {
          percentageChange = ((lastValue - firstValue) / firstValue) * 100;
        } else if (lastValue > 0) {
          percentageChange = 100; // Handle case where first value is 0
        }
      }
      return { total, percentageChange };
    };

    setTotalOrdersMetrics(
      calculateMetrics(totalOrdersChartDataProcessed, "orders")
    );
    setDeliveredOrdersMetrics(
      calculateMetrics(deliveredOrdersChartDataProcessed, "orders")
    );
    setTotalRevenueMetrics(
      calculateMetrics(totalRevenueChartDataProcessed, "revenue")
    );
    // For top locations, we might need a different approach for overall metrics or focus on the chart itself.
    // For simplicity, let's calculate total sales and orders across all relevant locations in the current range.
    const topLocationsSalesTotalCalculated =
      topLocationsSalesChartDataProcessed.reduce((sum, item) => {
        let locationSales = 0;
        for (const key in item) {
          if (key !== "date") {
            locationSales += item[key] as number; // Cast to number for calculation
          }
        }
        return sum + locationSales;
      }, 0);
    setTopLocationsSalesTotal(topLocationsSalesTotalCalculated);
    // Percentage change for top locations sales could be complex, skipping for now or using a simplified approach.
    const topLocationsOrdersTotalCalculated =
      topLocationsOrdersChartDataProcessed.reduce((sum, item) => {
        let locationOrders = 0;
        for (const key in item) {
          if (key !== "date") {
            locationOrders += item[key] as number; // Cast to number for calculation
          }
        }
        return sum + locationOrders;
      }, 0);
    setTopLocationsOrdersTotal(topLocationsOrdersTotalCalculated);
    // Percentage change for top locations orders could be complex, skipping for now.
  }, [date, orders]); // Refilter and recalculate when date or original orders change

  const handleApply = () => {
    // The filtering and data processing now happen automatically when `date` or `orders` change
    // console.log("Apply button clicked, filtering handled by useEffect");
  };

  const handleCancel = () => {
    setCompareTo(null);
    setDate({
      from: new Date(2022, 0, 20),
      to: addDays(new Date(2022, 0, 20), 20),
    });
    setSelected("Today");
  };

  return (
    <main>
      <div className="flex justify-between w-full">
        <h1 className="text-3xl font-semibold pb-8">Overview</h1>
        <div className="flex flex-col gap-4 items-end">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button
                variant="outline"
                className="flex items-center gap-2 font-semibold w-full"
              >
                <Calendars /> {selected}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-[300px] md:w-[410px] mr-6 max-h-[80vh] overflow-y-auto"
              asChild
            >
              <div className="p-2">
                <Accordion type="single" className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger className="text-xl font-medium">
                      Date Range
                    </AccordionTrigger>
                    <AccordionContent>
                      <RadioGroup
                        value={selected}
                        onValueChange={setSelected}
                        className="flex flex-col gap-2 "
                      >
                        <div className="flex items-center gap-2 p-2">
                          <RadioGroupItem value="Today" /> Today
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <RadioGroupItem value="LastWeek" /> In the last week
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <RadioGroupItem value="LastMonth" /> In the last month
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <RadioGroupItem value="Last3Months" /> In the last 3
                          months
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <RadioGroupItem value="LastYear" /> In the last year
                        </div>
                        <div className="flex items-center gap-2 p-2">
                          <RadioGroupItem value="Custom" /> Custom
                        </div>
                      </RadioGroup>

                      {selected === "Custom" && (
                        <>
                          <div className="flex flex-col gap-5 py-3">
                            <p className="tex-[15px] font-bold">From:</p>
                            <div className="flex items-center gap-2 border rounded-md p-3">
                              <CalendarIcon size={14} color="#00000080" />
                              <div className=" h-4 border border-l text-black/50" />
                              <div className="text-sm text-black/50">
                                {date?.from ? (
                                  format(date.from, "LLL-dd-y")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </div>
                            </div>
                            <Calendar
                              className="w-full"
                              initialFocus
                              mode="single"
                              defaultMonth={date?.from}
                              selected={date?.from}
                              onSelect={(date) =>
                                setDate((prev) => ({
                                  ...prev,
                                  from: date,
                                }))
                              }
                              numberOfMonths={1}
                            />
                          </div>

                          <div className="flex flex-col gap-5 py-3">
                            <p className="tex-[15px] font-bold">To:</p>
                            <div className="flex items-center gap-2 border rounded-md p-3">
                              <CalendarIcon size={14} color="#00000080" />
                              <div className=" h-4 border border-l text-gray-400" />
                              <div className="text-sm text-black/50">
                                {date?.to ? (
                                  format(date.to, "LLL-dd-y")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </div>
                            </div>
                            <Calendar
                              className="w-full"
                              initialFocus
                              mode="single"
                              defaultMonth={date?.to}
                              selected={date?.to}
                              onSelect={(date) =>
                                setDate((prev) => ({
                                  from: prev?.from,
                                  to: date,
                                }))
                              }
                              numberOfMonths={1}
                            />
                          </div>
                        </>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Compare to previous dates section */}
                <div className="mt-4">
                  <p className="text-[15px] font-bold mb-2">
                    Compare to previous dates
                  </p>
                  <RadioGroup
                    value={compareTo || ""}
                    onValueChange={(value) =>
                      setCompareTo(
                        value as "Previous period" | "Previous year" | null
                      )
                    }
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2 p-2">
                      <RadioGroupItem value="Previous period" />
                      <span>Previous period</span>
                    </div>
                    <div className="flex items-center gap-2 p-2">
                      <RadioGroupItem value="Previous year" />
                      <span>Previous year</span>
                    </div>
                  </RadioGroup>
                </div>

                {/* Cancel and Apply buttons */}
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button onClick={handleApply}>Apply</Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4 mt-4">
        <Chart
          title="Total Orders"
          value={totalOrdersMetrics.total}
          percentage={totalOrdersMetrics.percentageChange}
          data={totalOrdersChartData}
          dataKeyName="orders"
          dateRange={date}
        />
        <Chart
          title="Orders Delivered"
          value={deliveredOrdersMetrics.total}
          percentage={deliveredOrdersMetrics.percentageChange}
          data={deliveredOrdersChartData}
          dataKeyName="orders"
          dateRange={date}
        />
        <Chart
          title="Total Revenue"
          value={`₦${totalRevenueMetrics.total.toFixed(2)}`}
          percentage={totalRevenueMetrics.percentageChange}
          data={totalRevenueChartData}
          dataKeyName="revenue"
          secondDataKeyName="averageOrderValue"
          secondLineColor="blue"
          dateRange={date}
        />
        {/* Assuming Top Locations Sales chart needs a combined value, using total sales across locations */}
        <Chart
          title="Top Locations Sales"
          value={`₦${topLocationsSalesTotal.toFixed(2)}`}
          percentage={0} // Placeholder, complex to calculate percentage change for multiple locations combined
          data={topLocationsSalesChartData}
          // For top locations, dataKeyName is not a single value, chart component handles dynamic keys
          dateRange={date}
        />
        {/* Assuming Top Locations Orders chart needs a combined value, using total orders across locations */}
        <Chart
          title="Top Locations Orders"
          value={topLocationsOrdersTotal}
          percentage={0} // Placeholder
          data={topLocationsOrdersChartData}
          // For top locations, dataKeyName is not a single value, chart component handles dynamic keys
          dateRange={date}
        />
        {/* Duplicate of Total Revenue as per user request/image */}
        <Chart
          title="Total Revenue"
          value={`₦${totalRevenueMetrics.total.toFixed(2)}`}
          percentage={totalRevenueMetrics.percentageChange}
          data={totalRevenueChartData}
          dataKeyName="revenue"
          secondDataKeyName="averageOrderValue"
          secondLineColor="blue"
          dateRange={date}
        />
      </div>
      <PendingOrders orders={pendingOrdersData} />
      <BestSellingProducts />
      <BestSellingBundles />
    </main>
  );
};

export default Overview;
