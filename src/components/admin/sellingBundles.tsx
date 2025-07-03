import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Badge } from "@components/ui/badge";
import { Button } from "@components/ui/button";
import { ArrowDown } from "lucide-react";
import Image from "next/image";
import { formatNaira } from "src/lib/utils";

const products = [
  {
    id: 1,
    name: "Large Tomatoes",
    category: "Pepper",
    price: 5000,
    quantity: 535,
    stock: "In stock",
    image: "/images/fruits.png",
  },
  {
    id: 2,
    name: "Onions",
    category: "Onions",
    price: 5000,
    quantity: 40,
    stock: "In stock",
    image: "/images/lemon.png",
  },
  {
    id: 3,
    name: "Rodo",
    category: "Fruits",
    price: 5000,
    quantity: 125,
    stock: "In stock",
    image: "/images/author.png",
  },
  {
    id: 4,
    name: "Watermelon",
    category: "Fruits",
    price: 5000,
    quantity: 425,
    stock: "Out of stock",
    image: "/images/default.png",
  },
];

const getRandomColor = () => {
  const colors = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-purple-100 text-purple-700",
    "bg-orange-100 text-orange-700",
    "bg-yellow-100 text-yellow-700",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function BestSellingBundles() {
  return (
    <div className="p-4 pt-8">
      <h2 className="text-xl font-semibold mb-4">Best Selling Products</h2>
      <div className="overflow-x-auto border rounded-lg">
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
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="flex items-center gap-3">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                  {product.name}
                </TableCell>
                <TableCell>
                  <Badge className={`${getRandomColor()} px-2 py-1 rounded-lg`}>
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell>{formatNaira(product.price)}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>
                  <span
                    className={
                      product.stock === "In stock"
                        ? "text-green-600"
                        : "text-orange-600"
                    }
                  >
                    {product.stock}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <Button variant="outline">Previous</Button>
        <span>Page 1 of 10</span>
        <Button variant="outline">Next</Button>
      </div>
    </div>
  );
}
