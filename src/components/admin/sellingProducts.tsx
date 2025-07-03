"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { Avatar } from "@components/ui/avatar";
import Image from "next/image";
import { ArrowDown, CalendarDays } from "lucide-react";

interface Product {
  name: string;
  image: string;
  category: string;
  price: string;
  quantitySold: number;
  stockStatus: "In stock" | "Out of stock";
}

const BestSellingProducts = () => {
  const products: Product[] = [
    {
      name: "Large Tomatoes",
      image: "/images/fruits.png",
      category: "Pepper",
      price: "₦5000",
      quantitySold: 535,
      stockStatus: "In stock",
    },
    {
      name: "Onions",
      image: "/images/lemon.png",
      category: "Onions",
      price: "₦5000",
      quantitySold: 40,
      stockStatus: "In stock",
    },
    {
      name: "Rodo",
      image: "/images/author.png",
      category: "Fruits",
      price: "₦5000",
      quantitySold: 125,
      stockStatus: "In stock",
    },
    {
      name: "Watermelon",
      image: "/images/default.png",
      category: "Fruits",
      price: "₦5000",
      quantitySold: 425,
      stockStatus: "Out of stock",
    },
  ];

  const getRandomLightColor = () => {
    const colors = [
      "bg-red-100 text-red-600",
      "bg-green-100 text-green-600",
      "bg-blue-100 text-blue-600",
      "bg-yellow-100 text-yellow-600",
      "bg-purple-100 text-purple-600",
      "bg-pink-100 text-pink-600",
      "bg-indigo-100 text-indigo-600",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const [page, setPage] = useState(1);
  const productsPerPage = 4;
  const paginatedProducts = products.slice(
    (page - 1) * productsPerPage,
    page * productsPerPage
  );

  return (
    <div className="p-4 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Best Selling Products</h2>
      </div>
      <div className="border rounded-lg shadow-sm overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>
                <div className="flex items-center gap-1">
                  Product
                  <ArrowDown size={16} strokeWidth={0.7} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Category
                  <ArrowDown size={16} strokeWidth={0.7} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Unit Price
                  <ArrowDown size={16} strokeWidth={0.7} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Quantity Sold
                  <ArrowDown size={16} strokeWidth={0.7} />
                </div>
              </TableHead>
              <TableHead>
                <div className="flex items-center gap-1">
                  Stock Status
                  <ArrowDown size={16} strokeWidth={0.7} />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedProducts.map((product, index) => (
              <TableRow key={index}>
                <TableCell className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full rounded-full"
                    />
                  </Avatar>
                  <span>{product.name}</span>
                </TableCell>
                <TableCell>
                  <Badge className={`${getRandomLightColor()} rounded-full`}>
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell>{product.price}</TableCell>
                <TableCell>{product.quantitySold}</TableCell>
                <TableCell>
                  <span
                    className={
                      product.stockStatus === "In stock"
                        ? "text-green-600"
                        : "text-orange-500"
                    }
                  >
                    {product.stockStatus}
                  </span>
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
          onClick={() => setPage(page - 1)}
        >
          Previous
        </Button>
        <p>
          Page {page} of {Math.ceil(products.length / productsPerPage)}
        </p>
        <Button
          variant="outline"
          disabled={page === Math.ceil(products.length / productsPerPage)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default BestSellingProducts;
