"use client";

import { useParams } from "next/navigation";
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
import { Avatar } from "@components/ui/avatar";
import { Badge } from "@components/ui/badge";
import Image from "next/image";
import { formatNaira, toSlug } from "src/lib/utils";
import Edit from "@components/icons/edit.svg";
import Trash from "@components/icons/trash.svg";
import { toast } from "sonner";
import { useToast } from "src/hooks/useToast";
// @ts-ignore
import {
  getCategories,
  getCategoriesByIds,
  getProductById,
  updateProduct,
  uploadProductImage,
  getAllCategories,
} from "../../../../../../lib/api";
// import { Product }  from "src/lib/validator";

const animatedComponents = makeAnimated();

const productSchema = z.object({
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
    .array(z.string())
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
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProduct() {
  const params = useParams();
  const productId = params.id as string;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [options, setOptions] = useState<OptionType[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [selectedCategoryObjs, setSelectedCategoryObjs] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loading, setLoading] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const { showToast } = useToast();

  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  const [optionIndexToDelete, setOptionIndexToDelete] = useState<number | null>(
    null
  );

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      productName: "",
      description: "",
      price: 0,
      stockStatus: "In Stock",
      selectedCategories: [],
      variation: "No",
      images: [],
    },
  });

  // Fetch all categories for select options
  useEffect(() => {
    setLoadingCategories(true);
    getAllCategories()
      .then((data: any) => {
        setAllCategories(data || []);
        setLoadingCategories(false);
      })
      .catch((err: { message?: string }) => {
        setCategoryError(err.message || "Failed to fetch categories");
        setLoadingCategories(false);
      });
  }, []);

  // Fetch product data if in edit mode
  useEffect(() => {
    if (productId) {
      setIsEditing(true);
      const fetchProduct = async () => {
        try {
          setLoadingProduct(true);
          const product = await getProductById(productId);
          // console.log(product);
          if (product) {
            // Fetch category objects for the product's category_ids
            let categoryObjs: any[] = [];
            if (product.category_ids && product.category_ids.length > 0) {
              try {
                categoryObjs = await getCategoriesByIds(product.category_ids);
                setSelectedCategoryObjs(categoryObjs);
              } catch (e) {
                setCategoryError("Failed to fetch product categories");
                showToast("Failed to fetch product categories", "error");
              }
            }
            form.reset({
              productName: product.name,
              description: product.description,
              price: product.price,
              stockStatus: product.stock_status as "In Stock" | "Out of Stock",
              selectedCategories: product.category_ids || [],
              variation: product.options?.length > 0 ? "Yes" : "No",
              // Do not pre-fill images with File objects from URLs here
              images: [], // Clear images input on load
            });
            // Handle pre-filling options if they exist and have images (URLs)
            setOptions(
              product.options?.map((option: any) => ({
                ...option,
                stockStatus: option.stockStatus || "In Stock", // Default if not set
                image: option.image, // Assume option.image is already a URL string
              })) || []
            );
          } else {
            showToast("Product not found", "error");
          }
        } catch (error: any) {
          console.error("Error fetching product:", error);
          showToast(error.message || "Error fetching product", "error");
        } finally {
          setLoadingProduct(false);
        }
      };
      fetchProduct();
    }
  }, [productId, form, showToast]);

  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const images = form.watch("images");
    if (images && images.length > 0) {
      const previews = images.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }
  }, [form.watch("images")]); // Depend on form.watch("images") instead of form

  const handleSaveDraft = async (data: ProductFormValues) => {
    try {
      const draft = {
        ...data,
        options: options,
        lastSaved: new Date().toISOString(),
      };
      localStorage.setItem("productDraft", JSON.stringify(draft));
      showToast("Draft saved successfully", "success");
    } catch (error) {
      showToast("Error saving draft", "error");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // Consider how to handle existing images vs new uploads here for edit mode
      form.setValue("images", Array.from(files));
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
      showToast("Option deleted successfully!", "success");
      setDeleteOptionDialogOpen(false);
      setOptionIndexToDelete(null);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    console.log("Form Data on Submit:", data);
    if (data.variation === "Yes" && options.length === 0) {
      showToast(
        "At least one option is required when variation is 'Yes'",
        "error"
      );
      return;
    }

    setLoading(true);
    let uploadedImageUrls: { url: string }[] = [];

    // Upload new images only if new files are selected
    if (data.images && data.images.length > 0) {
      try {
        for (const imageFile of data.images) {
          const imageUrl = await uploadProductImage(
            imageFile,
            "product-images"
          );
          uploadedImageUrls.push({ url: imageUrl });
        }
      } catch (err: any) {
        showToast(err.message || "Failed to upload product images", "error");
        setLoading(false);
        return; // Stop submission if image upload fails
      }
    }

    // Combine existing image URLs with newly uploaded ones
    // This requires fetching the existing product first to get current images
    let finalImages = uploadedImageUrls; // Start with newly uploaded

    // If editing, fetch current product to get existing images
    if (isEditing) {
      try {
        const currentProduct = await getProductById(productId); // Fetch again to get current state including existing images
        if (currentProduct && currentProduct.images) {
          // Assuming currentProduct.images is an array of { url: string }
          finalImages = [...currentProduct.images, ...uploadedImageUrls];
        }
      } catch (error) {
        console.error("Error fetching current product for images:", error);
        // Decide how to handle this error - maybe proceed with just new images?
      }
    }

    const productData: any = {
      // Use any for now due to potential schema variations
      name: data.productName,
      description: data.description,
      category_ids: data.selectedCategories, // category_ids should be an array of strings
      price:
        data.variation === "No" &&
        data.price !== undefined &&
        data.price !== null
          ? parseFloat(String(data.price))
          : null,
      stock_status: data.variation === "No" ? data.stockStatus : null,
      images: finalImages, // Use the combined list of image URLs
      options: data.variation === "Yes" ? options : [],
      is_published: true, // Defaulting to true, adjust as needed
      slug: toSlug(data.productName), // Regenerate slug on update (consider if this is desired)
    };

    try {
      if (isEditing) {
        await updateProduct(productId, productData);
        showToast("Product updated successfully!", "success");
      } else {
        // This page is for editing, adding should be on add-new page
        // This else block should ideally not be reached on this page
        showToast("Error: Attempted to add product on edit page.", "error");
      }
      // Optionally clear draft if editing is successful
      localStorage.removeItem("productDraft");
      // router.push("/admin/products"); // Redirect after success
    } catch (err: any) {
      console.error("Submission error:", err);
      showToast(err.message || "Failed to save product", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-center sm:text-left">
        {isEditing ? "Edit Product" : "Add New Product"}
      </h1>
      <Separator className="my-5" />

      {loadingProduct ? (
        <div className="text-center">Loading product...</div>
      ) : (
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
                      <div>Loading categories...</div>
                    ) : categoryError ? (
                      <div className="text-red-500">{categoryError}</div>
                    ) : (
                      <ReactSelect
                        isMulti
                        components={animatedComponents}
                        options={allCategories.map((cat) => ({
                          value: cat.id,
                          label: cat.title,
                          image: cat.thumbnail?.url,
                        }))}
                        value={field.value.map((val: string) => {
                          const cat = allCategories.find((c) => c.id === val);
                          return cat
                            ? { value: cat.id, label: cat.title }
                            : { value: val, label: val };
                        })}
                        onChange={(newValue) => {
                          const values = newValue.map((item) => item.value);
                          field.onChange(values);
                        }}
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
                      value={field.value}
                      className="flex gap-6 mt-1 col-span-7"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="No" id="no" />
                        <label htmlFor="no">No</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Yes" id="yes" />
                        <label htmlFor="yes">Yes</label>
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
              transition={{ duration: 0.2 }}
            >
              {form.watch("variation") === "No" ? (
                <>
                  {/* Image Upload */}
                  <FormField
                    control={form.control}
                    name="images"
                    render={({ field }) => (
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
                              />
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
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Display existing images if editing */}
                            {isEditing && selectedCategoryObjs.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {/* This is a placeholder. You need to fetch and display actual product images here, not category images. */}
                                {/* product.images from the fetched product should be used here */}
                              </div>
                            )}
                            {field.value && field.value.length > 0 && (
                              <p className="mt-2 text-sm text-green-600">
                                {field.value.length} file(s) selected
                              </p>
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
                            className="col-span-7"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                            value={field.value === 0 ? "" : field.value}
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
                            {options.map((option: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell className="flex items-center justify-start gap-3 w-1/2 !px-6">
                                  <div className="size-[40px] h relative">
                                    {option.image instanceof File ? (
                                      <Image
                                        src={URL.createObjectURL(option.image)}
                                        alt={option.name}
                                        fill
                                        className="rounded-[12px]"
                                      />
                                    ) : (
                                      <Image
                                        src={option.image}
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
                                  <p>In Stock</p>
                                  {/* {option.stockStatus} */}
                                </TableCell>
                                <TableCell className="text-center flex gap-2 w-full h-full">
                                  <button
                                    onClick={() =>
                                      handleDeleteOptionClick(index)
                                    }
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
                        setOptions([...options, data]);
                        setIsDialogOpen(false);
                      }}
                    />
                  </div>
                </div>
              )}
            </motion.div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row justify-end mt-6 gap-4">
              <Button
                type="button"
                onClick={form.handleSubmit(handleSaveDraft)}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={loading}
              >
                Save Draft
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto bg-[#1B6013] text-white"
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
                    {isEditing ? "Updating..." : "Adding..."}
                  </span>
                ) : isEditing ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* Option Delete Confirmation Dialog */}
      <Dialog
        open={deleteOptionDialogOpen}
        onOpenChange={setDeleteOptionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Option Deletion</DialogTitle>
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
