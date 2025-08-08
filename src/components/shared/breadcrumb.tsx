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
import { toSlug } from "src/lib/utils";

interface CustomBreadcrumbProps {
  hideCategorySegment?: boolean;
  category?: string;
  productName?: string;
  accountHref?: string;
}

const CustomBreadcrumb = ({
  hideCategorySegment = false,
  category,
  productName,
  accountHref,
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
        {accountHref && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={accountHref}>Account</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {displayPathNames.length > 1 && <BreadcrumbSeparator />}
          </>
        )}
        {displayPathNames.length > 0 && (
          <>
            {/* If accountHref is set, skip the first path as it's replaced by Account */}
            {!accountHref && <BreadcrumbSeparator />}
            {displayPathNames.map((link, index) => {
              // If accountHref is set, skip the first path segment
              if (accountHref && index === 0) return null;
              const isLast = index === displayPathNames.length - 1;
              // Build href for category, but not for product name
              // Use toSlug to convert the link to proper URL format
              // Special handling for offers - don't prefix with /category
              const isOffers = decodeURIComponent(link).toLowerCase() === 'offers';
              const href = index === 0 ? 
                (isOffers ? `/offers` : `/category/${toSlug(decodeURIComponent(link))}`) : 
                undefined;
              return (
                <React.Fragment key={index}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{decodeURIComponent(link)}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={href || "#"}>{decodeURIComponent(link)}</Link>
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
