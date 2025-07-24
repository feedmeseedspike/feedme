"use client";

import { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { Button } from "@components/ui/button";
import {
  ArrowDown,
  Eye,
  Search,
  Plus,
  ArrowUpDown,
  ListFilter,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@components/ui/sheet";
import { Checkbox } from "@components/ui/checkbox";
import { BiEdit } from "react-icons/bi";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteCategoryAction } from "./add-new/actions";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { Category } from "src/types/category";
import { useRouter, useSearchParams } from "next/navigation";
import PaginationBar from "../../../../components/shared/pagination";
import { useToast } from "../../../../hooks/useToast";

export default function CategoriesClient({
  initialCategories,
  totalCategories,
  itemsPerPage,
  currentPage,
  initialSearch,
  initialTags,
}: {
  initialCategories: any[];
  totalCategories: number;
  itemsPerPage: number;
  currentPage: number;
  initialSearch: string;
  initialTags: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [search, setSearch] = useState(initialSearch || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTags || []);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [categories, setCategories] = useState<any[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const page = currentPage;
  const ITEMS_PER_PAGE = itemsPerPage;

  // Get unique tags from all categories (for filter UI)
  const allTags = Array.from(
    new Set(categories.flatMap((category) => category.tags || []))
  );

  // Handle search input change
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

  // Toggle filter for tags
  const toggleFilter = (value: string) => {
    const newSelectedTags = selectedTags.includes(value)
      ? selectedTags.filter((item) => item !== value)
      : [...selectedTags, value];
    setSelectedTags(newSelectedTags);

    const newSearchParams = new URLSearchParams(searchParams?.toString() || "");
    newSearchParams.delete("tags");
    newSelectedTags.forEach((tag) => newSearchParams.append("tags", tag));
    newSearchParams.set("page", "1");
    router.push(`?${newSearchParams.toString()}`);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      try {
        setLoading(true);
        console.log("Deleting category:", categoryToDelete.id);
        await deleteCategoryAction(categoryToDelete.id);
        console.log("Category deleted successfully");
        
        // Show success message
        showToast("Category deleted successfully!", "success");
        
        // Remove the deleted category from the UI
        setCategories((prev) =>
          prev.filter((cat) => cat.id !== categoryToDelete.id)
        );
        
        // Refresh the page to get updated data
        router.refresh();
      } catch (err: any) {
        console.error("Error deleting category:", err);
        setError(err.message || "Failed to delete category");
        showToast(`Failed to delete category: ${err.message || "Unknown error"}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };

  const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);

  if (loading) return <div className="p-4">Loading categories...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-3xl font-semibold">Categories</h2>
          <p className="text-[#475467]">Manage your categories here.</p>
        </div>
        <Link href="/admin/categories/add-new">
          <Button className="bg-[#1B6013] text-white">
            <Plus size={16} /> Add New Category
          </Button>
        </Link>
      </div>

      {/* Search & Filter Section */}
      <div className="flex items-center justify-between w-full py-4">
        <div className="relative w-full max-w-[400px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Search for categories"
            className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]"
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <button className="flex items-center gap-1 px-6 py-2 border rounded-md text-gray-700 hover:bg-gray-100 shadow-[0px_1px_3px_0px_rgba(16,24,40,0.10)]">
                <ListFilter size={16} />
                Filters
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="!px-0">
              <SheetHeader className="px-4">
                <div className="flex justify-between items-center">
                  <SheetTitle>Filters</SheetTitle>
                  <button
                    onClick={() =>
                      document.dispatchEvent(
                        new KeyboardEvent("keydown", { key: "Escape" })
                      )
                    }
                    className="p-2 hover:bg-gray-100 rounded-md"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-[#475467] text-sm">
                  Apply filters to table data.
                </p>
              </SheetHeader>
              <div className="mt-6 px-4">
                <h3 className="text-sm text-[#344054] font-medium mb-2">
                  Tags
                </h3>
                {allTags.map((tag) => (
                  <div key={tag} className="flex items-center gap-2 mb-2 pl-2">
                    <Checkbox
                      id={tag}
                      className="size-4 !rounded-md border-[#D0D5DD]"
                      checked={selectedTags.includes(tag)}
                      onCheckedChange={() => toggleFilter(tag)}
                    />
                    <label className="font-medium text-sm" htmlFor={tag}>
                      {tag}
                    </label>
                  </div>
                ))}
              </div>
              <SheetFooter className="border-t pt-4 !w-full">
                <div className="font-semibold text-sm flex justify-between items-end px-4">
                  <div
                    className="text-[#B42318] cursor-pointer"
                    onClick={() => {
                      setSelectedTags([]);
                      const newSearchParams = new URLSearchParams(
                        searchParams?.toString() || ""
                      );
                      newSearchParams.delete("tags");
                      newSearchParams.set("page", "1");
                      router.push(`?${newSearchParams.toString()}`);
                    }}
                  >
                    Clear all filters
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={"outline"}
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }
                    >
                      Cancel
                    </Button>
                    <Button className="bg-[#1B6013]">Apply</Button>
                  </div>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Table Section */}
      <div className="border rounded-lg shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead>Image</TableHead>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.thumbnail ? (
                      <div className="w-12 h-12 relative rounded-md overflow-hidden">
                        <Image
                          src={category.thumbnail}
                          alt={category.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-200" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium cursor-pointer hover:bg-gray-50">
                    <Link href={`/admin/categories/view/${category.id}`}>
                      {category.title}
                    </Link>
                  </TableCell>
                  <TableCell>{category.description || "N/A"}</TableCell>
                  <TableCell>
                    {category.tags && category.tags.length > 0
                      ? category.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs mr-1 mb-1"
                          >
                            {tag}
                          </span>
                        ))
                      : "N/A"}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Link href={`/admin/categories/edit/${category.id}`}>
                      <Button variant="outline" size="icon">
                        <BiEdit size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        console.log("Delete button clicked for category:", category.id);
                        handleDeleteClick(category);
                      }}
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
          page={page}
          totalPages={totalPages}
          urlParamName="page"
        />
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Are you sure you want to delete the category &apos;
            {categoryToDelete?.title}&apos;? This action cannot be undone.
          </DialogDescription>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
