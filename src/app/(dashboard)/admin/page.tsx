"use client";

import Chart from "@components/admin/chart";
import React, { useState } from "react";
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

const Overview = () => {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: new Date(2022, 0, 20),
    to: addDays(new Date(2022, 0, 20), 20),
  });
  const [selected, setSelected] = useState("Today");
  const [compareTo, setCompareTo] = useState<"Previous period" | "Previous year" | null>(null);

  const orders = Array(10).fill({
    orderNo: "#0001",
    date: "Nov 11 at 7:56pm",
    customer: { name: "Bola Adeleke", phone: "09035857775" },
    amount: "₦5,000.00",
    platform: "Mobile App",
    location: "Ikeja, Lagos",
    progress: "Order Confirmed",
  });

  const handleApply = () => {
    console.log("Selected Date Range:", date);
    console.log("Compare To:", compareTo);
  };

  const handleCancel = () => {
    setCompareTo(null);
    setDate({ from: new Date(2022, 0, 20), to: addDays(new Date(2022, 0, 20), 20) });
    setSelected("Today");
  };

  return (
    <main>
      <div className="flex justify-between">
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

            <DropdownMenuContent className="w-[300px] md:w-[410px] mr-6 max-h-[80vh] overflow-y-auto" asChild>
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
                  <p className="text-[15px] font-bold mb-2">Compare to previous dates</p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 p-2">
                      <RadioGroupItem
                        value="Previous period"
                        checked={compareTo === "Previous period"}
                        onClick={() => setCompareTo("Previous period")}
                      />
                      <span>Previous period</span>
                    </div>
                    <div className="flex items-center gap-2 p-2">
                      <RadioGroupItem
                        value="Previous year"
                        checked={compareTo === "Previous year"}
                        onClick={() => setCompareTo("Previous year")}
                      />
                      <span>Previous year</span>
                    </div>
                  </div>
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Chart   />
        <Chart   />
        <Chart   />
        <Chart   />
        <Chart   />
        <Chart   />
      </div>
      <PendingOrders orders={orders} />
      <BestSellingProducts />
      <BestSellingBundles />
    </main>
  );
};

export default Overview;