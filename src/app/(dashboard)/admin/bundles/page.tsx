"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchBundles, createBundle } from "../../../../queries/bundles";
import { Tables } from "../../../../utils/database.types";
import { format } from "date-fns";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Input } from "@components/ui/input";
import {
  Search,
  ArrowDown,
  ListFilter,
  SlidersHorizontal,
  Edit,
} from "lucide-react";
import { Button } from "@components/ui/button";
import PaginationBar from "@components/shared/pagination";
import Image from "next/image";
import Link from "next/link";
import BundleModal from "@components/admin/addBundlesModal";
import { useToast } from "../../../../hooks/useToast";

export default function BundlesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const currentPage = Number(searchParams.get("page")) || 1;
  const ITEMS_PER_PAGE = 10; // You can adjust this
  const [isNewBundleModalOpen, setIsNewBundleModalOpen] = useState(false);
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery<{
    data: Tables<"bundles">[] | null;
    count: number | null;
  }>({
    // Add type argument here
    queryKey: ["bundles", currentPage, search],
    queryFn: () =>
      fetchBundles({
        page: currentPage,
        itemsPerPage: ITEMS_PER_PAGE,
        search,
      }),
    placeholderData: (previousData) => previousData,
  });

  // Mutation for creating a new bundle
  const createBundleMutation = useMutation({
    mutationFn: createBundle,
    onSuccess: () => {
      showToast("Bundle created successfully.", "success");
      setIsNewBundleModalOpen(false);
      // Invalidate the bundles query to refetch data after creation
      queryClient.invalidateQueries({ queryKey: ["bundles"] as const });
    },
    onError: (error) => {
      console.error("Error creating bundle:", error);
      showToast("Failed to create bundle.", "error");
    },
  });

  const totalPages = Math.ceil((data?.count || 0) / ITEMS_PER_PAGE);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      newSearchParams.set("search", e.target.value);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.set("page", "1"); // Reset to first page on new search
    router.push(`?${newSearchParams.toString()}`);
  };

  // Placeholder functions for sort and filter
  const handleSortClick = () => {
    console.log("Sort clicked");
  };

  const handleFilterClick = () => {
    console.log("Filter clicked");
  };

  if (error) return <div>Error loading bundles</div>; // Basic error handling

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-semibold">Bundles</h1>
          <p className="text-[#475467]">Manage bundle here.</p>
        </div>
        <Link href="/admin/bundles/build" passHref>
          <Button asChild className="bg-[#1B6013] hover:bg-[#1B6013]/90">
            <span>+ Build New Bundle</span>
          </Button>
        </Link>
      </div>

      {/* Search, Sort, and Filter */}
      <div className="flex items-center justify-between w-full py-4">
        <div className="relative w-full max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <Input
            type="text"
            placeholder="Search bundles"
            className="pl-10"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSortClick}
            className="flex items-center gap-1"
          >
            <SlidersHorizontal size={16} /> Sort
          </Button>
          <Button
            variant="outline"
            onClick={handleFilterClick}
            className="flex items-center gap-1"
          >
            <ListFilter size={16} /> Filters
          </Button>
        </div>
      </div>

      {/* Bundles Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[300px]">Bundle</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Published Status</TableHead>
              <TableHead className="text-right w-[60px]"></TableHead>{" "}
              {/* Column for Edit icon */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton loading rows
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </TableCell>
                  <TableCell>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="h-5 w-5 rounded bg-gray-200 ml-auto"></div>
                  </TableCell>
                </TableRow>
              ))
            ) : data?.data && data.data.length > 0 ? (
              data.data.map((bundle: Tables<"bundles">) => (
                <TableRow key={bundle.id}>
                  <TableCell className="flex items-center gap-3 font-medium">
                    <Image
                      src={
                        bundle.thumbnail_url || "https://placehold.co/40x40/png"
                      } // Use placeholder if no image
                      alt={bundle.name || "Bundle image"}
                      width={50}
                      height={50}
                      className="rounded"
                      style={{ objectFit: "cover" }}
                    />
                    {bundle.name}
                  </TableCell>
                  <TableCell>
                    ₦{bundle.price ? bundle.price.toFixed(2) : "0.00"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bundle.stock_status === "in_stock"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {bundle.stock_status?.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bundle.published_status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {bundle.published_status?.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/bundles/${bundle.id}/edit`}>
                      {" "}
                      {/* Link to bundle details page */}
                      <Edit
                        size={16}
                        className="text-gray-500 hover:text-gray-700"
                      />
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No bundles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <PaginationBar page={currentPage} totalPages={totalPages} />
      </div>
    </div>
  );
}
