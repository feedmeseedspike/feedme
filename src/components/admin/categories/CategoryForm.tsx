"use client";

import { useState, useEffect } from "react";
import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Textarea } from "@components/ui/textarea";
import { Badge } from "@components/ui/badge";
import { X } from "lucide-react";
import Image from "next/image";
import { Category } from "src/types/category";

interface CategoryFormProps {
  initialData?: Category;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}

export default function CategoryForm({
  initialData,
  onSubmit,
  isSubmitting,
}: CategoryFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(
    initialData?.description || ""
  );
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [keynote, setKeynote] = useState("");
  const [keynotes, setKeynotes] = useState<string[]>(
    initialData?.keynotes || []
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.thumbnail?.url || null
  );
  const [imageFile, setImageFile] = useState<File | null>(null);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("tags", JSON.stringify(tags));
    formData.append("keynotes", JSON.stringify(keynotes));

    if (imageFile) {
      formData.append("thumbnail", imageFile);
    }

    if (initialData?.id) {
      formData.append("id", initialData.id);
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the basic details for the category.
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
              {initialData ? "Update" : "Upload"} an image that represents this
              category.
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
                required={!initialData}
              />
              {initialData && (
                <p className="text-sm text-gray-500">
                  Leave empty to keep the current image
                </p>
              )}
            </div>
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-2">
                  {initialData ? "Current" : "Preview"} Image:
                </p>
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

        {/* Tags */}
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
      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="submit"
          className="bg-[#1B6013] text-white"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saving..."
            : initialData
              ? "Update Category"
              : "Create Category"}
        </Button>
      </div>
    </form>
  );
}
