"use client";

import Link from "next/link";
import { Checkbox } from "../ui/checkbox";
// import { Rating } from "../shared/product/rating";
import { Separator } from "../ui/separator";

export default function FilterSection({
  title,
  items,
  paramKey,
  selectedValues = [],
  searchParams,
}: {
  title: string;
  items: Array<{
    name: string;
    value: string;
    content?: React.ReactNode;
  }>;
  paramKey: string;
  selectedValues: string[];
  searchParams: any;
}) {
  const createQueryString = (name: string, value: string) => {
    const currentValues = selectedValues.includes("all")
      ? []
      : [...selectedValues];
    
    let newValues: string[];
    if (value === "all") {
      newValues = [];
    } else if (currentValues.includes(value)) {
      newValues = currentValues.filter(v => v !== value);
    } else {
      newValues = [...currentValues, value];
    }

    const params = new URLSearchParams(searchParams);
    
    // Remove page param when filters change
    params.delete("page");
    
    if (newValues.length === 0) {
      params.delete(paramKey);
    } else {
      params.set(paramKey, newValues.join(","));
    }

    return params.toString();
  };
  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        {title}
        <Separator className="flex-1" />
      </h3>
      <ul className="space-y-2 pl-1">
        {items.map((item) => (
          <li key={item.value}>
            <Link
              href={`?${createQueryString(paramKey, item.value)}`}
              className="flex items-center gap-3 hover:text-primary transition-colors"
              scroll={false}
            >
              <Checkbox
                checked={
                  item.value === "all"
                    ? selectedValues.length === 0 || selectedValues.includes("all")
                    : selectedValues.includes(item.value)
                }
                className="h-4 w-4 rounded border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm">
                {item.content || item.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}