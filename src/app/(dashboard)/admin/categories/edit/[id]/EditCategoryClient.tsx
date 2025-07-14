"use client";

import { useState } from "react";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@components/ui/badge";
import { X } from "lucide-react";
import Image from "next/image";
import { Category } from "src/types/category";
import { updateCategory, uploadImage } from "../../../../../../lib/api";
import { useToast } from "../../../../../../hooks/useToast";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@components/ui/breadcrumb";
import { createClient } from "src/utils/supabase/client";
import supabaseAdmin from "@/utils/supabase/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { useEffect } from "react";

const supabase = createClient();

export default function EditCategoryClient({
  initialCategory,
}: {
  initialCategory: Category;
}) {
  const router = useRouter();
  const { showToast } = useToast();

  console.log("initialCategeory", initialCategory);

  const [title, setTitle] = useState(initialCategory.title || "");
  const [description, setDescription] = useState(
    initialCategory.description || ""
  );
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>(initialCategory.tags || []);
  const [keynote, setKeynote] = useState("");
  const [keynotes, setKeynotes] = useState<string[]>(
    initialCategory.keynotes || []
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialCategory.thumbnail?.url || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(
    initialCategory.banner_url || null
  );
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Add preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const draftStr = localStorage.getItem(
      `categoryDraft_${initialCategory.id}`
    );
    if (draftStr) {
      const draft = JSON.parse(draftStr);
      setTitle(draft.title || "");
      setDescription(draft.description || "");
      setTags(draft.tags || []);
      setKeynotes(draft.keynotes || []);
      if (draft.imageBase64) setImagePreview(draft.imageBase64);
      if (draft.bannerBase64) setBannerPreview(draft.bannerBase64);
    }
  }, [initialCategory.id]);

  const handleAddTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddKeynote = () => {
    if (keynote.trim() && !keynotes.includes(keynote.trim())) {
      setKeynotes([...keynotes, keynote.trim()]);
      setKeynote("");
    }
  };

  const handleRemoveKeynote = (keynoteToRemove: string) => {
    setKeynotes(keynotes.filter((k) => k !== keynoteToRemove));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    let thumbnail =
      initialCategory.thumbnail &&
      initialCategory.thumbnail.url &&
      initialCategory.thumbnail.public_id
        ? initialCategory.thumbnail
        : { url: "", public_id: "" };
    let banner_url = initialCategory.banner_url || null;

    if (imageFile) {
      try {
        const fileExt = imageFile.name.split(".").pop();
        const filePath = `${Date.now()}.${fileExt}`;
        const uploadedUrl = await uploadImage(imageFile, "category-images");
        const { data: publicUrlData } = supabase.storage
          .from("category-images")
          .getPublicUrl(filePath);
        thumbnail = {
          url: (publicUrlData && publicUrlData.publicUrl) || uploadedUrl || "",
          public_id: filePath,
        };
      } catch (err: any) {
        showToast(err.message || "Failed to upload image", "error");
        setSubmitting(false);
        return;
      }
    }

    if (bannerFile) {
      try {
        const bannerExt = bannerFile.name.split(".").pop();
        const bannerPath = `banner_${Date.now()}.${bannerExt}`;
        await uploadImage(bannerFile, "category-images");
        const { data: bannerUrlData } = supabaseAdmin.storage
          .from("category-images")
          .getPublicUrl(bannerPath);
        banner_url = bannerUrlData.publicUrl || null;
      } catch (err: any) {
        showToast(err.message || "Failed to upload banner image", "error");
        setSubmitting(false);
        return;
      }
    }

    try {
      const updatedData = {
        title,
        description,
        tags,
        keynotes,
        thumbnail,
        banner_url,
      };
      await updateCategory(initialCategory.id, updatedData);
      showToast("Category updated successfully!", "success");
      router.push("/admin/categories");
    } catch (err: any) {
      showToast(err.message || "Failed to update category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Add a function to save draft to localStorage (keyed by category ID)
  const handleSaveDraft = async () => {
    // Convert images to base64 for storage
    const getBase64 = (file: File | null) =>
      new Promise<string | null>((resolve) => {
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    const [imageBase64, bannerBase64] = await Promise.all([
      getBase64(imageFile),
      getBase64(bannerFile),
    ]);
    const draft = {
      title,
      description,
      tags,
      keynotes,
      imageBase64: imageBase64 || imagePreview,
      bannerBase64: bannerBase64 || bannerPreview,
    };
    localStorage.setItem(
      `categoryDraft_${initialCategory.id}`,
      JSON.stringify(draft)
    );
    showToast("Draft saved!", "success");
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link
          href="/admin/categories"
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Categories
        </Link>
      </div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-semibold">Edit Category</h2>
          <p className="text-[#475467]">Update category details.</p>
        </div>
      </div>
      {error && (
        <div className="p-2 mb-4 text-red-700 bg-red-100 border border-red-200 rounded">
          {error}
        </div>
      )}
      <form id="edit-category-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the basic details for this category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Category Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Fruits, Vegetables, Spices"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this category..."
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Image */}
          <Card>
            <CardHeader>
              <CardTitle>Category Image</CardTitle>
              <CardDescription>
                Update the image that represents this category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image">Thumbnail Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="text-sm text-gray-500">
                  Leave empty to keep the current image
                </p>
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Current Image:</p>
                  <div className="relative w-40 h-40 border rounded-md overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="Category preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banner Image */}
          <Card>
            <CardHeader>
              <CardTitle>Banner Image (optional)</CardTitle>
              <CardDescription>
                Upload a new banner image for this category (optional).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="banner">Banner Image</Label>
                <Input
                  id="banner"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerChange}
                />
                {(bannerPreview || initialCategory.banner_url) && (
                  <div className="mt-2 relative w-full h-32 border rounded-md overflow-hidden">
                    <Image
                      src={bannerPreview || initialCategory.banner_url || ""}
                      alt="Banner Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tags and Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Update tags to help with categorization and search.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <Badge key={t} className="px-2 py-1 flex items-center gap-1">
                    {t}
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(t)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Keynotes */}
          <Card>
            <CardHeader>
              <CardTitle>Keynotes</CardTitle>
              <CardDescription>
                Update key points or features of this category.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={keynote}
                  onChange={(e) => setKeynote(e.target.value)}
                  placeholder="Add a keynote"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeynote();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddKeynote}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {keynotes.map((k) => (
                  <Badge
                    key={k}
                    className="px-2 py-1 flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                  >
                    {k}
                    <X
                      size={14}
                      className="cursor-pointer"
                      onClick={() => handleRemoveKeynote(k)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <CardFooter className="flex justify-end gap-2 mt-6 p-0">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/categories")}
          >
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft}>
            Save as Draft
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setPreviewOpen(true)}
          >
            Preview
          </Button>
          <Button
            type="submit"
            className="bg-[#1B6013] text-white"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>

      {/* Add a preview modal component */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Category Preview</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-4 items-center">
              {imagePreview && (
                <Image
                  src={imagePreview}
                  alt="Thumbnail"
                  width={80}
                  height={80}
                  className="rounded"
                />
              )}
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-gray-600">{description}</p>
                <div className="flex gap-2 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-200 px-2 py-1 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  {keynotes.map((k) => (
                    <span
                      key={k}
                      className="bg-green-100 px-2 py-1 rounded text-xs"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            {bannerPreview && (
              <Image
                src={bannerPreview}
                alt="Banner"
                width={400}
                height={100}
                className="rounded"
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to Edit
            </Button>
            {/* Publish button triggers the existing handleSubmit */}
            <Button
              type="submit"
              form="edit-category-form"
              disabled={submitting}
            >
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
