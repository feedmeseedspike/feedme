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
  category?: string; // Add a prop to receive the product category
}

const CustomBreadcrumb = ({ category }: CustomBreadcrumbProps) => {
  const paths = usePathname() ?? ""; // Handle null or undefined paths
  const pathNames = paths.split("/").filter((path) => path);
  
  // Check if we're on a product page
  const isProductPage = pathNames[0] === "product";

  return (
    <Breadcrumb className="mt-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {isProductPage && category ? (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/category/${category}`}>{category}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pathNames[1]}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          // For other pages, show the regular path
          pathNames.map((link, index) => {
            const isLast = index === pathNames.length - 1;
            const href = `/${pathNames.slice(0, index + 1).join("/")}`;

            return (
              <React.Fragment key={index}>
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage>{link}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{link}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;
