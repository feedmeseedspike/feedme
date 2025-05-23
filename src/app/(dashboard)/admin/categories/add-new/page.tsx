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

export default function AddNewCategory() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [keynote, setKeynote] = useState("");
  const [keynotes, setKeynotes] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    
    // console.log({
      title,
      description,
      tags,
      keynotes,
      imageFile
    });
    
    // Simulate successful creation
    alert("Category created successfully!");
    router.push("/admin/categories");
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <Link href="/admin/categories" className="flex items-center text-gray-600 hover:text-gray-900">
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
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleAddTag}
                  variant="outline"
                >
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
                    if (e.key === 'Enter') {
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
                  <Badge key={k} className="px-2 py-1 flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
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
            type="button" 
            variant="outline"
            onClick={() => router.push("/admin/categories")}
          >
            Cancel
          </Button>
          <Button type="submit" className="bg-[#1B6013] text-white">
            Create Category
          </Button>
        </div>
      </form>
    </div>
  );
}
