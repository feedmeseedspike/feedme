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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@components/ui/select";

const progressOptions = [
  "Order Confirmed",
  "Processing order",
  "Out for Delivery",
];

interface Customer {
  name: string;
  phone: string;
}

interface Order {
  orderNo: string;
  date: string;
  customer: Customer;
  amount: string;
  platform: string;
  location: string;
  progress: string;
}

interface PendingOrdersProps {
  initialData: Order[];
}

const PendingOrders: React.FC<PendingOrdersProps> = ({ initialData = [] }) => {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState(initialData);
  const [filteredOrders, setFilteredOrders] = useState(initialData);
  const [page, setPage] = useState(1);
  const ordersPerPage = 4;

  useEffect(() => {
    setOrders(initialData);
    setFilteredOrders(initialData);
  }, [initialData]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setFilteredOrders(
      orders.filter(
        (order) =>
          order.customer.name.toLowerCase().includes(value) ||
          order.orderNo.toLowerCase().includes(value) ||
          order.platform.toLowerCase().includes(value)
      )
    );
  };

  const paginatedOrders = filteredOrders.slice(
    (page - 1) * ordersPerPage,
    page * ordersPerPage
  );

  return (
    <div className="p-4 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Pending Orders</h2>
        <Input
          placeholder="Search"
          className="w-64"
          value={search}
          onChange={handleSearch}
        />
      </div>
      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Order No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order, index) => (
              <TableRow key={index}>
                <TableCell>{order.orderNo}</TableCell>
                <TableCell>{order.date}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Avatar>
                    <AvatarFallback>BA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{order.customer.name}</p>
                    <p className="text-sm text-gray-500">
                      {order.customer.phone}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>{order.platform}</TableCell>
                <TableCell>{order.location}</TableCell>
                <TableCell>
                  <Select defaultValue={order.progress}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {progressOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((prev) => prev - 1)}
        >
          Previous
        </Button>
        <p>
          Page {page} of{" "}
          {Math.ceil((filteredOrders || []).length / ordersPerPage)}
        </p>
        <Button
          variant="outline"
          disabled={
            page === Math.ceil((filteredOrders || []).length / ordersPerPage)
          }
          onClick={() => setPage((prev) => prev + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default PendingOrders;
