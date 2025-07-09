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
import { addCategory, uploadImage } from "../../../../../lib/api";
import { useToast } from "../../../../../hooks/useToast";
import supabaseAdmin from "@/utils/supabase/admin";
import ReactSelect from "react-select";
import { createClient } from "src/utils/supabase/client";

const supabase = createClient();

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
      const fileExt = imageFile.name.split(".").pop();
      const filePath = `${Date.now()}.${fileExt}`;
      await uploadImage(imageFile, "category-images");
      const { data: publicUrlData } = supabaseAdmin.storage
        .from("category-images")
        .getPublicUrl(filePath);
      thumbnail = publicUrlData.publicUrl
        ? { url: publicUrlData.publicUrl, public_id: filePath }
        : null;
      if (bannerFile) {
        const bannerExt = bannerFile.name.split(".").pop();
        const bannerPath = `banner_${Date.now()}.${bannerExt}`;
        await uploadImage(bannerFile, "category-images");
        const { data: bannerUrlData } = supabaseAdmin.storage
          .from("category-images")
          .getPublicUrl(bannerPath);
        banner_url = bannerUrlData.publicUrl || null;
      }
    } catch (err: any) {
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
      const created = await addCategory(newCategoryData);
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
      router.push("/admin/categories");
    } catch (err: any) {
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
      <form onSubmit={handleSubmit}>
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
          <Button
            type="submit"
            className="bg-[#1B6013] text-white"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create Category"}
          </Button>
        </CardFooter>
      </form>
    </div>
  );
}
