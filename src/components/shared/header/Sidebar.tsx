"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Category } from "../../../types/category";
import { useState } from "react";
import Menu from "@components/icons/menu.svg";
import Link from "next/link";

type Props = {
  categories: Category[];
};

export default function Sidebar({ categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // console.log('Selected Category:', categories.find((cat) => cat._id === categoryId)?.title);
  };

  return (
    <div className="w-fit">
      <Select onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full flex items-center gap-1">
          <Menu className="" />
          <SelectValue placeholder="categories" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <Link href={`/category/${category.title}`}>{category.title}</Link>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
