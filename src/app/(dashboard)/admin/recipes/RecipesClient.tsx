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
  Video,
  ExternalLink
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

export default function RecipesClient({
  initialRecipes,
  totalRecipes: initialTotalRecipes,
  itemsPerPage,
  currentPage,
  initialSearch,
}: {
  initialRecipes: any[];
  totalRecipes: number;
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
    data: recipesData,
    isLoading,
  } = useQuery({
    queryKey: ["admin-recipes", currentPage, search],
    queryFn: async () => {
      const { data } = await fetchBundles({
        page: 1,
        itemsPerPage: 1000, // Fetch many to filter for recipes
        search: search,
      });
      const filtered = ((data as any[]) || []).filter(b => !!b.video_url);
      return { recipes: filtered, total: filtered.length };
    },
    initialData: { recipes: initialRecipes, total: initialTotalRecipes },
  });

  const recipes = recipesData?.recipes || [];
  const totalPages = Math.ceil((recipesData?.total || 0) / itemsPerPage);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // Note: Local filtering or server filtering can be implemented here
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
      showToast("Recipe deleted successfully.", "success");
      window.location.reload();
    } catch (err: any) {
      showToast(err.message || "Failed to delete recipe.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen font-custom">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-950 uppercase tracking-tighter">Social Masterclasses</h1>
          <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Manage your shoppable viral video experiences</p>
        </div>
        <Link href="/admin/bundles/create-recipe">
          <Button className="bg-[#1B6013] hover:bg-black text-white h-14 px-8 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100 transition-all active:scale-95">
            <Video className="w-4 h-4 mr-2" />
            <span>Create New Recipe</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search recipes..."
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
              <TableHead className="py-6 px-8 text-[10px] font-black uppercase tracking-widest text-gray-400">Masterclass</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Creator</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Price</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-gray-400">Source</TableHead>
              <TableHead className="text-right px-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-20 text-center">
                   <Video size={48} className="mx-auto text-gray-100 mb-4" />
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No recipes found in the archive.</p>
                </TableCell>
              </TableRow>
            ) : (
              recipes.map((recipe) => (
                <TableRow key={recipe.id} className="hover:bg-gray-50/50 border-b-gray-50 transition-colors">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-4">
                      {recipe.thumbnail_url ? (
                        <div className="h-14 w-14 rounded-2xl overflow-hidden relative shadow-md">
                          <Image src={recipe.thumbnail_url} alt={recipe.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="h-14 w-14 rounded-2xl bg-gray-100" />
                      )}
                      <div>
                        <div className="font-black text-gray-950 uppercase tracking-tight text-lg leading-tight">{recipe.name}</div>
                        <div className="text-[10px] text-[#1B6013] font-black uppercase tracking-widest mt-1">Active Drop</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                     <div className="font-bold text-gray-900">{recipe.chef_name || "FeedMe Chef"}</div>
                  </TableCell>
                  <TableCell>
                     <div className="font-black text-gray-950">₦{recipe.price?.toLocaleString()}</div>
                  </TableCell>
                  <TableCell>
                     {recipe.video_url && (
                        <a href={recipe.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#1B6013] hover:underline font-bold text-xs uppercase tracking-widest">
                           <ExternalLink size={14} /> View Video
                        </a>
                     )}
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/recipes/${recipe.id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl border border-gray-100 hover:bg-white hover:border-[#1B6013] hover:text-[#1B6013] transition-all">
                          <Edit size={18} />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(recipe.id)}
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

      {recipes.length > itemsPerPage && (
        <div className="mt-12 flex justify-center">
          <PaginationBar page={currentPage} totalPages={totalPages} urlParamName="page" />
        </div>
      )}

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-12 max-w-md">
          <DialogHeader>
            <h2 className="text-3xl font-black text-gray-950 uppercase tracking-tighter mb-4">Confirm Deletion</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              Are you sure you want to delete this masterclass? This action cannot be undone and will remove it from all libraries.
            </p>
          </DialogHeader>
          <DialogFooter className="mt-10 flex gap-4">
            <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting} className="flex-1 h-16 rounded-2xl font-black uppercase tracking-widest text-xs bg-red-500 hover:bg-red-600">
              {isDeleting ? "Deleting..." : "Delete Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
