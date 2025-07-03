"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Badge } from "@components/ui/badge";
import Image from "next/image";
import { Category } from "src/types/category";
import { formatDate } from "src/lib/utils";

interface CategoryDetailsProps {
  category: Category;
}

export default function CategoryDetails({ category }: CategoryDetailsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Title</h3>
            <p className="text-lg">{category.title}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Description</h3>
            <p className="text-base">{category.description}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="text-base">N/A</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
            <p className="text-base">N/A</p>
          </div>
        </CardContent>
      </Card>

      {/* Category Image */}
      <Card>
        <CardHeader>
          <CardTitle>Category Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-48 border rounded-md overflow-hidden">
            <Image
              src={category.thumbnail.url}
              alt={category.title}
              fill
              className="object-contain"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Image ID: {category.thumbnail.public_id}
          </p>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>
            Tags used for categorization and search.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {category.tags && category.tags.length > 0 ? (
              category.tags.map((tag) => (
                <Badge key={tag} className="px-2 py-1">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500">No tags added</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Keynotes */}
      <Card>
        <CardHeader>
          <CardTitle>Keynotes</CardTitle>
          <CardDescription>
            Key points or features of this category.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {category.keynotes && category.keynotes.length > 0 ? (
            <ul className="list-disc pl-5 space-y-1">
              {category.keynotes.map((keynote) => (
                <li key={keynote}>{keynote}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No keynotes added</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
