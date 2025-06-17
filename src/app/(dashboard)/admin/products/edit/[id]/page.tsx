"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Textarea } from "@components/ui/textarea";
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { ArrowDown, Plus } from "lucide-react";
import { Separator } from "@components/ui/separator";
import ReactSelect, { MultiValue } from "react-select";
import makeAnimated from "react-select/animated";
import { motion } from "framer-motion";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@components/ui/form";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import OptionModal from "@components/admin/optionsModal";
import {
  OptionSchema,
  option as OptionType,
  Product,
  ProductUpdateSchema,
} from "src/lib/validator";
import Image from "next/image";
import { formatNaira, showToast, toSlug } from "src/lib/utils";
import Edit from "@components/icons/edit.svg";
import Trash from "@components/icons/trash.svg";
import { useToast } from "src/hooks/useToast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { createClient } from "src/utils/supabase/client";
import { Skeleton } from "@components/ui/skeleton";
import { Label } from "@components/ui/label";

const supabase = createClient();
const animatedComponents = makeAnimated();

const formSchema = z
  .object({
    productName: z
      .string()
      .min(1, "Product name is required")
      .max(100, "Product name cannot exceed 100 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(500, "Description cannot exceed 500 characters"),
    price: z
      .number({
        invalid_type_error: "Price must be a number",
        required_error: "Price is required",
      })
      .min(50, "Price must be at least ₦50")
      .optional(),
    stockStatus: z
      .enum(["In Stock", "Out of Stock"], {
        required_error: "Stock status is required",
      })
      .optional(),
    selectedCategories: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .min(1, "At least one category is required"),
    variation: z.enum(["Yes", "No"], {
      required_error: "Variation is required",
    }),
    images: z
      .array(z.instanceof(File))
      .refine(
        (files) => files.every((file) => file.size <= 5 * 1024 * 1024),
        "Each image must be less than 5MB"
      )
      .refine(
        (files) => files.every((file) => file.type.startsWith("image/")),
        "Only image files are allowed"
      )
      .optional(),
    options: z.array(OptionSchema).optional(),
    is_published: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    // If variation is "Yes", options are required
    if (data.options && data.options.length > 0) {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message:
            "At least one option is required when product has variations",
        });
      }
    } else {
      // If variation is "No", price, stockStatus, and images should be required
      if (!data.price) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["price"],
          message: "Price is required when product has no variations",
        });
      }
      if (!data.stockStatus) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stockStatus"],
          message: "Stock status is required when product has no variations",
        });
      }
    }
  });

type ProductFormValues = z.infer<typeof formSchema>;

async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

async function getAllCategories() {
  const { data, error } = await supabase.from("categories").select("*");
  if (error) throw error;
  return data;
}

async function updateProduct(id: string, product: any) {
  const { data, error } = await supabase
    .from("products")
    .update(product)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data?.[0];
}

async function uploadProductImage(
  file: File,
  bucketName: string = "product-images"
) {
  const fileExt = file.name.split(".").pop();
  const filePath = `${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file);

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

async function deleteImageFromStorage(
  url: string,
  bucketName: string = "product-images"
) {
  try {
    // Extract the file path from the URL
    const urlParts = url.split("/");
    const filePath = urlParts.slice(urlParts.indexOf(bucketName) + 1).join("/");

    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
}

export default function EditProduct() {
  const params = useParams();
  const productId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  // const {showToast } = useToast()

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  const [optionIndexToDelete, setOptionIndexToDelete] = useState<number | null>(
    null
  );

  // Fetch product data
  const {
    data: product,
    isLoading: loadingProduct,
    error: productError,
  } = useQuery({
    queryKey: ["product", productId],
    queryFn: () => getProductById(productId),
    enabled: !!productId,
  });

  // Fetch all categories
  const {
    data: allCategories,
    isLoading: loadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories"],
    queryFn: getAllCategories,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: 0,
      stockStatus: "In Stock",
      selectedCategories: [],
      variation: "No",
      images: [],
      options: [],
      is_published: false,
    },
  });

  // Set form values when product and categories data is loaded
  useEffect(() => {
    // console.log("useEffect: product data loaded", product);
    // console.log("useEffect: categories data loaded", allCategories);

    if (product && allCategories) {
      const productCategoryIds = Array.isArray(product.category_ids)
        ? product.category_ids
        : [];

      const initialCategories = allCategories
        .filter((cat) => productCategoryIds.includes(cat.id))
        .map((cat) => ({ label: cat.title, value: cat.id }));

      const productOptions = Array.isArray(product.options)
        ? product.options.map((opt: any) => ({
            ...opt,
            stockStatus: opt.stock_status || "In Stock",
          }))
        : [];

      form.reset({
        productName: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        stockStatus:
          product.stock_status === "In Stock" ||
          product.stock_status === "Out of Stock"
            ? product.stock_status
            : "In Stock",
        selectedCategories: initialCategories,
        variation: productOptions.length > 0 ? "Yes" : "No",
        images: [],
        options: productOptions,
        is_published: product.is_published,
      });

      setOptions(productOptions);

      // console.log(
      //   "useEffect: Fetched product images raw data:",
      //   product.images
      // );

      // Set image previews from existing product images
      if (product.images && Array.isArray(product.images)) {
        const previews = product.images
          .map((img, index) => {
            // Log the raw data for each image in the array
            console.log(`useEffect: Processing image ${index}:`, img);

            if (typeof img === "string") {
              try {
                // Attempt to parse the JSON string
                const parsedImg = JSON.parse(img);
                // If successful and is an object with a url, return that URL
                if (
                  parsedImg &&
                  typeof parsedImg === "object" &&
                  typeof parsedImg.url === "string"
                ) {
                  // console.log(
                  //   `useEffect: Image ${index}: Parsed JSON with URL`,
                  //   parsedImg.url
                  // );
                  return parsedImg.url;
                } else {
                  console.warn(
                    `useEffect: Image ${index}: String was JSON but had unexpected structure`,
                    parsedImg
                  );
                }
              } catch (e) {
                // If parsing fails, assume it's a raw URL string
                console.log(
                  `useEffect: Image ${index}: Failed to parse string as JSON, treating as raw URL`,
                  img
                );
              }
              // If it's a string (either original or failed parse), return it if it looks like a URL
              if (
                img.startsWith("http://") ||
                img.startsWith("https://") ||
                img.startsWith("/")
              ) {
                console.log(
                  `useEffect: Image ${index}: Treating string as raw URL`,
                  img
                );
                return img;
              } else {
                console.warn(
                  `useEffect: Image ${index}: String did not look like a URL`,
                  img
                );
                return null; // Skip if it doesn't look like a URL
              }
            } else if (
              typeof img === "object" &&
              img !== null &&
              "url" in img &&
              typeof (img as any).url === "string"
            ) {
              // Handle case where it's already a valid object { url: '...' }
              console.log(
                `useEffect: Image ${index}: Found valid image object`,
                (img as any).url
              );
              return (img as any).url;
            }

            console.warn(
              `useEffect: Image ${index}: Had unexpected type/format`,
              img
            );
            return null; // Skip other unexpected formats (e.g., null, undefined)
          })
          .filter((url): url is string => url !== null);

        console.log("useEffect: Final image previews array:", previews);
        setImagePreviews(previews);
      } else {
        console.log("useEffect: No product images found or not an array.");
        setImagePreviews([]); // Clear previews if no images or not an array
      }
    }
    console.log("useEffect finished.");
  }, [product, allCategories, form]);

  // Mutation for updating product
  const updateProductMutation = useMutation({
    mutationFn: async (formData: ProductFormValues) => {
      // First delete any images marked for deletion
      if (imagesToDelete.length > 0) {
        await Promise.all(
          imagesToDelete.map((url) => deleteImageFromStorage(url))
        );
      }

      // Upload new product images
      let uploadedImageUrls: string[] = [];
      if (filesToUpload.length > 0) {
        uploadedImageUrls = await Promise.all(
          filesToUpload.map((file) => uploadProductImage(file))
        );
      }

      // Get original existing images from the product data (exclude those marked for deletion)
      const originalExistingImageUrls = Array.isArray(product?.images)
        ? product.images
            .map((img) => {
              if (typeof img === "string") return img;
              if (
                typeof img === "object" &&
                img !== null &&
                "url" in img &&
                typeof (img as any).url === "string"
              )
                return (img as any).url;
              return null; // Handle unexpected formats
            })
            .filter(
              (url): url is string =>
                url !== null && !imagesToDelete.includes(url)
            )
        : [];

      // Combine original existing images (not deleted) with newly uploaded images
      const finalProductImages = [
        ...originalExistingImageUrls,
        ...uploadedImageUrls,
      ];

      // Process options (upload new option images if needed)
      const processedOptions = await Promise.all(
        options.map(async (opt) => {
          let imageUrl = opt.image;

          // If the image is a File object (new upload)
          if (opt.image instanceof File) {
            imageUrl = await uploadProductImage(opt.image);
          }

          return {
            ...opt,
            stock_status: opt.stockStatus,
            image: imageUrl,
          };
        })
      );

      // Prepare product data for update
      const productData: any = {
        name: formData.productName,
        description: formData.description,
        category_ids: formData.selectedCategories.map((c) => c.value),
        images: finalProductImages, // Use the corrected final list of images
        is_published: formData.is_published,
        slug: toSlug(formData.productName),
      };

      // Add price and stock status if no variations, and include processed options
      if (formData.variation === "No") {
        productData.price = formData.price;
        productData.stock_status = formData.stockStatus;
        productData.options = [];
      } else {
        productData.price = null;
        productData.stock_status = null;
        productData.options = processedOptions;
      }

      // Log the data being sent before the update
      console.log("Data being sent to updateProduct:", productData);

      return updateProduct(productId, productData);
    },
    onSuccess: () => {
      showToast("Product updated successfully!", "success");
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Reset states after successful upload and save
      setFilesToUpload([]);
      setImagesToDelete([]);
      // imagePreviews will be updated by the useEffect when product query invalidates and refetches
      // router.push(`/admin/products`);
    },
    onError: (error: any) => {
      showToast(error.message || "Failed to update product", "error");
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setFilesToUpload((prev) => [...prev, ...newFiles]);

      // Create previews for the new files
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = imagePreviews[index];

    // If it's an existing image (not a newly uploaded one), mark for deletion
    if (
      !filesToUpload.some(
        (_, i) => i === index - (imagePreviews.length - filesToUpload.length)
      )
    ) {
      setImagesToDelete((prev) => [...prev, urlToRemove]);
    }

    // Remove from previews
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);

    // Remove from files to upload if it was a new file
    if (index >= imagePreviews.length - filesToUpload.length) {
      const fileIndex = index - (imagePreviews.length - filesToUpload.length);
      const newFiles = [...filesToUpload];
      newFiles.splice(fileIndex, 1);
      setFilesToUpload(newFiles);
    }
  };

  const handleDeleteOptionClick = (index: number) => {
    setOptionIndexToDelete(index);
    setDeleteOptionDialogOpen(true);
  };

  const handleDeleteOptionConfirm = () => {
    if (optionIndexToDelete !== null) {
      const updatedOptions = options.filter(
        (_, index) => index !== optionIndexToDelete
      );
      setOptions(updatedOptions);
      form.setValue("options", updatedOptions);
      showToast("Option deleted successfully!", "success");
      setDeleteOptionDialogOpen(false);
      setOptionIndexToDelete(null);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      await updateProductMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error updating product:", error);
    }
  };

  if (loadingProduct || loadingCategories) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Separator />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-9 gap-4">
              <Skeleton className="h-4 w-1/4 col-span-2" />
              <Skeleton className="h-10 col-span-7" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (productError || categoriesError) {
    return (
      <div className="p-6 text-center text-red-500">
        {productError?.message ||
          categoriesError?.message ||
          "Failed to load data"}
      </div>
    );
  }

  if (!product) {
    return <div className="p-6 text-center">Product not found</div>;
  }

  return (
    <div className="p-6">
      <CustomBreadcrumb />
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center sm:text-left mt-4">
        Edit Product
      </h1>
      <Separator className="my-5" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-6 rounded-lg shadow-md bg-white flex flex-col gap-2"
        >
          {/* Product Name */}
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Product Name
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter the product name"
                    className="col-span-7"
                  />
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Categories */}
          <FormField
            control={form.control}
            name="selectedCategories"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Categories
                </FormLabel>
                <FormControl>
                  {loadingCategories ? (
                    <Skeleton className="h-10 col-span-7" />
                  ) : (
                    <ReactSelect
                      isMulti
                      components={animatedComponents}
                      options={allCategories?.map((cat) => ({
                        label: cat.title,
                        value: cat.id,
                      }))}
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                      className="col-span-7"
                    />
                  )}
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter product description"
                    className="col-span-7"
                  />
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Variations */}
          <FormField
            control={form.control}
            name="variation"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Variations
                </FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex gap-6 mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="Yes" id="variation-yes" />
                      <Label htmlFor="variation-yes">Yes</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="No" id="variation-no" />
                      <Label htmlFor="variation-no">No</Label>
                    </div>
                  </RadioGroup>
                  <FormDescription>
                    Does this product have different variations like size or
                    color?
                  </FormDescription>
                  <FormMessage />
                </FormControl>
              </FormItem>
            )}
          />

          <motion.div
            key={form.watch("variation")}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {form.watch("variation") === "No" ? (
              <>
                {/* Image Upload */}
                <FormField
                  control={form.control}
                  name="images"
                  render={() => (
                    <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                      <FormLabel className="text-sm font-medium col-span-2">
                        Image(s)
                      </FormLabel>
                      <FormControl>
                        <div className="col-span-7">
                          <label className="flex flex-col items-center justify-center size-[156px] border border-dashed rounded-lg cursor-pointer hover:bg-gray-50 bg-[#EBFFF3]">
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleImageUpload}
                              multiple
                              accept="image/*"
                            />
                            <div className="text-[#61BB84] flex items-center gap-1 justify-center w-full h-full bg-[#ebfff8] px-3 py-[3px] rounded-[3.66px] font-semibold text-[10px]">
                              <Plus size={10} /> Upload
                            </div>
                          </label>
                          {/* Display existing and new images */}
                          {imagePreviews.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative size-16">
                                  <img
                                    src={preview}
                                    alt={`Product image ${index}`}
                                    className="rounded-lg object-cover w-full h-full"
                                  />
                                  <button
                                    type="button"
                                    className="absolute top-0 right-0 bg-white rounded-full p-1 shadow"
                                    onClick={() => handleRemoveImage(index)}
                                    aria-label="Remove image"
                                  >
                                    <span className="text-red-500 font-bold text-xs">
                                      X
                                    </span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage className="col-span-7 col-start-3" />
                    </FormItem>
                  )}
                />

                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                      <FormLabel className="text-sm font-medium col-span-2">
                        Price (₦)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter price"
                          type="number"
                          value={field.value === 0 ? "" : String(field.value)}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                          className="col-span-7"
                        />
                      </FormControl>
                      <FormMessage className="col-span-7 col-start-3" />
                    </FormItem>
                  )}
                />

                {/* Stock Status */}
                <FormField
                  control={form.control}
                  name="stockStatus"
                  render={({ field }) => (
                    <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                      <FormLabel className="text-sm font-medium col-span-2">
                        Stock Status
                      </FormLabel>
                      <FormControl>
                        <ShadSelect
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <SelectTrigger className="col-span-7 border p-4 rounded-lg">
                            <SelectValue placeholder="Select Stock Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="In Stock">In Stock</SelectItem>
                            <SelectItem value="Out of Stock">
                              Out of Stock
                            </SelectItem>
                          </SelectContent>
                        </ShadSelect>
                      </FormControl>
                      <FormMessage className="col-span-7 col-start-3" />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <div className="mb-4 grid grid-cols-9">
                <div className="col-span-2"></div>
                <div className="col-span-7">
                  {options.length > 0 && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-100 w-full">
                            <TableHead className="text-center w-1/2 !px-6">
                              <div className="flex items-center gap-1">
                                Option
                                <ArrowDown size={16} strokeWidth={0.7} />
                              </div>
                            </TableHead>
                            <TableHead className="text-center w-1/4">
                              <div className="flex items-center justify-center gap-1">
                                Price
                                <ArrowDown size={16} strokeWidth={0.7} />
                              </div>
                            </TableHead>
                            <TableHead className="text-center w-1/4">
                              <div className="flex items-center justify-center gap-1">
                                Stock Status
                                <ArrowDown size={16} strokeWidth={0.7} />
                              </div>
                            </TableHead>
                            <TableHead className="text-center w-1/4"></TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {options.map((option, index) => (
                            <TableRow key={index}>
                              <TableCell className="flex items-center justify-start gap-3 w-1/2 !px-6">
                                <div className="size-[40px] relative">
                                  {option.image && (
                                    <img
                                      src={
                                        typeof option.image === "string"
                                          ? option.image
                                          : URL.createObjectURL(option.image)
                                      }
                                      alt={option.name}
                                      className="rounded-[12px] object-cover w-full h-full"
                                    />
                                  )}
                                </div>
                                <span>{option.name}</span>
                              </TableCell>
                              <TableCell className="text-center w-1/4">
                                {formatNaira(option.price)}
                              </TableCell>
                              <TableCell className="text-center w-1/4">
                                {option.stockStatus}
                              </TableCell>
                              <TableCell className="text-center flex gap-2 w-full h-full">
                                <button type="button">
                                  <Edit />
                                </button>
                                <button
                                  type="button"
                                  className="size-5"
                                  onClick={() => handleDeleteOptionClick(index)}
                                >
                                  <Trash />
                                </button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  <button
                    type="button"
                    className="bg-[#E8F3E7] px-4 py-[10px] flex items-center gap-2 text-sm whitespace-nowrap rounded-[8px]"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus size={14} />
                    Add New Option
                  </button>
                  <OptionModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={(data) => {
                      const newOptions = [...options, data];
                      setOptions(newOptions);
                      form.setValue("options", newOptions);
                      setIsDialogOpen(false);
                      showToast("Option added successfully!", "success");
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          <Separator className="-mx-[24px]" />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={updateProductMutation.isPending}
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#1B6013] text-white"
              disabled={updateProductMutation.isPending}
            >
              {updateProductMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>{" "}
                  Updating...
                </span>
              ) : (
                "Update Product"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Delete Option Dialog */}
      <Dialog
        open={deleteOptionDialogOpen}
        onOpenChange={setDeleteOptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Option</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this option? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOptionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOptionConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
