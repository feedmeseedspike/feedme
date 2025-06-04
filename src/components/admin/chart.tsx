"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts";

import { DateRange } from "react-day-picker";
import { MoveDown, MoveUp } from "lucide-react";
import { Separator } from "@components/ui/separator";
import React, { useState, useEffect } from "react";
import { format } from "date-fns";

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

export default function Chart({
  title,
  value,
  percentage,
  data,
  dataKeyName,
  secondDataKeyName,
  secondLineColor = "blue",
  dateRange,
  compareTo,
}: {
  title: string;
  value: string | number;
  percentage: number;
  data: any[];
  dataKeyName?: string;
  secondDataKeyName?: string;
  secondLineColor?: string;
  dateRange?: DateRange;
  compareTo?: "Previous period" | "Previous year" | null;
}) {
  const [showDataset1, setShowDataset1] = useState(true);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    // Filtering based on date is now handled in the parent component (page.tsx)
    // This effect will just update the internal state when the data prop changes
    setFilteredData(data);
  }, [data]);

  // Determine data keys for lines (exclude 'date')
  const dataKeys =
    data.length > 0 ? Object.keys(data[0]).filter((key) => key !== "date") : [];

  // Assign colors dynamically for multiple lines
  const colors = [
    "#101828",
    "#007BFF",
    "#FFC107",
    "#28A745",
    "#DC3545",
    "#6F42C1",
  ]; // Add more colors if needed

  return (
    <div className="py-4 border border-[#EAECF0] rounded-xl shadow-[0px_1px_2px_0px_rgba(16,24,40,0.06)] bg-white w-full">
      <h3 className="font-semibold pb-4 px-5">{title}</h3>
      <Separator />
      <div className="flex justify-between items-center p-5 pb-3">
        <p className="text-2xl font-semibold">{value}</p>
        <div
          className={`${
            percentage >= 0 ? "text-[#339405]" : "text-red-500"
          } text-2xl font-semibold flex items-center`}
        >
          <span className="mr-1 font-light text-xl">
            {percentage >= 0 ? <MoveUp /> : <MoveDown color="red" />}
          </span>
          {Math.abs(percentage).toFixed(2)}%
        </div>
      </div>
      <div className="flex flex-col gap-5 px-5">
        <p className="text-[13px] font-medium mt-2">
          {title.includes("Location")
            ? "OVER TIME by Location"
            : dataKeyName
            ? dataKeyName.toUpperCase() + " OVER TIME"
            : "DATA OVER TIME"}
        </p>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={filteredData}>
            <defs>
              {dataKeys.map((key, index) => (
                <linearGradient
                  id={`gradient-${key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                  key={key}
                >
                  <stop
                    offset="0%"
                    stopColor={colors[index % colors.length]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={colors[index % colors.length]}
                    stopOpacity={0}
                  />
                </linearGradient>
              ))}
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#DEE3EDB2"
              horizontal={true}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#666" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#666" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "12px",
              }}
            />

            {dataKeys.map((key, index) => (
              <React.Fragment key={key}>
                <Area
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={`url(#gradient-${key})`}
                  key={`area-${key}`}
                />
                <Line
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2.5}
                  dot={{ r: 0 }}
                  activeDot={{ r: 5, fill: colors[index % colors.length] }}
                  key={`line-${key}`}
                />
              </React.Fragment>
            ))}
          </AreaChart>
        </ResponsiveContainer>

        <div className="flex justify-end gap-4 items-center text-xs text-gray-500">
          {dateRange?.from && dateRange?.to
            ? `${format(dateRange.from, "MMM. d")}-${format(
                dateRange.to,
                "MMM. d"
              )}`
            : "Custom Range"}
        </div>
      </div>
    </div>
  );
}
