"use client";
export const dynamic = "force-dynamic";

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
  DialogHeader,
  DialogTitle,
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
import { OptionSchema, option as OptionType } from "src/lib/validator";
import Image from "next/image";
import { formatNaira, toSlug } from "src/lib/utils";
import Trash from "@components/icons/trash.svg";
import Edit from "@components/icons/edit.svg";
import { useToast } from "src/hooks/useToast";
import { getAllCategories } from "src/lib/actions/product.actions";
import { Label } from "@/components/ui/label";
import { supabase } from "src/lib/supabaseClient";
import { addProductAction, uploadProductImageAction } from "./actions";
import { useRouter, useSearchParams } from "next/navigation";
const animatedComponents = makeAnimated();

// Server-side image upload using server action
async function uploadProductImage(file: File, bucketName = "product-images") {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bucketName', bucketName);
  return await uploadProductImageAction(formData);
}

const productSchema = z
  .object({
    productName: z
      .string()
      .min(1, "Product name is required")
      .max(100, "Product name cannot exceed 100 characters"),
    description: z
      .string()
      .min(1, "Description is required")
      .max(1000, "Description cannot exceed 1000 characters"),
    price: z
      .string()
      .regex(/^\d+$/, "Price must be a number")
      .refine((val) => parseInt(val) >= 50, {
        message: "Price must be at least ₦50",
      })
      .optional(), // Make optional
    list_price: z
      .string()
      .regex(/^\d*\.?\d*$/, "List price must be a number")
      .refine((val) => val === "" || parseFloat(val) >= 0, {
        message: "List price must be at least ₦0",
      })
      .optional(),
    stockStatus: z
      .enum(["In Stock", "Out of Stock"], {
        required_error: "Stock status is required",
      })
      .optional(), // Make optional
    selectedCategories: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
        })
      )
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
      .optional(), // Make optional
    options: z.array(OptionSchema).optional(),
    is_published: z.boolean().default(false),
    in_season: z.boolean().nullable().default(null),
  })
  .superRefine((data, ctx) => {
    // If variation is "Yes", options are required
    if (data.variation === "Yes") {
      if (!data.options || data.options.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "At least one option is required when variation is 'Yes'",
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
      const validImages = data.images?.filter(img => img instanceof File && img.size > 0) || [];
      if (validImages.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["images"],
          message:
            "At least one image is required when product has no variations",
        });
      }
    }
  });

type ProductFormValues = z.infer<typeof productSchema>;

export default function AddProduct() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<any>(null);
  const [editOptionIndex, setEditOptionIndex] = useState<number | null>(null);
  const [editOptionData, setEditOptionData] = useState<any>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const allCategories = await getAllCategories();
        setCategories(
          (allCategories || []).map((cat: any) => ({
            label: cat.title,
            value: cat.id,
          }))
        );
      } catch (error) {
        console.error("Error loading categories:", error);
        showToast("Failed to load categories", "error");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [showToast]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: "",
      list_price: "",
      stockStatus: "In Stock",
      selectedCategories: [],
      variation: "No",
      images: [],
      options: [], // Initialize options
      is_published: false,
      in_season: null,
    },
  });

  useEffect(() => {
    const savedDraft = localStorage.getItem("productDraft");
    if (savedDraft) {
      const draftData = JSON.parse(savedDraft);
      // Convert product base64 images back to File objects
      const productFiles =
        draftData.images
          ?.map((base64String: string) => {
            if (!base64String) return null;
            const dataUrl = base64String.includes("data:")
              ? base64String
              : `data:image/png;base64,${base64String}`;
            const response = fetch(dataUrl);
            return response
              .then((res) => res.blob())
              .then(
                (blob) =>
                  new File([blob], "product-image.png", { type: "image/png" })
              );
          })
          .filter(Boolean) || [];
      // Convert option base64 images back to File objects
      const optionFiles =
        draftData.options?.map((option: OptionType) => {
          if (typeof option.image === "string") {
            const dataUrl = option.image.includes("data:")
              ? option.image
              : `data:image/png;base64,${option.image}`;
            return {
              ...option,
              image: dataUrl,
            };
          }
          return option;
        }) || [];
      Promise.all(productFiles).then((files) => {
        form.setValue("productName", draftData.productName);
        form.setValue("description", draftData.description);
        form.setValue("price", draftData.price);
        form.setValue("stockStatus", draftData.stockStatus);
        // Map selectedCategories to {label, value} using loaded categories
        form.setValue(
          "selectedCategories",
          (draftData.selectedCategories || []).map((catId: string) => {
            const found = categories.find((c) => c.value === catId);
            return found || { label: catId, value: catId };
          })
        );
        form.setValue("variation", draftData.variation);
        form.setValue("images", files);
        form.setValue("options", optionFiles); // Set options from draft
        form.setValue("is_published", draftData.is_published);
        form.setValue("in_season", draftData.in_season);
      });
    }
  }, [form, categories]);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const images = form.watch("images");
    if (images && images.length > 0) {
      const validFiles = images.filter(file => file instanceof File && file.size > 0);
      if (validFiles.length > 0) {
        const previews = validFiles.map((file) => URL.createObjectURL(file));
        setImagePreviews(previews);
        return () => previews.forEach(URL.revokeObjectURL);
      }
    }
    setImagePreviews([]);
  }, [form]);

  const handleSaveDraft = async (data: ProductFormValues) => {
    // Convert product images to base64
    const productImagePromises =
      data.images?.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            // Get the full base64 string including data URL prefix
            const base64String = reader.result as string;
            resolve(base64String);
          };
          reader.readAsDataURL(file);
        });
      }) || [];

    const optionImagePromises =
      data.variation === "Yes"
        ? data.options?.map((option) => {
            return new Promise<string>((resolve) => {
              if (option.image instanceof File) {
                const reader = new FileReader();
                reader.onload = () => {
                  const base64String = reader.result as string;
                  resolve(base64String);
                };
                reader.readAsDataURL(option.image);
              } else {
                resolve(typeof option.image === "string" ? option.image : "");
              }
            });
          }) || []
        : [];

    const [base64ProductImages, base64OptionImages] = await Promise.all([
      Promise.all(productImagePromises),
      Promise.all(optionImagePromises),
    ]);

    const productState = {
      options:
        data.variation === "Yes"
          ? data.options?.map((option, index) => ({
              ...option,
              image: base64OptionImages[index],
            })) || []
          : [],
      productName: data.productName,
      description: data.description,
      price: data.price,
      stockStatus: data.stockStatus,
      selectedCategories: data.selectedCategories.map(
        (category) => category.value
      ),
      images: base64ProductImages,
      variation: data.variation,
      is_published: data.is_published,
      in_season: data.in_season,
    };

    localStorage.setItem("productDraft", JSON.stringify(productState));
    showToast("Product draft saved successfully!", "success");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const validFiles = Array.from(files).filter(
        (file) => file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024
      );
      console.log("Valid files selected:", validFiles);
      form.setValue("images", validFiles);
    } else {
      form.setValue("images", []);
    }
  };
  const onSubmit = async (data: ProductFormValues) => {
    console.log("Form submitted with data:", data);
    setLoading(true);

    // 1. Upload product images to storage (client-side)
    let uploadedImageUrls: string[] = [];
    const validImages = data.images?.filter(img => img instanceof File && img.size > 0) || [];
    console.log("Valid images for upload:", validImages);
    
    if (validImages.length > 0) {
      try {
        const uploadPromises = validImages.map((imageFile) =>
          uploadProductImage(imageFile, "product-images")
        );
        uploadedImageUrls = await Promise.all(uploadPromises);
        console.log("Uploaded image URLs:", uploadedImageUrls);
      } catch (err: any) {
        console.error("Image upload error:", err);
        showToast(err.message || "Failed to upload product images", "error");
        setLoading(false);
        return;
      }
    }

    // 2. Handle options/variations: upload option images to storage (client-side)
    let processedOptions: OptionType[] = [];
    if (data.variation === "Yes" && data.options && data.options.length > 0) {
      processedOptions = await Promise.all(
        data.options.map(async (opt) => {
          let imageUrl = opt.image;
          if (opt.image instanceof File) {
            try {
              // Use the existing product-images bucket for option images as well
              imageUrl = await uploadProductImage(opt.image, "product-images");
            } catch (err: any) {
              showToast(
                err.message || "Failed to upload option image",
                "error"
              );
              setLoading(false);
              throw err;
            }
          }
          return {
            ...opt,
            image: typeof imageUrl === "string" ? imageUrl : null,
          };
        })
      );
    }

    // 3. Prepare product data for DB
    const hasVariations = processedOptions.length > 0;
    const productData = {
      name: data.productName,
      slug: toSlug(data.productName),
      description: data.description,
      price: hasVariations ? null : parseFloat(data.price || "0"),
      list_price: data.list_price ? parseFloat(data.list_price) : null,
      stock_status: hasVariations
        ? null
        : data.stockStatus === "In Stock"
          ? "in_stock"
          : "out_of_stock",
      images: uploadedImageUrls,
      is_published: data.is_published,
      category_ids: data.selectedCategories.map((cat) => cat.value),
      options: hasVariations ? processedOptions : [],
      in_season: data.in_season,
    };

    console.log("Product data to be sent:", productData);

    try {
      const result = await addProductAction(productData);
      console.log("Product created successfully:", result);
      showToast("Product created successfully!", "success");
      form.reset();
      setImagePreviews([]);
      localStorage.removeItem("productDraft");
      // Redirect to product list after success
      const queryString = searchParams.toString();
      router.push(`/admin/products${queryString ? `?${queryString}` : ""}`);
    } catch (err: any) {
      console.error("Error creating product:", err);
      showToast(err.message || "Failed to create product", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handler for confirming duplicate add
  const handleConfirmDuplicate = async () => {
    if (!pendingProduct) return;
    setLoading(true);
    try {
      await addProductAction(pendingProduct);
      showToast("Product added successfully!", "success");
      localStorage.removeItem("productDraft");
      form.reset();
      setImagePreviews([]);
      setDuplicateDialogOpen(false);
      setPendingProduct(null);
    } catch (err: any) {
      showToast(err.message || "Failed to add product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSubmit = async (optionData: any) => {
    try {
      let imageUrl = optionData.image;
      
      // Handle image upload if it's a File
      if (imageUrl instanceof File) {
        imageUrl = await uploadProductImage(imageUrl, "option-images");
      }
      
      const newOption = {
        ...optionData,
        image: typeof imageUrl === "string" ? imageUrl : null,
      };
      
      const current = form.watch("options") || [];
      form.setValue("options", [...current, newOption], {
        shouldValidate: true,
      });
      setIsDialogOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to add option", "error");
    }
  };

  const handleOptionEditSubmit = async (optionData: any) => {
    try {
      let imageUrl = optionData.image;
      const currentOptions = form.getValues("options") || [];
      
      // If no new image provided, keep the existing image
      if (!imageUrl && editOptionIndex !== null && currentOptions[editOptionIndex]) {
        imageUrl = currentOptions[editOptionIndex].image;
      }
      
      // Handle image upload if it's a File
      if (imageUrl instanceof File) {
        imageUrl = await uploadProductImage(imageUrl, "option-images");
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
      }
    } catch (err: any) {
      showToast(err.message || "Failed to update option", "error");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center sm:text-left">
        Add New Product
      </h1>
      <Separator className="my-5" />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.log("Form validation errors:", errors);
            showToast("Please fix the form errors before submitting", "error");
          })}
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
                    isMulti
                    components={animatedComponents}
                    options={categories}
                    value={form.watch("selectedCategories")}
                    isLoading={loadingCategories}
                    onChange={(newValue) =>
                      form.setValue("selectedCategories", [...newValue])
                    }
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

          {/* Variations - FIXED: Moved FormDescription outside FormControl */}
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
                    value={field.value}
                    className="flex gap-6 mt-1 col-span-7"
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
                <FormMessage className="col-span-7 col-start-3" />
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
                {/* Image Upload  */}
                <FormField
                  control={form.control}
                  name="images"
                  render={({ field }) => (
                    <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                      <FormLabel className="text-sm font-medium col-span-2">
                        Image(s)
                      </FormLabel>
                      <div className="col-span-7">
                        <FormControl>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleImageUpload}
                            multiple
                            id="image-upload"
                          />
                        </FormControl>
                        <label
                          htmlFor="image-upload"
                          className="flex flex-col items-center justify-center size-[156px] border border-dashed rounded-lg cursor-pointer hover:bg-gray-50 bg-[#EBFFF3]"
                        >
                          <div className="text-[#61BB84] flex items-center gap-1 justify-center w-full h-full bg-[#ebfff8] px-3 py-[3px] rounded-[3.66px] font-semibold text-[10px]">
                            <Plus size={10} /> Upload
                          </div>
                        </label>
                        {imagePreviews.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {imagePreviews.map((preview, index) => (
                              <div key={index} className="relative size-16">
                                <Image
                                  src={preview}
                                  alt={`Preview ${index}`}
                                  fill
                                  className="rounded-lg object-cover"
                                />
                                <button
                                  type="button"
                                  className="absolute top-0 right-0 bg-white rounded-full py-[2px] px-2 shadow"
                                  onClick={() => {
                                    const images = form.getValues("images");
                                    const arr = Array.isArray(images)
                                      ? images
                                      : [];
                                    arr.splice(index, 1);
                                    form.setValue("images", arr);
                                  }}
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
                        {field.value && field.value.length > 0 && (
                          <p className="mt-2 text-sm text-green-600">
                            {field.value.length} file(s) selected
                          </p>
                        )}
                      </div>
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
                          className="col-span-7"
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

                {/* In Season Select */}
                <FormField
                  control={form.control}
                  name="in_season"
                  render={({ field }) => (
                    <FormItem className="mb-4 grid grid-cols-1 sm:grid-cols-9 gap-4">
                      <FormLabel className="text-sm font-medium col-span-2">
                        Seasonality
                      </FormLabel>
                      <FormControl>
                        <select
                          value={
                            field.value === null
                              ? "null"
                              : field.value
                                ? "true"
                                : "false"
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(
                              val === "null" ? null : val === "true"
                            );
                          }}
                          className="col-span-7 border rounded px-2 py-1"
                        >
                          <option value="null">Not Applicable</option>
                          <option value="true">In Season</option>
                          <option value="false">Out of Season</option>
                        </select>
                      </FormControl>
                      <FormMessage className="col-span-7 col-start-3" />
                    </FormItem>
                  )}
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
                            <div className={`w-11 h-6 rounded-full transition-colors ${
                              field.value ? 'bg-[#1B6013]' : 'bg-gray-200'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                                field.value ? 'translate-x-5' : 'translate-x-0.5'
                              } mt-0.5`} />
                            </div>
                          </label>
                          <span className="text-sm text-gray-700">
                            {field.value ? 'Published' : 'Draft'}
                          </span>
                        </div>
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
                  {form.watch("options") &&
                    (form.watch("options")?.length ?? 0) > 0 && (
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
                            {(form.watch("options") ?? []).map(
                              (option, index) => (
                                <TableRow key={index}>
                                  <TableCell className="flex items-center justify-start gap-3 w-1/2 !px-6">
                                    <div className="size-[40px] h relative">
                                      {option.image instanceof File ? (
                                        <Image
                                          src={URL.createObjectURL(
                                            option.image
                                          )}
                                          alt={option.name}
                                          fill
                                          className="rounded-[12px]"
                                        />
                                      ) : (
                                        <Image
                                          src={
                                            typeof option.image === "string" &&
                                            option.image
                                              ? option.image
                                              : "/placeholder-product.png"
                                          }
                                          alt={option.name}
                                          fill
                                          className="rounded-[12px]"
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
                                        const current =
                                          form.watch("options") ?? [];
                                        const updated = current.filter(
                                          (_, i) => i !== index
                                        );
                                        form.setValue("options", updated, {
                                          shouldValidate: true,
                                        });
                                      }}
                                    >
                                      <Trash />
                                    </button>
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  <button
                    className="bg-[#E8F3E7] px-4 py-[10px] flex items-center gap-2 text-sm whitespace-nowrap rounded-[8px]"
                    type="button"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus size={14} /> Add New Option
                  </button>
                  <OptionModal
                    isOpen={isDialogOpen}
                    onClose={() => setIsDialogOpen(false)}
                    onSubmit={handleOptionSubmit}
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
                </div>
              </div>
            )}
          </motion.div>

          <Separator className="-mx-[24px]" />

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-4">
            <Button
              type="button"
              onClick={form.handleSubmit(handleSaveDraft)}
              variant="outline"
              className="w-full sm:w-auto"
            >
              Save Draft
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#1B6013] text-white"
              disabled={loading}
              onClick={() => console.log("Add Product button clicked")}
            >
              {loading ? (
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
                  Adding...
                </span>
              ) : (
                "Add Product"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Duplicate Product Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Already Exists</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            A product with this name already exists. Do you want to add it
            anyway?
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDuplicateDialogOpen(false);
                setPendingProduct(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#1B6013] text-white"
              onClick={handleConfirmDuplicate}
              disabled={loading}
            >
              {loading ? (
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
                  Adding...
                </span>
              ) : (
                "Add Anyway"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
