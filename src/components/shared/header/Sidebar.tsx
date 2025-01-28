'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Category } from '../../../types/category';
import { useState } from 'react';
import Menu from "@components/icons/menu.svg"

type Props = {
  categories: Category[];
};

export default function Sidebar({ categories }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    console.log('Selected Category:', categories.find((cat) => cat._id === categoryId)?.title);
  };

  return (
    <div className="w-fit">
      <Select onValueChange={handleCategoryChange}>
        <SelectTrigger className="w-full flex items-center gap-1">
          <Menu className=""/>
          <SelectValue placeholder="categories" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category._id} value={category._id}>
              {category.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedCategory && (
        <p className="mt-4 text-sm text-gray-600">
          Selected Category: {categories.find((cat) => cat._id === selectedCategory)?.title}
        </p>
      )}
    </div>
  );
}
