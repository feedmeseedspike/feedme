"use client";

import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@components/ui/breadcrumb";
import { usePathname } from "next/navigation";

interface CustomBreadcrumbProps {
  hideCategorySegment?: boolean;
  category?: string;
  productName?: string;
}

const CustomBreadcrumb = ({
  hideCategorySegment = false,
  category,
  productName,
}: CustomBreadcrumbProps) => {
  const paths = usePathname() ?? "";
  const pathNames = paths.split("/").filter((path) => path);

  // If category and productName are provided, use them for the breadcrumb
  const displayPathNames =
    category && productName
      ? [category, productName]
      : hideCategorySegment
        ? pathNames.filter((name) => name !== "category")
        : pathNames;

  return (
    <Breadcrumb className="">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {displayPathNames.length > 0 && (
          <>
            <BreadcrumbSeparator />
            {displayPathNames.map((link, index) => {
              const isLast = index === displayPathNames.length - 1;
              // Build href for category, but not for product name
              const href = index === 0 ? `/category/${link}` : undefined;
              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{link}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href || "#"}>{link}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;
