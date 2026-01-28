"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
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
  Edit,
  Trash2,
  Package
} from "lucide-react";
import PaginationBar from "@components/shared/pagination";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "../../../../hooks/useToast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  const [search, setSearch] = useState(initialSearch || "");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bundleToDeleteId, setBundleToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const {
    data: bundlesData,
    isLoading,
  } = useQuery({
    queryKey: ["admin-bundles", currentPage, search],
    queryFn: async () => {
      const { data } = await fetchBundles({
        page: 1,
        itemsPerPage: 1000, 
        search: search,
      });
      const filtered = ((data as any[]) || []).filter(b => !b.video_url);
      return { bundles: filtered, total: filtered.length };
    },
    initialData: { bundles: initialBundles, total: initialTotalBundles },
  });

  const bundles = bundlesData?.bundles || [];
  const totalPages = Math.ceil((bundlesData?.total || 0) / itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleDeleteClick = (id: string) => {
    setBundleToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!bundleToDeleteId) return;
    setIsDeleting(true);
    try {
      await deleteBundle(bundleToDeleteId);
      setIsDeleteDialogOpen(false);
      showToast("Bundle deleted successfully.", "success");
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || "Failed to delete bundle.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen font-custom">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter">Ingredient Bundles</h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Manage your standard ingredient kits and essentials</p>
        </div>
        <Link href="/admin/bundles/build">
          <Button className="bg-[#1B6013] hover:bg-black text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100 transition-all active:scale-95">
            <Package className="w-4 h-4 mr-2" />
            <span>Create New Bundle</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search bundles..."
            className="h-14 pl-12 rounded-2xl border-gray-100 bg-gray-50 focus:bg-white focus:ring-4 focus:ring-[#1B6013]/5 transition-all font-bold"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="border border-gray-100 rounded-[2.5rem] overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow className="hover:bg-transparent border-b-gray-100">
              <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Bundle</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status</TableHead>
              <TableHead className="text-right px-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bundles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center">
                   <Package size={48} className="mx-auto text-gray-100 mb-4" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No bundles found in the kitchen.</p>
                </TableCell>
              </TableRow>
            ) : (
              bundles.map((bundle) => (
                <TableRow key={bundle.id} className="hover:bg-gray-50/50 border-b-gray-50 transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      {bundle.thumbnail_url ? (
                        <div className="h-14 w-14 rounded-2xl overflow-hidden relative shadow-md">
                          <Image src={bundle.thumbnail_url} alt={bundle.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                      )}
                      <div>
                        <div className="font-black text-gray-950 uppercase tracking-tight text-lg leading-tight">{bundle.name}</div>
                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Standard Kit</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="font-black text-gray-950">₦{bundle.price?.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                     <div className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${bundle.stock_status === 'in_stock' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {bundle.stock_status?.replace('_', ' ')}
                     </div>
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/bundles/${bundle.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl border border-gray-100 hover:bg-white hover:border-[#1B6013] hover:text-[#1B6013] transition-all">
                          <Edit size={18} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(bundle.id)}
                        className="h-12 w-12 rounded-xl border border-gray-100 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {bundles.length > itemsPerPage && (
        <div className="mt-12 flex justify-center">
          <PaginationBar page={currentPage} totalPages={totalPages} urlParamName="page" />
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-12 max-w-md">
          <DialogHeader>
            <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mb-4">Confirm Deletion</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Are you sure you want to delete this bundle? This action cannot be undone.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-10 flex gap-4">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs bg-red-500 hover:bg-red-600">
              {isDeleting ? "Deleting..." : "Delete Bundle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
