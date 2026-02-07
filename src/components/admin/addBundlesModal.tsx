"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@components/ui/dialog";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Search, X } from "lucide-react";
import { Checkbox } from "@components/ui/checkbox";
import Option from "@components/icons/option.svg";
import { useQuery } from "@tanstack/react-query";
import { fetchProductsForBundleModal } from "../../queries/products";
import { createClient } from "@utils/supabase/client";
import { Tables, Enums } from "@utils/database.types";

const BundleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  products: z.array(z.string()).min(1, "At least one product is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  stock_status: z.enum(["in_stock", "out_of_stock", "discontinued"], {
    errorMap: () => ({ message: "Invalid stock status" }),
  }),
  published_status: z.enum(["published", "draft", "archived"], {
    errorMap: () => ({ message: "Invalid published status" }),
  }),
  thumbnail_file: z.instanceof(FileList).optional(),
  // Recipe-specific fields
  type: z.enum(["regular", "recipe"]).default("regular"),
  video_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  chef_name: z.string().optional(),
  prep_time: z.coerce.number().min(0).optional(),
  cook_time: z.coerce.number().min(0).optional(),
  servings: z.coerce.number().min(1).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  dietary_tags: z.array(z.string()).optional(),
});

type BundleFormValues = z.infer<typeof BundleSchema>;

interface BundleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (
    data: Omit<BundleFormValues, "thumbnail_file"> & {
      thumbnail_file?: File;
      products: string[];
    }
  ) => Promise<void>;
}

export default function BundleModal({
  isOpen,
  onClose,
  onSubmit,
}: BundleModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BundleFormValues>({
    resolver: zodResolver(BundleSchema),
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [bundleType, setBundleType] = useState<"regular" | "recipe">("regular");
  const [isFetchingYouTube, setIsFetchingYouTube] = useState(false);
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([]);

  const thumbnailFile = watch("thumbnail_file")?.[0];

  const supabase = createClient();
  const {
    data: products,
    isLoading: isProductsLoading,
    error: productsError,
  } = useQuery({
    queryKey: ["products", searchQuery],
    queryFn: () =>
      fetchProductsForBundleModal(supabase, { search: searchQuery }),
    enabled: isOpen,
  });

  const handleFetchYouTubeMetadata = async () => {
    const videoUrl = watch("video_url");
    
    if (!videoUrl) {
      alert("Please enter a YouTube URL first");
      return;
    }

    setIsFetchingYouTube(true);

    try {
      const response = await fetch("/api/youtube/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: videoUrl }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch metadata");
      }

      // Auto-populate fields
      setValue("chef_name", data.metadata.channelTitle);
      setValue("description", data.metadata.description);
      
      // Note: thumbnail will be fetched from YouTube directly using video ID
      alert(`✅ Metadata fetched!\nChef: ${data.metadata.channelTitle}\nVideo: ${data.metadata.title}`);
    } catch (error: any) {
      console.error("YouTube fetch error:", error);
      alert(`❌ ${error.message}`);
    } finally {
      setIsFetchingYouTube(false);
    }
  };

  const handleProductSelect = (productId: string) => {
    const isSelected = selectedProducts.includes(productId);
    const nextSelectedProducts = isSelected
      ? selectedProducts.filter((id) => id !== productId)
      : [...selectedProducts, productId];

    setSelectedProducts(nextSelectedProducts);

    // Update react-hook-form's state for validation
    setValue("products", nextSelectedProducts);
  };

  const submitForm = async (data: BundleFormValues) => {
    console.log("submitForm called with data:", data);
    const formData = {
      name: data.name,
      price: data.price,
      stock_status: data.stock_status,
      published_status: data.published_status,
      products: selectedProducts,
      thumbnail_file: thumbnailFile,
    };
    console.log("Calling onSubmit with formData:", formData);
    if (onSubmit) await onSubmit(formData);
  };

  const displayedProducts =
    products?.filter((product) => selectedProducts.includes(product.id)) || [];

  const combinedProducts = products
    ? [
        ...products.filter((product) => selectedProducts.includes(product.id)),
        ...products.filter(
          (product) =>
            !selectedProducts.includes(product.id) &&
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      ]
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            <Option />
            Add New Bundle
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[calc(90vh-150px)] overflow-y-auto pr-4">
          <form
            onSubmit={handleSubmit((data) => {
              console.log("handleSubmit triggered");
              submitForm(data);
            })}
            className="space-y-3"
          >
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Bundle Name
              </label>
              <Input
                {...register("name")}
                id="name"
                placeholder="Enter bundle name here"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">
                Price
              </label>
              <Input
                {...register("price")}
                id="price"
                type="number"
                step="0.01"
                placeholder="e.g., 10000.00"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="stock_status"
                className="block text-sm font-medium mb-2"
              >
                Stock Status
              </label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    "stock_status",
                    value as Enums<"bundle_stock_status_enum">
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stock status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              {errors.stock_status && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.stock_status.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="published_status"
                className="block text-sm font-medium mb-2"
              >
                Published Status
              </label>
              <Select
                onValueChange={(value) =>
                  setValue(
                    "published_status",
                    value as Enums<"bundle_published_status_enum">
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select published status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              {errors.published_status && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.published_status.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="thumbnail_file"
                className="block text-sm font-medium mb-2"
              >
                Thumbnail Image
              </label>
              <Input
                {...register("thumbnail_file")}
                id="thumbnail_file"
                type="file"
                accept="image/*"
              />
              {errors.thumbnail_file && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.thumbnail_file.message as string}
                </p>
              )}
            </div>

            {/* Bundle Type Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Bundle Type
              </label>
              <Select
                value={bundleType}
                onValueChange={(value: "regular" | "recipe") => {
                  setBundleType(value);
                  setValue("type", value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bundle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular Bundle</SelectItem>
                  <SelectItem value="recipe">Recipe Bundle</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipe-specific fields (only show when type is "recipe") */}
            {bundleType === "recipe" && (
              <>
                <div className="border-t pt-4 mt-2">
                  <h3 className="text-sm font-semibold mb-3 text-[#1B6013]">
                    Recipe Details
                  </h3>

                  {/* YouTube URL with Fetch Button */}
                  <div className="mb-3">
                    <label htmlFor="video_url" className="block text-sm font-medium mb-2">
                      YouTube Video URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        {...register("video_url")}
                        id="video_url"
                        placeholder="https://youtube.com/watch?v=..."
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleFetchYouTubeMetadata}
                        disabled={isFetchingYouTube}
                        className="bg-[#F0800F] hover:bg-[#F0800F]/90"
                      >
                        {isFetchingYouTube ? "Fetching..." : "Auto-Fill"}
                      </Button>
                    </div>
                    {errors.video_url && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.video_url.message}
                      </p>
                    )}
                  </div>

                  {/* Chef Name */}
                  <div className="mb-3">
                    <label htmlFor="chef_name" className="block text-sm font-medium mb-2">
                      Chef/Channel Name
                    </label>
                    <Input
                      {...register("chef_name")}
                      id="chef_name"
                      placeholder="Auto-filled from YouTube or enter manually"
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      id="description"
                      rows={3}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                      placeholder="Auto-filled from YouTube or enter manually"
                    />
                  </div>

                  {/* Time and Servings Row */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label htmlFor="prep_time" className="block text-sm font-medium mb-2">
                        Prep Time (min)
                      </label>
                      <Input
                        {...register("prep_time")}
                        id="prep_time"
                        type="number"
                        placeholder="10"
                      />
                    </div>
                    <div>
                      <label htmlFor="cook_time" className="block text-sm font-medium mb-2">
                        Cook Time (min)
                      </label>
                      <Input
                        {...register("cook_time")}
                        id="cook_time"
                        type="number"
                        placeholder="15"
                      />
                    </div>
                    <div>
                      <label htmlFor="servings" className="block text-sm font-medium mb-2">
                        Servings
                      </label>
                      <Input
                        {...register("servings")}
                        id="servings"
                        type="number"
                        placeholder="4"
                      />
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">
                      Difficulty
                    </label>
                    <Select
                      onValueChange={(value: "easy" | "medium" | "hard") =>
                        setValue("difficulty", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dietary Tags */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium mb-2">
                      Dietary Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["Vegan", "Vegetarian", "Gluten-Free", "Dairy-Free", "Keto", "Paleo", "Low-Carb", "High-Protein"].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            const newTags = selectedDietaryTags.includes(tag)
                              ? selectedDietaryTags.filter((t) => t !== tag)
                              : [...selectedDietaryTags, tag];
                            setSelectedDietaryTags(newTags);
                            setValue("dietary_tags", newTags);
                          }}
                          className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                            selectedDietaryTags.includes(tag)
                              ? "bg-[#1B6013] text-white border-[#1B6013]"
                              : "bg-white text-gray-700 border-gray-300 hover:border-[#1B6013]"
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="search"
                className="block text-sm font-medium mb-2"
              >
                Search Products
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <Input
                  id="search"
                  placeholder="Search products"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-[300px] overflow-y-auto flex flex-col gap-5 py-3">
              {isProductsLoading ? (
                <div>Loading products...</div>
              ) : productsError ? (
                <div>Error loading products: {productsError.message}</div>
              ) : combinedProducts && combinedProducts.length > 0 ? (
                combinedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex justify-between items-center p-"
                  >
                    <div className="flex gap-3 items-center">
                      <Checkbox
                        className="!rounded !size-[16px] !border-[#D0D5DD]"
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => handleProductSelect(product.id)}
                      />
                      <p className="font-medium">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-sm ">
                        ₦{product.price?.toFixed(2) || "0.00"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div>No products found.</div>
              )}
            </div>

            {errors.products && (
              <p className="text-red-500 text-sm mt-1">
                {errors.products.message}
              </p>
            )}

            <div className="flex w-full items-center justify-between space-x-2">
              {selectedProducts.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    {selectedProducts.length} product(s) selected
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex w-full items-center justify-between space-x-2 mt-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className=" px-10"
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className=" bg-[#1B6013] px-12"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
