"use client";

import { Separator } from "@components/ui/separator";
import { format } from "date-fns";
import { MoveUp } from "lucide-react";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  CartesianGrid,
} from "recharts";

const dataset1 = [
  { date: "Nov. 6", sales: 100 },
  { date: "Nov. 7", sales: 700 },
  { date: "Nov. 8", sales: 300 },
  { date: "Nov. 9", sales: 800 },
  { date: "Nov. 10", sales: 200 },
  { date: "Nov. 11", sales: 600 },
  { date: "Nov. 12", sales: 350 },
  { date: "Nov. 13", sales: 750 },
  { date: "Nov. 14", sales: 150 },
  { date: "Nov. 15", sales: 900 },
  { date: "Nov. 16", sales: 400 },
  { date: "Nov. 17", sales: 1000 },
  { date: "Nov. 18", sales: 250 },
  { date: "Nov. 19", sales: 850 },
  { date: "Nov. 20", sales: 300 },
  { date: "Nov. 21", sales: 920 },
  { date: "Nov. 22", sales: 450 },
  { date: "Nov. 23", sales: 980 },
];

const dataset2 = [
  { date: "Nov. 6", orders: 50 },
  { date: "Nov. 11", orders: 200 },
  { date: "Nov. 16", orders: 400 },
  { date: "Nov. 21", orders: 500 },
  { date: "Nov. 26", orders: 700 },
  { date: "Nov. 30", orders: 900 },
];

export default function Chart({ dateRange, compareTo }) {
  const [showDataset1, setShowDataset1] = useState(true);
  const [filteredData, setFilteredData] = useState(dataset1);

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const filtered = dataset1.filter((entry) => {
        const entryDate = new Date(entry.date);
        return entryDate >= dateRange.from && entryDate <= dateRange.to;
      });
      setFilteredData(filtered);
    }
  }, [dateRange]);

  return (
    <div className="py-4 border border-[#EAECF0] rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.06)] bg-white w-full max-w-sm">
      <h3 className="font-semibold pb-4 px-5">Total Orders</h3>
      <Separator />
      <div className="flex justify-between items-center p-5 pb-3">
        <p className="text-2xl font-semibold">126</p>
        <div className="text-[#339405] text-2xl font-semibold flex items-center">
          <span className="mr-1 font-light text-xl">
            <MoveUp />
          </span>{" "}
          23%
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5">
        <p className="text-[13px] font-medium mt-2">SALES OVER TIME</p>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={showDataset1 ? filteredData : dataset2}>
            <defs>
              <linearGradient id="salesGradient1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="black" stopOpacity={0.3} />
                <stop offset="100%" stopColor="black" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="salesGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="blue" stopOpacity={0.3} />
                <stop offset="100%" stopColor="blue" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#DEE3EDB2" horizontal={true} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#666" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#666" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #ddd", borderRadius: "8px", fontSize: "12px" }} />

            {showDataset1 && (
              <>
                <Area type="monotone" dataKey="sales" stroke="#101828" fill="url(#salesGradient1)" />
                <Line type="monotone" dataKey="sales" stroke="black" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, fill: "black" }} />
              </>
            )}
            {!showDataset1 && (
              <>
                <Area type="monotone" dataKey="orders" stroke="none" fill="url(#salesGradient2)" />
                <Line type="monotone" dataKey="orders" stroke="blue" strokeWidth={2.5} dot={{ r: 0 }} activeDot={{ r: 5, fill: "blue" }} />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-end gap-4 items-center text-xs text-gray-500">
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={showDataset1}
              onChange={() => setShowDataset1(true)}
            />
            {dateRange?.from && dateRange?.to
              ? `${format(dateRange.from, "MMM. d")}-${format(dateRange.to, "MMM. d")}`
              : "Custom Range"}
          </label>
          <label>
            <input
              type="checkbox"
              className="mr-1"
              checked={!showDataset1}
              onChange={() => setShowDataset1(false)}
            />
            Previous Period
          </label>
        </div>
      </div>
    </div>
  );
}