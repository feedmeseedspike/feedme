"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@components/ui/button";
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
  Trash2,
} from "lucide-react";
import PaginationBar from "@components/shared/pagination";
import Image from "next/image";
import Link from "next/link";
import BundleModal from "@components/admin/addBundlesModal";
import { useToast } from "../../../../hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { deleteBundle, fetchBundles } from "../../../../queries/bundles";

export default function BundlesClient({
  initialBundles,
  totalBundles: initialTotalBundles,
  itemsPerPage,
  currentPage,
  initialSearch,
}: {
  initialBundles: any[];
  totalBundles: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(initialSearch || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bundleToDeleteId, setBundleToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  // Use TanStack Query for bundles data
  const {
    data: bundlesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["bundles", currentPage, search],
    queryFn: async () => {
      const { data, count } = await fetchBundles({
        page: currentPage,
        itemsPerPage,
        search: search,
      });
      return { bundles: data || [], totalBundles: count || 0 };
    },
    initialData: { bundles: initialBundles, totalBundles: initialTotalBundles },
    placeholderData: (prev) => prev,
  });

  const bundles = bundlesData?.bundles || [];
  const totalBundles = bundlesData?.totalBundles || 0;
  const totalPages = Math.ceil(totalBundles / itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    const newSearchParams = new URLSearchParams(searchParams?.toString() || "");
    if (newSearch) {
      newSearchParams.set("search", newSearch);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.set("page", "1");
    router.push(`?${newSearchParams.toString()}`);
  };

  const handleDeleteClick = (id: string) => {
    setBundleToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bundleToDeleteId) {
      console.log('No bundle ID to delete');
      setIsDeleteDialogOpen(false);
      return;
    }

    setIsDeleting(true);
    
    try {
      console.log('Calling deleteBundle with ID:', bundleToDeleteId);
      const result = await deleteBundle(bundleToDeleteId);
      console.log('Delete result:', result);
      
      // Immediately close modal and reset state
      setIsDeleteDialogOpen(false);
      setBundleToDeleteId(null);
      setIsDeleting(false);
      
      showToast("Bundle deleted successfully.", "success");
      
      // Force refresh the page to show updated data
      console.log('Refreshing page to show updated data...');
      window.location.reload();
      
    } catch (err: any) {
      console.error('Delete error details:', err);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      showToast(err.message || "Failed to delete bundle.", "error");
      
      // Only close modal on error
      setIsDeleteDialogOpen(false);
      setBundleToDeleteId(null);
      setIsDeleting(false);
    }
  };

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
            onClick={() => {}}
            className="flex items-center gap-1"
          >
            <SlidersHorizontal size={16} /> Sort
          </Button>
          <Button
            variant="outline"
            onClick={() => {}}
            className="flex items-center gap-1"
          >
            <ListFilter size={16} /> Filters
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[300px]">Bundle</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock Status</TableHead>
              <TableHead>Published Status</TableHead>
              <TableHead className="text-right w-[60px]"></TableHead>
              <TableHead className="text-right w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-gray-400">
                  No bundles found.
                </TableCell>
              </TableRow>
            ) : (
              bundles.map((bundle) => (
                <TableRow key={bundle.id}>
                  <TableCell className="flex items-center gap-3">
                    {bundle.thumbnail_url ? (
                      <div className="h-10 w-10 rounded overflow-hidden relative">
                        <Image
                          src={bundle.thumbnail_url}
                          alt={bundle.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200" />
                    )}
                    <div>
                      <div className="font-medium">{bundle.name}</div>
                      <div className="text-xs text-gray-500">
                        {bundle.description 
                          ? bundle.description.length > 50 
                            ? `${bundle.description.substring(0, 50)}...` 
                            : bundle.description
                          : "No description"
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>₦{bundle.price?.toLocaleString()}</TableCell>
                  <TableCell>{bundle.stock_status}</TableCell>
                  <TableCell>{bundle.published_status}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/bundles/${bundle.id}/edit`}>
                      <Button variant="outline" size="icon">
                        <Edit size={16} />
                      </Button>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteClick(bundle.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex justify-center">
        <PaginationBar
          page={currentPage}
          totalPages={totalPages}
          urlParamName="page"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this bundle? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setBundleToDeleteId(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
