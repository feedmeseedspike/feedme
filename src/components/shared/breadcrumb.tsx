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
  hideCategorySegment?: boolean; // Add this prop
}

const CustomBreadcrumb = ({ hideCategorySegment = false }: CustomBreadcrumbProps) => {
  const paths = usePathname() ?? "";
  const pathNames = paths.split("/").filter((path) => path);

  // Filter out "category" if the prop is true
  const displayPathNames = hideCategorySegment
    ? pathNames.filter(name => name !== "category")
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
              // Build href with original path names (including "category" if present)
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
            })}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CustomBreadcrumb;