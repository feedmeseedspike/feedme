import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ totalPages, currentPage, onPageChange }) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
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

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }).map((_, index) => {
          const pageNum = index + 1;
          const isActive = currentPage === pageNum;

          // Simple logic for showing pages - can be enhanced with ellipses if needed
          // but for now keeping it simple or matching the other component's logic
          if (totalPages > 7) {
            const isEdgePage = pageNum === 1 || pageNum === totalPages;
            const isNearCurrentPage = Math.abs(pageNum - currentPage) <= 1;

            if (!isEdgePage && !isNearCurrentPage) {
              if (
                (pageNum === 2 && currentPage > 3) ||
                (pageNum === totalPages - 1 && currentPage < totalPages - 2)
              ) {
                return (
                  <span key={pageNum} className="text-gray-400">
                    ...
                  </span>
                );
              }
              return null;
            }
          }

          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "relative px-2 py-1 text-sm font-medium transition-all duration-200",
                isActive ? "text-[#1B6013]" : "text-gray-500 hover:text-[#1B6013]"
              )}
            >
              {pageNum}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#1B6013]" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
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
    </div>
  );
};

export default Pagination;
