"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
} from "@components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { ArrowDown, Plus } from "lucide-react";
import { Separator } from "@components/ui/separator";
import ReactSelect from "react-select";
import CreatableSelect from "react-select/creatable";
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
import { OptionSchema, option as OptionType } from "src/lib/validator";
import { formatNaira, showToast, toSlug } from "src/lib/utils";
import Edit from "@components/icons/edit.svg";
import Trash from "@components/icons/trash.svg";
import { Label } from "@components/ui/label";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@components/ui/breadcrumb";
import Image from "next/image";
import { updateProductAction, uploadProductImageAction } from "./actions";
import { supabase } from "src/lib/supabaseClient";

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
      .max(5000, "Description cannot exceed 5000 characters"),
    price: z
      .number({
        invalid_type_error: "Price must be a number",
        required_error: "Price is required",
      })
      .min(50, "Price must be at least ₦50")
      .optional(),
    list_price: z
      .number({
        invalid_type_error: "List price must be a number",
        required_error: "List price is required",
      })
      .min(0, "List price must be at least ₦0")
      .optional(),
    stockStatus: z
      .enum(["In Stock", "Out of Stock"], {
        required_error: "Stock status is required",
      })
      .optional(),
    selectedCategories: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .min(1, "At least one category is required"),
    tags: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
    relatedProducts: z
      .array(z.object({ label: z.string(), value: z.string() }))
      .optional(),
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
    customizations: z
      .array(
        z.object({
          id: z.string(),
          label: z.string().min(1, "Label is required"),
          type: z.enum(["select", "toggle"]),
          options: z
            .array(
              z.object({
                value: z.string().min(1, "Value is required"),
                label: z.string().min(1, "Label is required"),
                default: z.boolean().default(false),
              })
            )
            .min(1, "At least one option is required"),
        })
      )
      .optional(),
    is_published: z.boolean().default(false),
    in_season: z.boolean().nullable().default(null),
  })
  .superRefine((data, ctx) => {
    if (data.variation === "Yes") {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message:
            "At least one option is required when product has variations",
        });
      } else {
        data.options.forEach((option, index) => {
          if (!option.name || option.name.trim() === "") {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["options", index, "name"],
              message: "Option name is required",
            });
          }
          if (!option.price || option.price < 50) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["options", index, "price"],
              message: "Option price must be at least ₦50",
            });
          }
          if (!option.stockStatus) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ["options", index, "stockStatus"],
              message: "Option stock status is required",
            });
          }
        });
      }
    } else {
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

type EditProductClientProps = {
  product: any;
  allCategories: any[];
  allProducts: any[];
  relatedProducts: any[];
  allTags: string[];
};

// Client-side image upload utility using Server Action
async function uploadProductImageClient(
  file: File,
  bucketName = "product-images"
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucketName", bucketName);
  return await uploadProductImageAction(formData);
}

export default function EditProductClient({
  product,
  allCategories,
  allProducts,
  relatedProducts,
  allTags,
}: EditProductClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  const [optionIndexToDelete, setOptionIndexToDelete] = useState<number | null>(
    null
  );
  const [optionModalLoading, setOptionModalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editOptionIndex, setEditOptionIndex] = useState<number | null>(null);
  const [editOptionData, setEditOptionData] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<any>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);

  // Flatten react-hook-form errors for easier debugging/visibility
  const collectErrorMessages = (errors: any, path: string[] = []): string[] => {
    if (!errors) return [];
    const messages: string[] = [];
    Object.entries(errors).forEach(([key, value]) => {
      const currentPath = [...path, key];
      if (value && typeof value === "object") {
        if ("message" in value && (value as any).message) {
          messages.push(`${currentPath.join(".")}: ${(value as any).message}`);
        }
        // Dive deeper into nested structures (e.g., options.0.price)
        [
          (value as any).types,
          (value as any).ref,
          (value as any)._errors,
          (value as any).root,
          (value as any).inner,
          value,
        ]
          .filter(Boolean)
          .forEach((candidate: any) => {
            if (candidate && typeof candidate === "object") {
              messages.push(...collectErrorMessages(candidate, currentPath));
            }
          });
      }
    });
    return Array.from(new Set(messages)).filter(Boolean);
  };

  // 1. Add a single source of truth for images
  // 1. Add a single source of truth for images, normalized to strings
  const [images, setImages] = useState<string[]>(() => {
    const rawImages = Array.isArray(product.images) ? product.images : [];
    return rawImages.map((img: any) => {
      if (typeof img === "string") {
        try {
          const parsed = JSON.parse(img);
          if (parsed?.url) return parsed.url;
        } catch {}
        return img;
      }
      if (img && typeof img === "object" && img.url) return img.url;
      return null;
    }).filter((url: any): url is string => typeof url === "string" && url.length > 0);
  });


  // 2. Update useEffect to sync previews with images state (fix linter error)
  useEffect(() => {
    setImagePreviews(images.map((img) => (typeof img === "string" ? img : "")));
  }, [images]);

  // Prepare initial categories for react-select
  const productCategoryIds = Array.isArray(product.category_ids)
    ? product.category_ids
    : [];
  const initialCategories = allCategories
    .filter((cat) => productCategoryIds.includes(cat.id))
    .map((cat) => ({ label: cat.title, value: cat.id }));

  // Prepare initial related products for react-select
  const initialRelatedProducts = relatedProducts.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  // Normalize option.image so Zod doesn't fail on non-URL strings
  const normalizeOptionForForm = (opt: any) => {
    if (!opt || typeof opt !== "object") return opt;
    let image: any = opt.image;
    if (typeof image === "string") {
      // Allow any string (e.g. relative paths)
      // No strict URL validation
    } else if (image && typeof image === "object" && "url" in image) {
      image = (image as any).url;
    } else if (!(image instanceof File)) {
      image = null;
    }
    return {
      ...opt,
      image,
      list_price:
        opt.list_price === "" || Number.isNaN(opt.list_price)
          ? undefined
          : opt.list_price,
    };
  };

  // Setup form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: product.name || "",
      description: product.description || "",
      // Coerce numeric fields coming from Supabase (which may be strings)
      price:
        product.price !== null && product.price !== undefined
          ? Number(product.price)
          : undefined,
      list_price:
        product.list_price !== null && product.list_price !== undefined
          ? Number(product.list_price)
          : undefined,
      // Normalize stock status (DB may store snake_case)
      stockStatus:
        product.stock_status === "In Stock" ||
        product.stock_status === "Out of Stock"
          ? product.stock_status
          : product.stock_status === "in_stock"
            ? "In Stock"
            : product.stock_status === "out_of_stock"
              ? "Out of Stock"
              : "In Stock",
      selectedCategories: initialCategories,
      tags: (product.tags || []).map((tag: string) => ({
        label: tag,
        value: tag,
      })),
      relatedProducts: initialRelatedProducts,
      variation: (() => {
        if (Array.isArray(product.options) && product.options.length > 0) {
          // Old format: options is array of variations
          return "Yes";
        } else if (
          product.options &&
          typeof product.options === "object" &&
          product.options.variations?.length > 0
        ) {
          // New format: check if variations exist in object
          return "Yes";
        }
        return "No";
      })(),
      images: [],
      options: (() => {
        if (Array.isArray(product.options)) {
          // Old format: options is array of variations
          return product.options.map(normalizeOptionForForm);
        } else if (product.options && typeof product.options === "object") {
          // New format: options is object with variations and customizations
          return (product.options.variations || []).map(normalizeOptionForForm);
        }
        return [];
      })(),
      customizations: (() => {
        if (
          product.options &&
          typeof product.options === "object" &&
          !Array.isArray(product.options)
        ) {
          // New format: extract customizations from object
          return product.options.customizations || [];
        }
        return [];
      })(),
      is_published: product.is_published || false,
      in_season:
        typeof product.in_season === "boolean" ? product.in_season : null,
    },
  });

  // Set image previews from existing product images
  // Removed conflicting useEffect here.


  // Add after form definition
  const watchedVariation = form.watch("variation");
  useEffect(() => {
    if (watchedVariation === "Yes") {
      form.setValue("price", undefined);
    }
  }, [form, watchedVariation]);

  // --- Handlers ---
  // 3. Update handleImageUpload to add new uploads to images state
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setImageUploadLoading(true);
      try {
        const uploadPromises = Array.from(files).map(async (file) => {
          const url = await uploadProductImageClient(file);
          return url;
        });
        const uploadedUrls = await Promise.all(uploadPromises);
        setImages((prev) => [...prev, ...uploadedUrls]);
        showToast("Images uploaded successfully", "success");
      } catch (error) {
        console.error("Image upload failed:", error);
        showToast("Failed to upload images", "error");
      } finally {
        setImageUploadLoading(false);
      }
    }
    event.target.value = "";
  };

  // 4. Update handleRemoveImage to remove from images state
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // --- Option Management ---
  // Add Option
  const handleOptionSubmit = async (optionData: any) => {
    setOptionModalLoading(true);
    try {
      let imageUrl = optionData.image;
      if (imageUrl instanceof File) {
        imageUrl = await uploadProductImageClient(imageUrl, "option-images");
      }
      const newOption = {
        ...optionData,
        image: typeof imageUrl === "string" ? imageUrl : null,
      };
      const currentOptions = form.getValues("options") || [];
      form.setValue("options", [...currentOptions, newOption]);
      setIsDialogOpen(false);
      setEditOptionIndex(null);
      setEditOptionData(null);
      setTimeout(() => {
        form.trigger("options");
      }, 0);
      showToast("Option added successfully!", "success");
    } catch (err) {
      showToast("Failed to add option: " + (err as Error).message, "error");
    } finally {
      setOptionModalLoading(false);
    }
  };

  // Edit Option
  const handleOptionEditSubmit = async (optionData: any) => {
    console.log(
      "EditProductClient handleOptionEditSubmit called with:",
      optionData
    );
    setOptionModalLoading(true);
    try {
      let imageUrl = optionData.image;
      console.log(
        "Initial imageUrl:",
        imageUrl,
        "Type:",
        typeof imageUrl,
        "instanceof File:",
        imageUrl instanceof File
      );
      const currentOptions = form.getValues("options") || [];
      if (
        !imageUrl &&
        editOptionIndex !== null &&
        currentOptions[editOptionIndex]
      ) {
        console.log(
          "No new image, using existing image from option:",
          currentOptions[editOptionIndex].image
        );
        imageUrl = currentOptions[editOptionIndex].image;
      }
      if (imageUrl instanceof File) {
        console.log("Uploading File object to storage...");
        imageUrl = await uploadProductImageClient(imageUrl, "option-images");
        console.log("Upload completed, new URL:", imageUrl);
      }
      const updatedOption = {
        ...optionData,
        image: typeof imageUrl === "string" ? imageUrl : null,
      };
      if (editOptionIndex !== null) {
        const updatedOptions = [...currentOptions];
        updatedOptions[editOptionIndex] = updatedOption;
        form.setValue("options", updatedOptions);
        setEditOptionIndex(null);
        setEditOptionData(null);
        setTimeout(() => {
          form.trigger("options");
        }, 0);
        showToast("Option updated successfully!", "success");
      }
    } catch (err) {
      showToast("Failed to update option: " + (err as Error).message, "error");
    } finally {
      setOptionModalLoading(false);
    }
  };

  // Delete Option
  const handleDeleteOptionConfirm = () => {
    if (optionIndexToDelete !== null) {
      const currentOptions = form.getValues("options") || [];
      const updatedOptions = currentOptions.filter(
        (_, index) => index !== optionIndexToDelete
      );
      form.setValue("options", updatedOptions);
      setDeleteOptionDialogOpen(false);
      setOptionIndexToDelete(null);
      setTimeout(() => {
        form.trigger("options");
      }, 0);
      showToast("Option deleted successfully!", "success");
    }
  };

  // 6. Refactor onSubmit to use images state and clean options
  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    setFormErrors(null);
    setErrorDetails([]);
    try {
      // Use images state for current images
      const safeImages = images.filter((img) => typeof img === "string");
      // Clean options (ensure all images are URLs and no empty objects)
      let safeOptions = form.getValues("options") || [];
      safeOptions = await Promise.all(
        safeOptions.map(async (opt: any) => {
          let imageUrl = opt.image;
          if (imageUrl instanceof File) {
            imageUrl = await uploadProductImageClient(
              imageUrl,
              "option-images"
            );
          }
          // Remove empty object images
          if (
            imageUrl &&
            typeof imageUrl === "object" &&
            Object.keys(imageUrl).length === 0
          ) {
            imageUrl = undefined;
          }
          // Make list_price undefined if empty string or NaN
          let list_price =
            opt.list_price === "" || Number.isNaN(opt.list_price)
              ? undefined
              : opt.list_price;
          return {
            ...opt,
            image: typeof imageUrl === "string" ? imageUrl : null,
            list_price,
          };
        })
      );
      // Prepare customizations for storage in options field
      const filteredCustomizations = data.customizations
        ? data.customizations.filter(
            (c) => c.label && c.options?.some((o: any) => o.label && o.value)
          )
        : [];

      // Handle existing options structure
      // If product.options is an array, it contains variations
      // If it's an object, it might already have customizations and/or variations
      let optionsData: any = null;

      if (Array.isArray(product.options)) {
        // Original structure: options is array of variations
        if (filteredCustomizations.length > 0) {
          // If we have customizations, convert to object structure
          optionsData = {
            variations: safeOptions.length > 0 ? safeOptions : product.options,
            customizations: filteredCustomizations,
          };
        } else {
          // No customizations, preserve existing variations or use updated ones
          optionsData = safeOptions.length > 0 ? safeOptions : product.options;
        }
      } else if (product.options && typeof product.options === "object") {
        // Modern structure: options is object with variations and/or customizations
        optionsData = {
          ...(safeOptions.length > 0 ? { variations: safeOptions } : {}),
          ...(filteredCustomizations.length > 0
            ? { customizations: filteredCustomizations }
            : {}),
        };
      } else {
        // No existing options
        if (safeOptions.length > 0 && filteredCustomizations.length > 0) {
          optionsData = {
            variations: safeOptions,
            customizations: filteredCustomizations,
          };
        } else if (safeOptions.length > 0) {
          optionsData = safeOptions; // Keep as array for backward compatibility
        } else if (filteredCustomizations.length > 0) {
          optionsData = { customizations: filteredCustomizations };
        }
      }

      const productData: any = {
        id: product.id,
        name: data.productName,
        description: data.description,
        category_ids: data.selectedCategories.map((c) => c.value),
        tags: data.tags?.map((t) => t.value) || [],
        is_published: data.is_published,
        slug: toSlug(data.productName),
        images: safeImages,
        options: optionsData,
        list_price: data.list_price ?? null,
        in_season: data.in_season,
        related_products: data.relatedProducts?.map((p) => p.value) || [],
      };
      if (data.variation === "No") {
        productData.price = data.price ?? 0;
        productData.stock_status =
          data.stockStatus === "In Stock" ? "in_stock" : "out_of_stock";
      } else {
        productData.price = null;
        // Save stock status for products with variations if set
        productData.stock_status = data.stockStatus
          ? data.stockStatus === "In Stock"
            ? "in_stock"
            : "out_of_stock"
          : null;
      }
      await updateProductAction(product.id, productData);
      showToast("Product updated successfully!", "success");
      // Force refresh to get latest data from DB
      router.refresh();
    } catch (error: any) {
      showToast(error.message || "Failed to update product.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- UI ---
  return (
    <div className="p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              href={`/admin/products${queryString ? `?${queryString}` : ""}`}
            >
              Products
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit Product</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center sm:text-left mt-4">
        Edit Product
      </h1>
      <Separator className="my-5" />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            setFormErrors(errors);
            const messages = collectErrorMessages(errors);
            setErrorDetails(messages);
            console.error("[DEBUG] Form validation errors:", messages, errors);
          })}
          className="p-6 rounded-lg shadow-md bg-white flex flex-col gap-2"
        >
          {/* Show visible error message if there are form errors */}
          {formErrors && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
              <div>
                There are form errors. Please check the fields below and try
                again.
              </div>
              {errorDetails.length > 0 && (
                <ul className="list-disc list-inside mt-2 text-sm">
                  {errorDetails.slice(0, 5).map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                  {errorDetails.length > 5 && (
                    <li>...and more. Scroll to the highlighted fields.</li>
                  )}
                </ul>
              )}
            </div>
          )}
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
                    placeholder="Enter product name"
                    className="col-span-7"
                  />
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
                  <ReactSelect
                    {...field}
                    isMulti
                    options={allCategories.map((cat) => ({
                      label: cat.title,
                      value: cat.id,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    components={animatedComponents}
                    className="col-span-7"
                  />
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Tags */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Tags
                </FormLabel>
                <div className="col-span-7">
                  <FormControl>
                    <CreatableSelect
                      {...field}
                      isMulti
                      options={allTags.map((tag) => ({
                        label: tag,
                        value: tag,
                      }))}
                      value={field.value}
                      onChange={(newValue) => {
                        // Ensure all tags are lowercase
                        const lowercasedTags = newValue.map((tag: any) => ({
                          ...tag,
                          label: tag.label.toLowerCase(),
                          value: tag.value.toLowerCase(),
                        }));
                        field.onChange(lowercasedTags);
                      }}
                      components={animatedComponents}
                      placeholder="Select or create tags..."
                      className="basic-multi-select"
                      classNamePrefix="select"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-500 mt-1">
                    Type and press enter to create new tags. Used for sliders like &quot;New Arrival&quot;, &quot;Best Seller&quot;, &quot;Todays Deal&quot;, &quot;Trending&quot;.
                  </FormDescription>
                </div>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Recipes */}
          <FormField
            control={form.control}
            name="relatedProducts"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Bundles
                </FormLabel>
                <FormControl>
                  <ReactSelect
                    {...field}
                    isMulti
                    options={allProducts.map((p) => ({
                      label: p.name,
                      value: p.id,
                    }))}
                    value={field.value}
                    onChange={field.onChange}
                    components={animatedComponents}
                    className="col-span-7"
                    placeholder="Select bundles..."
                  />
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Product Images */}
          <FormField
            control={form.control}
            name="images"
            render={() => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Image(s)
                </FormLabel>
                <FormControl>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    multiple
                    accept="image/*"
                    id="product-image-upload"
                  />
                </FormControl>
                <div className="col-span-7">
                  <label
                    htmlFor="product-image-upload"
                    className="flex flex-col items-center justify-center size-[156px] border border-dashed rounded-lg cursor-pointer hover:bg-gray-50 bg-[#EBFFF3]"
                  >
                    <div className="text-[#61BB84] flex items-center gap-1 justify-center w-full h-full bg-[#ebfff8] px-3 py-[3px] rounded-[3.66px] font-semibold text-[10px]">
                      <Plus size={10} /> Upload
                    </div>
                  </label>
                  {/* Display existing and new images */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative size-16">
                          <Image
                            src={preview || "/placeholder-product.png"}
                            alt={`Product image ${index}`}
                            width={64}
                            height={64}
                            className="rounded-lg object-cover w-full h-full"
                          />
                          <button
                            type="button"
                            className="absolute top-0 right-0 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow border border-gray-200"
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
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* Variation field */}
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
                          disabled={form.watch("variation") === "Yes"}
                        />
                      </FormControl>
                      <FormMessage className="col-span-7 col-start-3" />
                    </FormItem>
                  )}
                />
                {/* List Price */}
                <FormField
                  control={form.control}
                  name="list_price"
                  render={({ field }) => (
                    <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                      <FormLabel className="text-sm font-medium col-span-2">
                        List Price (₦)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter list price"
                          type="number"
                          value={
                            field.value === undefined ? "" : String(field.value)
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value)
                            )
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
              <FormField
                control={form.control}
                name="options"
                render={() => {
                  const options = form.watch("options") || [];
                  return (
                    <div className="mb-4 grid grid-cols-9">
                      <div className="md:col-span-2"></div>
                      <div className="col-span-9 md:col-span-7">
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
                                      List Price
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
                                          <Image
                                            src={
                                              typeof option.image ===
                                                "string" && option.image
                                                ? option.image
                                                : option.image instanceof File
                                                  ? URL.createObjectURL(
                                                      option.image
                                                    )
                                                  : "/placeholder-product.png"
                                            }
                                            alt={option.name}
                                            width={40}
                                            height={40}
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
                                      {option.list_price !== undefined &&
                                      option.list_price !== null
                                        ? formatNaira(option.list_price)
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-center w-1/4">
                                      {option.stockStatus}
                                    </TableCell>
                                    <TableCell className="text-center flex gap-2 w-full h-full">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditOptionIndex(index);
                                          setEditOptionData(option);
                                        }}
                                      >
                                        <Edit />
                                      </button>
                                      <button
                                        type="button"
                                        className="size-5"
                                        onClick={() => {
                                          setOptionIndexToDelete(index);
                                          setDeleteOptionDialogOpen(true);
                                        }}
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

                        {/* Add Option Modal */}
                        <OptionModal
                          isOpen={isDialogOpen}
                          onClose={() => setIsDialogOpen(false)}
                          onSubmit={handleOptionSubmit}
                          mode="add"
                          initialData={undefined}
                        />

                        {/* Edit Option Modal */}
                        <OptionModal
                          isOpen={editOptionIndex !== null}
                          onClose={() => {
                            setEditOptionIndex(null);
                            setEditOptionData(null);
                          }}
                          onSubmit={handleOptionEditSubmit}
                          mode="edit"
                          initialData={editOptionData || undefined}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </motion.div>

          {/* Global Stock Status (for products with variations) */}
          {form.watch("variation") === "Yes" && (
            <FormField
              control={form.control}
              name="stockStatus"
              render={({ field }) => (
                <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                  <FormLabel className="text-sm font-medium col-span-2">
                    Overall Stock Status
                  </FormLabel>
                  <FormControl>
                    <div className="col-span-7">
                      <ShadSelect
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="w-48 border p-4 rounded-lg">
                          <SelectValue placeholder="Select Stock Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="In Stock">In Stock</SelectItem>
                          <SelectItem value="Out of Stock">
                            Out of Stock
                          </SelectItem>
                        </SelectContent>
                      </ShadSelect>
                      <p className="text-xs text-gray-500 mt-2">
                        This sets the overall product stock status. Individual options have their own stock status above.
                      </p>
                    </div>
                  </FormControl>
                  <FormMessage className="col-span-7 col-start-3" />
                </FormItem>
              )}
            />
          )}

          {/* Product Customizations */}
          <FormField
            control={form.control}
            name="customizations"
            render={({ field }) => {
              const customizations = field.value || [];

              const updateCustomization = (custIndex: number, updates: any) => {
                const newCustomizations = [...customizations];
                newCustomizations[custIndex] = {
                  ...newCustomizations[custIndex],
                  ...updates,
                };
                field.onChange(newCustomizations);
              };

              const updateCustomizationOption = (
                custIndex: number,
                optIndex: number,
                updates: any
              ) => {
                const newCustomizations = [...customizations];
                const newOptions = [
                  ...(newCustomizations[custIndex].options || []),
                ];
                newOptions[optIndex] = { ...newOptions[optIndex], ...updates };
                newCustomizations[custIndex] = {
                  ...newCustomizations[custIndex],
                  options: newOptions,
                };
                field.onChange(newCustomizations);
              };

              const addCustomizationOption = (custIndex: number) => {
                const newCustomizations = [...customizations];
                const newOptions = [
                  ...(newCustomizations[custIndex].options || []),
                ];
                newOptions.push({ value: "", label: "", default: false });
                newCustomizations[custIndex] = {
                  ...newCustomizations[custIndex],
                  options: newOptions,
                };
                field.onChange(newCustomizations);
              };

              const removeCustomizationOption = (
                custIndex: number,
                optIndex: number
              ) => {
                const newCustomizations = [...customizations];
                const newOptions = (
                  newCustomizations[custIndex].options || []
                ).filter((_: any, idx: number) => idx !== optIndex);
                newCustomizations[custIndex] = {
                  ...newCustomizations[custIndex],
                  options: newOptions,
                };
                field.onChange(newCustomizations);
              };

              const addCustomization = () => {
                const newCustomizations = [...customizations];
                newCustomizations.push({
                  id: `custom_${Date.now()}`,
                  label: "",
                  type: "select",
                  options: [{ value: "", label: "", default: true }],
                });
                field.onChange(newCustomizations);
              };

              const removeCustomization = (custIndex: number) => {
                const newCustomizations = customizations.filter(
                  (_: any, idx: number) => idx !== custIndex
                );
                field.onChange(newCustomizations);
              };

              return (
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                  <FormLabel className="text-sm font-medium col-span-2">
                    Product Customizations
                  </FormLabel>
                  <div className="col-span-7 space-y-4">
                    <FormDescription className="text-sm text-gray-600">
                      Configure customization options that customers can choose
                      from (e.g., &quot;Chopped&quot;, &quot;Diced&quot;,
                      &quot;Whole&quot;)
                    </FormDescription>

                    {customizations.map(
                      (customization: any, custIndex: number) => (
                        <div
                          key={custIndex}
                          className="border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-3">
                              <div>
                                <Label className="text-sm font-medium">
                                  Label
                                </Label>
                                <Input
                                  value={customization.label || ""}
                                  onChange={(e) =>
                                    updateCustomization(custIndex, {
                                      label: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Protein Preparation"
                                  className="mt-1"
                                />
                              </div>

                              <div>
                                <Label className="text-sm font-medium">
                                  Type
                                </Label>
                                <ShadSelect
                                  value={customization.type || "select"}
                                  onValueChange={(value) =>
                                    updateCustomization(custIndex, {
                                      type: value,
                                    })
                                  }
                                >
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="select">
                                      Dropdown
                                    </SelectItem>
                                    <SelectItem value="toggle">
                                      Toggle
                                    </SelectItem>
                                  </SelectContent>
                                </ShadSelect>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">
                                  Options
                                </Label>
                                <div className="mt-1 space-y-2">
                                  {(customization.options || []).map(
                                    (option: any, optIndex: number) => (
                                      <div
                                        key={optIndex}
                                        className="flex items-center gap-2"
                                      >
                                        <Input
                                          value={option.label || ""}
                                          onChange={(e) =>
                                            updateCustomizationOption(
                                              custIndex,
                                              optIndex,
                                              { label: e.target.value }
                                            )
                                          }
                                          placeholder="e.g., Chopped"
                                          className="flex-1"
                                        />
                                        <Input
                                          value={option.value || ""}
                                          onChange={(e) =>
                                            updateCustomizationOption(
                                              custIndex,
                                              optIndex,
                                              { value: e.target.value }
                                            )
                                          }
                                          placeholder="chopped"
                                          className="flex-1"
                                        />
                                        <div className="flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={option.default || false}
                                            onChange={(e) => {
                                              // Clear other defaults first
                                              const newCustomizations = [
                                                ...customizations,
                                              ];
                                              newCustomizations[
                                                custIndex
                                              ].options.forEach(
                                                (opt: any, idx: number) => {
                                                  if (idx !== optIndex)
                                                    opt.default = false;
                                                }
                                              );
                                              updateCustomizationOption(
                                                custIndex,
                                                optIndex,
                                                { default: e.target.checked }
                                              );
                                            }}
                                            className="mr-1"
                                          />
                                          <Label className="text-xs">
                                            Default
                                          </Label>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            removeCustomizationOption(
                                              custIndex,
                                              optIndex
                                            )
                                          }
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <Trash size={14} />
                                        </Button>
                                      </div>
                                    )
                                  )}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      addCustomizationOption(custIndex)
                                    }
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Plus size={14} className="mr-1" />
                                    Add Option
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomization(custIndex)}
                              className="text-red-500 hover:text-red-700 ml-2"
                            >
                              <Trash size={16} />
                            </Button>
                          </div>
                        </div>
                      )
                    )}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCustomization}
                      className="w-full border-dashed"
                    >
                      <Plus size={14} className="mr-1" />
                      Add Customization
                    </Button>
                  </div>
                </div>
              );
            }}
          />

          {/* Published Toggle */}
          <FormField
            control={form.control}
            name="is_published"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  Publish Status
                </FormLabel>
                <FormControl>
                  <div className="col-span-7 flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          field.value ? "bg-[#1B6013]" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                            field.value ? "translate-x-5" : "translate-x-0.5"
                          } mt-0.5`}
                        />
                      </div>
                    </label>
                    <span className="text-sm text-gray-700">
                      {field.value ? "Published" : "Draft"}
                    </span>
                  </div>
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          {/* In Season Toggle */}
          <FormField
            control={form.control}
            name="in_season"
            render={({ field }) => (
              <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                <FormLabel className="text-sm font-medium col-span-2">
                  In Season
                </FormLabel>
                <FormControl>
                  <div className="col-span-7 flex items-center space-x-4">
                    <ShadSelect
                      onValueChange={(value) => {
                        if (value === "true") field.onChange(true);
                        else if (value === "false") field.onChange(false);
                        else field.onChange(null);
                      }}
                      value={
                        field.value === true
                          ? "true"
                          : field.value === false
                            ? "false"
                            : "null"
                      }
                    >
                      <SelectTrigger className="w-48 border p-4 rounded-lg">
                        <SelectValue placeholder="Select Season Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Not Set</SelectItem>
                        <SelectItem value="true">In Season</SelectItem>
                        <SelectItem value="false">Out of Season</SelectItem>
                      </SelectContent>
                    </ShadSelect>
                    <span className="text-sm text-gray-500">
                      {field.value === true
                        ? "✓ Product is in season"
                        : field.value === false
                          ? "✗ Product is out of season"
                          : "— Season status not set"}
                    </span>
                  </div>
                </FormControl>
                <FormMessage className="col-span-7 col-start-3" />
              </FormItem>
            )}
          />

          <Separator className="-mx-[24px]" />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() =>
                router.push(
                  `/admin/products${queryString ? `?${queryString}` : ""}`
                )
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#1B6013] text-white"
              disabled={isSubmitting || optionModalLoading}
            >
              {isSubmitting ? (
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
              ) : optionModalLoading ? (
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
                  Processing Option...
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
