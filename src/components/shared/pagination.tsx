"use client";

import { cn } from "../../lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "../../components/ui/pagination";

type PaginationBarProps = {
  page: number | string;
  totalPages: number;
  urlParamName?: string;
};

const PaginationBar = ({
  page,
  totalPages,
  urlParamName = "page",
}: PaginationBarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number(page);

  function getLink(pageNum: number) {
    const newSearchParams = new URLSearchParams(searchParams?.toString() || "");
    newSearchParams.set(urlParamName, pageNum.toString());
    return `?${newSearchParams.toString()}`;
  }

  const handlePageChange = (pageNum: number) => {
    if (pageNum > 0 && pageNum <= totalPages) {
      const newUrl = `${window.location.pathname}${getLink(pageNum)}`;
      router.push(newUrl);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <Pagination className="mt-8">
      <PaginationContent className="gap-2 sm:gap-4">
        {/* Previous Button */}
        <PaginationItem>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              currentPage === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-green-50 hover:text-[#1B6013]"
            )}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </PaginationItem>

        {/* Page Numbers */}
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1;
          const isEdgePage = pageNum === 1 || pageNum === totalPages;
          const isNearCurrentPage = Math.abs(pageNum - currentPage) <= 1;

          if (!isEdgePage && !isNearCurrentPage) {
            if (
              (pageNum === 2 && currentPage > 3) ||
              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
            ) {
              return (
                <PaginationItem key={pageNum}>
                  <PaginationEllipsis className="text-gray-400" />
                </PaginationItem>
              );
            }
            return null;
          }

          const isActive = pageNum === currentPage;

          return (
            <PaginationItem key={pageNum}>
              <button
                onClick={() => handlePageChange(pageNum)}
                className={cn(
                  "relative px-2 py-1 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-[#1B6013]"
                    : "text-gray-500 hover:text-[#1B6013]"
                )}
              >
                {pageNum}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1B6013]" />
                )}
              </button>
            </PaginationItem>
          );
        })}

        {/* Next Button */}
        <PaginationItem>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
              currentPage === totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-green-50 hover:text-[#1B6013]"
            )}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationBar;
