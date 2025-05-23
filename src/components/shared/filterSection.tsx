"use client";

import React, { useMemo, useCallback } from "react";
import Link from "next/link";
import { Checkbox } from "../ui/checkbox";
// import { Rating } from "../shared/product/rating";
import { Separator } from "../ui/separator";

const FilterSection = React.memo(
  ({
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
  }) => {
    const createQueryString = useCallback(
      (name: string, value: string) => {
        const params = new URLSearchParams(searchParams);

        if (value === "all") {
          params.delete(paramKey);
        } else {
          const currentValues = params.get(paramKey)?.split(",") || [];

          if (currentValues.includes(value)) {
            const newValues = currentValues.filter((v) => v !== value);
            if (newValues.length > 0) {
              params.set(paramKey, newValues.join(","));
            } else {
              params.delete(paramKey);
            }
          } else {
            params.set(paramKey, [...currentValues, value].join(","));
          }
        }

        return params.toString();
      },
      [paramKey, searchParams]
    );

    const renderedItems = useMemo(
      () =>
        items.map((item) => (
          <li key={item.value}>
            <Link
              href={`?${createQueryString(paramKey, item.value)}`}
              className="flex items-center gap-3 hover:text-primary transition-colors"
              scroll={false}
            >
              <Checkbox
                checked={
                  item.value === "all"
                    ? selectedValues.length === 0 ||
                      selectedValues.includes("all")
                    : selectedValues.includes(item.value)
                }
                className="h-4 w-4 rounded border-gray-400 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-sm">{item.content || item.name}</span>
            </Link>
          </li>
        )),
      [items, createQueryString, paramKey, selectedValues]
    );

    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          {title}
          <Separator className="flex-1" />
        </h3>
        <ul className="space-y-2 pl-1">{renderedItems}</ul>
      </div>
    );
  }
);

FilterSection.displayName = "FilterSection";

export default FilterSection;
