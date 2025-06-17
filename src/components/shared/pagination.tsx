"use client";

import { cn } from "../../lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
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
    const newSearchParams = new URLSearchParams(searchParams.toString());
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
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(currentPage - 1)}
            className={cn(
              currentPage === 1 && "pointer-events-none text-muted-foreground"
            )}
          >
            Previous
          </PaginationPrevious>
        </PaginationItem>
        {Array.from({ length: totalPages }).map((_, i) => {
          const pageNum = i + 1;
          const isEdgePage = pageNum === 1 || pageNum === totalPages;
          const isNearCurrentPage = Math.abs(pageNum - currentPage) <= 2;

          if (!isEdgePage && !isNearCurrentPage) {
            if (i === 1 || i === totalPages - 2) {
              return (
                <PaginationItem key={pageNum} className="hidden md:block">
                  <PaginationEllipsis className="text-muted-foreground" />
                </PaginationItem>
              );
            }
            return null;
          }
          return (
            <PaginationItem
              key={pageNum}
              className={cn(
                "hidden md:block",
                pageNum === currentPage && "pointer-events-none block"
              )}
            >
              <PaginationLink
                onClick={() => handlePageChange(pageNum)}
                isActive={pageNum === currentPage}
              >
                {pageNum}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(currentPage + 1)}
            className={cn(
              currentPage >= totalPages &&
                "pointer-events-none text-muted-foreground"
            )}
          >
            Next
          </PaginationNext>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationBar;
