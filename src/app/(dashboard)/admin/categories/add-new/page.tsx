"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
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
import { useToast } from "../../../../../hooks/useToast";
import ReactSelect from "react-select";
import { supabase } from "src/lib/supabaseClient";
import { addCategoryAction, uploadCategoryImageAction } from "./actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

// Server-side image upload using server action
async function uploadCategoryImage(file: File, bucketName = "category-images") {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucketName', bucketName);
  return await uploadCategoryImageAction(formData);
}

export default function AddNewCategory() {
  const router = useRouter();
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [keynote, setKeynote] = useState("");
  const [keynotes, setKeynotes] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false); // State for submission loading
  const [error, setError] = useState<string | null>(null); // State for errors
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  // Add preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch all products for selection
  useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, images");
      if (error) {
        console.error("Supabase error fetching products:", error);
      }
      // console.log(allProducts);
      // console.log("Fetched products:", data);
      if (!error && data) setAllProducts(data);
    }
    fetchProducts();
  }, [allProducts]);

  // Add a function to save draft to localStorage
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
      imageBase64,
      bannerBase64,
      selectedProducts,
    };
    localStorage.setItem("categoryDraft", JSON.stringify(draft));
    showToast("Draft saved!", "success");
  };

  // Add a function to load draft from localStorage on mount
  useEffect(() => {
    const draftStr = localStorage.getItem("categoryDraft");
    if (draftStr) {
      const draft = JSON.parse(draftStr);
      setTitle(draft.title || "");
      setDescription(draft.description || "");
      setTags(draft.tags || []);
      setKeynotes(draft.keynotes || []);
      setSelectedProducts(draft.selectedProducts || []);
      if (draft.imageBase64) setImagePreview(draft.imageBase64);
      if (draft.bannerBase64) setBannerPreview(draft.bannerBase64);
    }
  }, []);

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
    setError(null); // Clear previous errors

    if (!imageFile) {
      setError("Please select a thumbnail image.");
      setSubmitting(false);
      return;
    }

    let thumbnail = null;
    let banner_url = null;
    try {
      // Upload thumbnail image using server action
      thumbnail = await uploadCategoryImage(imageFile, "category-images");
      if (bannerFile) {
        // Upload banner image using server action
        const bannerObj = await uploadCategoryImage(
          bannerFile,
          "category-images"
        );
        banner_url = bannerObj.url;
      }
    } catch (err: any) {
      console.error("Image upload error:", err);
      showToast(err.message || "Failed to upload image", "error");
      setSubmitting(false);
      return;
    }

    try {
      const newCategoryData = {
        title,
        description,
        tags,
        keynotes,
        thumbnail,
        banner_url,
      };
      console.log("Category data to be sent:", newCategoryData);
      const created = await addCategoryAction(newCategoryData);
      console.log("Category created successfully:", created);
      // Update selected products' category_ids
      if (created && selectedProducts.length > 0) {
        for (const prod of selectedProducts) {
          const { data: prodData, error: prodError } = await supabase
            .from("products")
            .select("category_ids")
            .eq("id", prod.value)
            .single();
          if (!prodError && prodData) {
            const ids = Array.isArray(prodData.category_ids)
              ? prodData.category_ids
              : [];
            if (!ids.includes(created.id)) {
              const newIds = [...ids, created.id];
              await supabase
                .from("products")
                .update({ category_ids: newIds })
                .eq("id", prod.value);
            }
          }
        }
      }
      showToast("Category created successfully!", "success");
      // Clear the draft from localStorage
      localStorage.removeItem("categoryDraft");
      router.push("/admin/categories");
    } catch (err: any) {
      console.error("Error creating category:", err);
      showToast(err.message || "Failed to create category", "error");
    } finally {
      setSubmitting(false);
    }
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
          <h2 className="text-3xl font-semibold">Add New Category</h2>
          <p className="text-[#475467]">Create a new product category.</p>
        </div>
      </div>
      {error && (
        <div className="p-2 mb-4 text-red-700 bg-red-100 border border-red-200 rounded">
          {error}
        </div>
      )}{" "}
      {/* Display submission errors */}
      <form id="category-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for the new category.
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
                Upload an image that represents this category.
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
                  required
                />
              </div>
              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500 mb-2">Image Preview:</p>
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
                Upload a banner image for this category (optional).
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
                {bannerPreview && (
                  <div className="mt-2 relative w-full h-32 border rounded-md overflow-hidden">
                    <Image
                      src={bannerPreview}
                      alt="Banner Preview"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Products in this Category */}
          <Card>
            <CardHeader>
              <CardTitle>Add Products to Category (optional)</CardTitle>
              <CardDescription>
                Select products to associate with this category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReactSelect
                isMulti
                options={allProducts.map((p) => ({
                  value: p.id,
                  label: p.name,
                  image:
                    Array.isArray(p.images) && p.images[0]
                      ? p.images[0]
                      : undefined,
                }))}
                value={selectedProducts}
                onChange={(newValue) => setSelectedProducts(newValue as any[])}
                placeholder="Select products..."
                formatOptionLabel={(option) => (
                  <div className="flex items-center gap-2">
                    {option.image && (
                      <Image
                        src={option.image}
                        alt={option.label}
                        width={24}
                        height={24}
                        className="w-6 h-6 rounded object-cover"
                      />
                    )}
                    <span>{option.label}</span>
                  </div>
                )}
                classNamePrefix="react-select"
              />
            </CardContent>
          </Card>

          {/* Tags and Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help with categorization and search.
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
                Add key points or features of this category.
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

        {/* Form Actions */}
        <CardFooter className="flex justify-end gap-2 mt-6 p-0">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/categories")}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
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
              onClick={() => console.log("Create Category button clicked")}
            >
              {submitting ? "Creating..." : "Create Category"}
            </Button>
          </div>
        </CardFooter>
      </form>
      {/* Add a preview modal component */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent
          className="max-w-2xl"
          style={{ height: "90vh", maxHeight: "90vh", overflowY: "auto" }}
        >
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
            <div>
              <h3 className="font-semibold mb-2">Products in this Category:</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedProducts.map((prod: any) => {
                  const product = allProducts.find((p) => p.id === prod.value);
                  return product ? (
                    <div
                      key={product.id}
                      className="flex items-center gap-2 border p-2 rounded"
                    >
                      {product.images && product.images[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                      )}
                      <span>{product.name}</span>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Back to Edit
            </Button>
            {/* Publish button triggers the existing handleSubmit */}
            <Button type="submit" form="category-form" disabled={submitting}>
              Publish
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
