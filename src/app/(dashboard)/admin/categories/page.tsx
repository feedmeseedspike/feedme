"use client";

import { useState, useEffect } from "react";
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
import {
  getCategories,
  countCategories,
  deleteCategory,
} from "../../../../lib/api";
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

export default function Categories() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.getAll("tags") || []
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCategories, setTotalCategories] = useState(0);

  const currentPage = Number(searchParams.get("page") || 1);
  const ITEMS_PER_PAGE = 10; // Define items per page

  useEffect(() => {
    setLoading(true);
    const currentSearch = searchParams.get("search") || "";
    const currentTags = searchParams.getAll("tags") || [];
    const currentPageNumber = Number(searchParams.get("page") || 1);

    getCategories({
      page: currentPageNumber,
      limit: ITEMS_PER_PAGE,
      search: currentSearch,
      tags: currentTags,
    })
      .then(({ data, count }) => {
        setCategories(data || []);
        setTotalCategories(count || 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch categories");
        setLoading(false);
      });
  }, [searchParams]); // Depend on searchParams to refetch on changes

  // Get unique tags from all categories (consider fetching these separately if needed)
  // For now, assuming you have a way to get all possible tags
  const allTags = Array.from(
    new Set(categories.flatMap((category) => category.tags || []))
  ); // This will only show tags from the current page's categories

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value;
    setSearch(newSearch);
    const newSearchParams = new URLSearchParams(searchParams.toString());
    if (newSearch) {
      newSearchParams.set("search", newSearch);
    } else {
      newSearchParams.delete("search");
    }
    newSearchParams.set("page", "1"); // Reset to page 1 on search
    router.push(`?${newSearchParams.toString()}`);
  };

  // Toggle filter for tags
  const toggleFilter = (value: string) => {
    const newSelectedTags = selectedTags.includes(value)
      ? selectedTags.filter((item) => item !== value)
      : [...selectedTags, value];
    setSelectedTags(newSelectedTags);

    const newSearchParams = new URLSearchParams(searchParams.toString());
    newSearchParams.delete("tags");
    newSelectedTags.forEach((tag) => newSearchParams.append("tags", tag));
    newSearchParams.set("page", "1"); // Reset to page 1 on tag filter change
    router.push(`?${newSearchParams.toString()}`);
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (categoryToDelete) {
      try {
        await deleteCategory(categoryToDelete.id); // Call the deleteCategory API
        alert("Category deleted successfully!");
        // Refresh the data after successful deletion
        const currentSearch = searchParams.get("search") || "";
        const currentTags = searchParams.getAll("tags") || [];
        const currentPageNumber = Number(searchParams.get("page") || 1);

        // Refetch categories for the current page or adjust pagination
        getCategories({
          page: currentPageNumber,
          limit: ITEMS_PER_PAGE,
          search: currentSearch,
          tags: currentTags,
        })
          .then(({ data, count }) => {
            setCategories(data || []);
            setTotalCategories(count || 0);
            setLoading(false);
          })
          .catch((err) => {
            setError(err.message || "Failed to fetch categories");
            setLoading(false);
          });
      } catch (err: any) {
        setError(err.message || "Failed to delete category");
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
            onChange={handleSearchChange} // Use the new handler
          />
        </div>
        <div className="flex items-center gap-3">
          {/* Filter Sheet */}
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
                      onCheckedChange={() => toggleFilter(tag)} // Use the new handler
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
                      // Clear all filters logic
                      setSelectedTags([]);
                      const newSearchParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      newSearchParams.delete("tags");
                      newSearchParams.set("page", "1"); // Reset to page 1
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
                    {/* Apply button now just closes the sheet as filtering is instant */}
                    <Button
                      className="bg-[#1B6013]"
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "Escape" })
                        )
                      }
                    >
                      Apply
                    </Button>
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
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                {" "}
                {/* Use category.id instead of _id */}
                <TableCell>
                  {category.thumbnail?.url && (
                    <Image
                      src={category.thumbnail.url}
                      alt={category.title}
                      width={60}
                      height={60}
                      className="rounded-md object-cover"
                    />
                  )}
                </TableCell>
                <TableCell>{category.title}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell>
                  {(category.tags || []).map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-block bg-gray-200 rounded-full px-2 py-0.5 text-xs font-semibold text-gray-700 mr-2 mb-2"
                    >
                      {tag}
                    </span>
                  ))}
                </TableCell>
                <TableCell className="flex items-center gap-2">
                  <Link href={`/admin/categories/view/${category.id}`}>
                    {" "}
                    {/* Use category.id */}
                    <Button variant="outline" size="icon">
                      <Eye size={16} />
                    </Button>
                  </Link>
                  <Link href={`/admin/categories/edit/${category.id}`}>
                    {" "}
                    {/* Use category.id */}
                    <Button variant="outline" size="icon">
                      <BiEdit size={16} />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteClick(category)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Bar */}
      <div className="mt-4 flex justify-center">
        <PaginationBar
          page={currentPage}
          totalPages={totalPages}
          urlParamName="page"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the category "
              {categoryToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
