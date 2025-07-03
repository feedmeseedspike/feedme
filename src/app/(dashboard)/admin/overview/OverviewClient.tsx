"use client";

import Chart from "@components/admin/chart";
import React, { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
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
import {
  addDays,
  format,
  startOfToday,
  endOfToday,
  subWeeks,
  subMonths,
  subYears,
  endOfDay,
} from "date-fns";

// Define types for chart data
interface DailyMetrics {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

interface LocationMetric {
  location: string;
  sales?: number;
  orders?: number;
}

// Assuming the structure of an order object from Supabase
export interface Order {
  id: string;
  user_id: string | null;
  status: string | null;
  total_amount: number | null;
  voucher_id: string | null;
  shipping_address: {
    city?: string;
    state?: string;
    [key: string]: any;
  } | null;
  payment_method: string | null;
  created_at: string;
  updated_at: string | null;
}

// Define type for PendingOrders component data
interface PendingOrderData {
  orderNo: string;
  date: string;
  customer: { name: string; phone: string };
  amount: string;
  platform: string;
  location: string;
  progress: string;
}

interface OverviewClientProps {
  initialOrders: Order[];
  totalOrders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  totalCategories: number;
}

const OverviewClient: React.FC<OverviewClientProps> = ({
  initialOrders,
  totalOrders,
  confirmedOrders,
  deliveredOrders,
  totalRevenue,
  totalProducts,
  totalCustomers,
  totalCategories,
}) => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });
  const [selected, setSelected] = useState("Today");
  const [compareTo, setCompareTo] = useState<
    "Previous period" | "Previous year" | null
  >(null);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>(initialOrders);
  const [pendingOrdersData, setPendingOrdersData] = useState<
    PendingOrderData[]
  >([]);

  // State for chart data and metrics
  const [totalOrdersChartData, setTotalOrdersChartData] = useState<
    DailyMetrics[]
  >([]);
  const [totalOrdersMetrics, setTotalOrdersMetrics] = useState({
    total: 0,
    percentageChange: 0,
  });

  const [deliveredOrdersChartData, setDeliveredOrdersChartData] = useState<
    DailyMetrics[]
  >([]);
  const [deliveredOrdersMetrics, setDeliveredOrdersMetrics] = useState({
    total: 0,
    percentageChange: 0,
  });

  const [totalRevenueChartData, setTotalRevenueChartData] = useState<
    DailyMetrics[]
  >([]);
  const [totalRevenueMetrics, setTotalRevenueMetrics] = useState({
    total: 0,
    percentageChange: 0,
  });

  const [topCitiesSalesChartData, setTopCitiesSalesChartData] = useState<
    LocationMetric[]
  >([]);
  const [topCitiesSalesTotal, setTopCitiesSalesTotal] = useState(0);

  const [topCitiesOrdersChartData, setTopCitiesOrdersChartData] = useState<
    LocationMetric[]
  >([]);
  const [topCitiesOrdersTotal, setTopCitiesOrdersTotal] = useState(0);

  // Add state for previous period metrics
  const [prevTotalOrdersMetrics, setPrevTotalOrdersMetrics] = useState({
    total: 0,
  });
  const [prevDeliveredOrdersMetrics, setPrevDeliveredOrdersMetrics] = useState({
    total: 0,
  });
  const [prevTotalRevenueMetrics, setPrevTotalRevenueMetrics] = useState({
    total: 0,
  });

  useEffect(() => {
    const today = new Date();
    let fromDate: Date | undefined;

    switch (selected) {
      case "Today":
        fromDate = startOfToday();
        break;
      case "LastWeek":
        fromDate = subWeeks(today, 1);
        break;
      case "LastMonth":
        fromDate = subMonths(today, 1);
        break;
      case "Last3Months":
        fromDate = subMonths(today, 3);
        break;
      case "LastYear":
        fromDate = subYears(today, 1);
        break;
      case "Custom":
        // For custom, the user selects dates manually. Don't override.
        return;
    }

    if (selected !== "Custom") {
      setDate({ from: fromDate, to: endOfToday() });
    }
  }, [selected]);

  useEffect(() => {
    setOrders(initialOrders);
    setFilteredOrders(initialOrders);

    // --- PENDING ORDERS TABLE ---
    const transformedPendingOrders: PendingOrderData[] = orders.map(
      (order) => ({
        orderNo: order.id.substring(0, 8),
        date: format(new Date(order.created_at), "MMM d 'at' h:mma"),
        customer: { name: order.user_id || "Unknown User", phone: "N/A" },
        amount: `₦${order.total_amount?.toFixed(2) || "0.00"}`,
        platform: "N/A",
        location: order.shipping_address?.city || "Unknown Location",
        progress: order.status || "Unknown Status",
      })
    );
    setPendingOrdersData(transformedPendingOrders);

    // --- TIME-SERIES CHARTS ---
    const totalOrdersData = orders.reduce<{
      [key: string]: DailyMetrics;
    }>((acc, order) => {
      const orderDate = format(new Date(order.created_at), "MMM. d");
      if (!acc[orderDate]) {
        acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
      }
      acc[orderDate].orders += 1;
      acc[orderDate].sales += order.total_amount || 0;
      acc[orderDate].revenue += order.total_amount || 0;
      return acc;
    }, {});
    const totalOrdersChartDataProcessed: DailyMetrics[] = Object.values(
      totalOrdersData
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTotalOrdersChartData(totalOrdersChartDataProcessed);

    const deliveredOrdersData = orders
      .filter((order) => order.status === "order delivered")
      .reduce<{ [key: string]: DailyMetrics }>((acc, order) => {
        const orderDate = format(new Date(order.created_at), "MMM. d");
        if (!acc[orderDate]) {
          acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
        }
        acc[orderDate].orders += 1;
        return acc;
      }, {});
    const deliveredOrdersChartDataProcessed: DailyMetrics[] = Object.values(
      deliveredOrdersData
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setDeliveredOrdersChartData(deliveredOrdersChartDataProcessed);

    const totalRevenueData = orders.reduce<{
      [key: string]: DailyMetrics;
    }>((acc, order) => {
      const orderDate = format(new Date(order.created_at), "MMM. d");
      if (!acc[orderDate]) {
        acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
      }
      acc[orderDate].revenue += order.total_amount || 0;
      return acc;
    }, {});
    const totalRevenueChartDataProcessed: DailyMetrics[] = Object.values(
      totalRevenueData
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setTotalRevenueChartData(totalRevenueChartDataProcessed);

    // --- LOCATION CHARTS (Generalized: all states/cities) ---
    const allOrdersWithLocation = orders.filter(
      (order) => order.shipping_address && order.shipping_address.city
    );

    const topCitiesSales = allOrdersWithLocation.reduce<{
      [key: string]: LocationMetric;
    }>((acc, order) => {
      const city = order.shipping_address?.city;
      const state = order.shipping_address?.state;
      let location = "Unknown";
      if (city && state) {
        location = `${city}, ${state}`;
      } else if (city) {
        location = city;
      } else if (state) {
        location = state;
      }
      if (!acc[location]) {
        acc[location] = { location, sales: 0 };
      }
      acc[location].sales! += order.total_amount || 0;
      return acc;
    }, {});
    const topCitiesSalesChartDataProcessed = Object.values(topCitiesSales).sort(
      (a, b) => b.sales! - a.sales!
    );
    setTopCitiesSalesChartData(topCitiesSalesChartDataProcessed);

    const topCitiesOrders = allOrdersWithLocation.reduce<{
      [key: string]: LocationMetric;
    }>((acc, order) => {
      const city = order.shipping_address?.city;
      const state = order.shipping_address?.state;
      let location = "Unknown";
      if (city && state) {
        location = `${city}, ${state}`;
      } else if (city) {
        location = city;
      } else if (state) {
        location = state;
      }
      if (!acc[location]) {
        acc[location] = { location, orders: 0 };
      }
      acc[location].orders! += 1;
      return acc;
    }, {});
    const topCitiesOrdersChartDataProcessed = Object.values(
      topCitiesOrders
    ).sort((a, b) => b.orders! - a.orders!);
    setTopCitiesOrdersChartData(topCitiesOrdersChartDataProcessed);

    // --- METRICS CALCULATION ---
    // Calculate percentage change: (current - prev) / prev * 100
    const calculateMetrics = (data: any[], valueKey: string) => {
      const total = data.reduce((sum, item) => sum + item[valueKey], 0);
      return { total };
    };

    // Calculate current period metrics
    setTotalOrdersMetrics({
      total: calculateMetrics(totalOrdersChartData, "sales").total,
      percentageChange:
        prevTotalOrdersMetrics.total > 0
          ? ((calculateMetrics(totalOrdersChartData, "sales").total -
              prevTotalOrdersMetrics.total) /
              prevTotalOrdersMetrics.total) *
            100
          : 0,
    });
    setDeliveredOrdersMetrics({
      total: calculateMetrics(deliveredOrdersChartData, "orders").total,
      percentageChange:
        prevDeliveredOrdersMetrics.total > 0
          ? ((calculateMetrics(deliveredOrdersChartData, "orders").total -
              prevDeliveredOrdersMetrics.total) /
              prevDeliveredOrdersMetrics.total) *
            100
          : 0,
    });
    setTotalRevenueMetrics({
      total: calculateMetrics(totalRevenueChartData, "revenue").total,
      percentageChange:
        prevTotalRevenueMetrics.total > 0
          ? ((calculateMetrics(totalRevenueChartData, "revenue").total -
              prevTotalRevenueMetrics.total) /
              prevTotalRevenueMetrics.total) *
            100
          : 0,
    });
    setTopCitiesSalesTotal(
      topCitiesSalesChartDataProcessed.reduce(
        (sum, item) => sum + (item.sales || 0),
        0
      )
    );
    setTopCitiesOrdersTotal(
      topCitiesOrdersChartDataProcessed.reduce(
        (sum, item) => sum + (item.orders || 0),
        0
      )
    );
  }, [orders, initialOrders]);

  // Add effect to calculate previous period metrics when compareTo or date changes
  useEffect(() => {
    if (!compareTo || !date?.from || !date?.to) {
      setPrevTotalOrdersMetrics({ total: 0 });
      setPrevDeliveredOrdersMetrics({ total: 0 });
      setPrevTotalRevenueMetrics({ total: 0 });
      return;
    }
    const msInDay = 24 * 60 * 60 * 1000;
    const rangeLength =
      Math.ceil((date.to.getTime() - date.from.getTime()) / msInDay) + 1;
    let prevFrom: Date, prevTo: Date;
    if (compareTo === "Previous period") {
      prevTo = new Date(date.from.getTime() - msInDay);
      prevFrom = new Date(prevTo.getTime() - (rangeLength - 1) * msInDay);
    } else if (compareTo === "Previous year") {
      prevFrom = new Date(date.from);
      prevFrom.setFullYear(prevFrom.getFullYear() - 1);
      prevTo = new Date(date.to);
      prevTo.setFullYear(prevTo.getFullYear() - 1);
    } else {
      setPrevTotalOrdersMetrics({ total: 0 });
      setPrevDeliveredOrdersMetrics({ total: 0 });
      setPrevTotalRevenueMetrics({ total: 0 });
      return;
    }
    // Filter initialOrders for previous period
    const prevOrders = initialOrders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= prevFrom && orderDate <= prevTo;
    });
    // Build chart data for previous period
    const prevTotalOrdersData = prevOrders.reduce<{
      [key: string]: DailyMetrics;
    }>((acc, order) => {
      const orderDate = format(new Date(order.created_at), "MMM. d");
      if (!acc[orderDate]) {
        acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
      }
      acc[orderDate].orders += 1;
      acc[orderDate].sales += order.total_amount || 0;
      acc[orderDate].revenue += order.total_amount || 0;
      return acc;
    }, {});
    const prevDeliveredOrdersData = prevOrders
      .filter((order) => order.status === "order delivered")
      .reduce<{ [key: string]: DailyMetrics }>((acc, order) => {
        const orderDate = format(new Date(order.created_at), "MMM. d");
        if (!acc[orderDate]) {
          acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
        }
        acc[orderDate].orders += 1;
        return acc;
      }, {});
    const prevTotalRevenueData = prevOrders.reduce<{
      [key: string]: DailyMetrics;
    }>((acc, order) => {
      const orderDate = format(new Date(order.created_at), "MMM. d");
      if (!acc[orderDate]) {
        acc[orderDate] = { date: orderDate, sales: 0, orders: 0, revenue: 0 };
      }
      acc[orderDate].revenue += order.total_amount || 0;
      return acc;
    }, {});
    // Set previous period metrics
    setPrevTotalOrdersMetrics({
      total: Object.values(prevTotalOrdersData).reduce(
        (sum, item) => sum + item.sales,
        0
      ),
    });
    setPrevDeliveredOrdersMetrics({
      total: Object.values(prevDeliveredOrdersData).reduce(
        (sum, item) => sum + item.orders,
        0
      ),
    });
    setPrevTotalRevenueMetrics({
      total: Object.values(prevTotalRevenueData).reduce(
        (sum, item) => sum + item.revenue,
        0
      ),
    });
  }, [compareTo, date, initialOrders]);

  const handleApply = () => {
    if (date?.from) {
      const toDate = date.to ? endOfDay(date.to) : endOfDay(date.from);
      const filtered = initialOrders.filter((order) => {
        const orderDate = new Date(order.created_at);
        return orderDate >= date.from! && orderDate <= toDate;
      });
      setOrders(filtered);
    } else {
      setOrders(initialOrders);
    }
  };

  const handleCancel = () => {
    setCompareTo(null);
    setSelected("Today"); // Resets the radio button and triggers useEffect
    setOrders(initialOrders); // Reset to all orders
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Overview</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 font-semibold"
            >
              <Calendars /> {selected}
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[300px] md:w-[410px] mr-6 max-h-[80vh] overflow-y-auto"
            asChild
          >
            <div className="p-2">
              <Accordion type="single" className="w-full" collapsible>
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
                        <RadioGroupItem value="Today" id="today-radio" />
                        <label htmlFor="today-radio">Today</label>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <RadioGroupItem value="LastWeek" id="last-week-radio" />
                        <label htmlFor="last-week-radio">
                          In the last week
                        </label>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <RadioGroupItem
                          value="LastMonth"
                          id="last-month-radio"
                        />
                        <label htmlFor="last-month-radio">
                          In the last month
                        </label>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <RadioGroupItem
                          value="Last3Months"
                          id="last-3-months-radio"
                        />
                        <label htmlFor="last-3-months-radio">
                          In the last 3 months
                        </label>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <RadioGroupItem value="LastYear" id="last-year-radio" />
                        <label htmlFor="last-year-radio">
                          In the last year
                        </label>
                      </div>
                      <div className="flex items-center gap-2 p-2">
                        <RadioGroupItem value="Custom" id="custom-radio" />
                        <label htmlFor="custom-radio">Custom</label>
                      </div>
                    </RadioGroup>

                    {selected === "Custom" && (
                      <>
                        <div className="flex flex-col gap-5 py-3">
                          <p className="text-[15px] font-bold">From:</p>
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
                            onSelect={(d) =>
                              setDate((prev) => ({ ...prev, from: d }))
                            }
                            numberOfMonths={1}
                          />
                        </div>

                        <div className="flex flex-col gap-5 py-3">
                          <p className="text-[15px] font-bold">To:</p>
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
                            onSelect={(d) =>
                              setDate((prev) => ({
                                from: prev?.from !== undefined ? prev.from : d,
                                to: d,
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
                    <RadioGroupItem
                      value="Previous period"
                      id="prev-period-radio"
                    />
                    <label htmlFor="prev-period-radio">Previous period</label>
                  </div>
                  <div className="flex items-center gap-2 p-2">
                    <RadioGroupItem
                      value="Previous year"
                      id="prev-year-radio"
                    />
                    <label htmlFor="prev-year-radio">Previous year</label>
                  </div>
                </RadioGroup>
              </div>

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Chart
          title="Total Orders"
          value={totalOrdersMetrics.total}
          percentage={totalOrdersMetrics.percentageChange}
          data={totalOrdersChartData}
          xAxisKey="date"
          yAxisKey="sales"
        />
        <Chart
          title="Orders Fulfilled"
          value={deliveredOrdersMetrics.total}
          percentage={deliveredOrdersMetrics.percentageChange}
          data={deliveredOrdersChartData}
          xAxisKey="date"
          yAxisKey="orders"
        />
        <Chart
          title="Total Revenue"
          value={totalRevenueMetrics.total}
          percentage={totalRevenueMetrics.percentageChange}
          data={totalRevenueChartData}
          xAxisKey="date"
          yAxisKey="revenue"
        />
        <Chart
          title="Top Locations by Sales"
          value={topCitiesSalesTotal}
          percentage={0}
          data={topCitiesSalesChartData}
          xAxisKey="location"
          yAxisKey="sales"
        />
        <Chart
          title="Top Locations by Orders"
          value={topCitiesOrdersTotal}
          percentage={0}
          data={topCitiesOrdersChartData}
          xAxisKey="location"
          yAxisKey="orders"
        />
      </div>
      <div className="grid grid-cols-1 gap-6">
        <BestSellingProducts />
        <BestSellingBundles />
      </div>
      <PendingOrders initialData={pendingOrdersData} />
    </div>
  );
};

export default OverviewClient;
