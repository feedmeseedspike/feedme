"use client";

import { useRouter } from "next/navigation";
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
import { useToast } from "src/hooks/useToast";
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
    // console.log("[DEBUG] superRefine validation - data:", data);
    // console.log("[DEBUG] superRefine validation - variation:", data.variation);
    // console.log("[DEBUG] superRefine validation - options:", data.options);

    if (data.variation === "Yes") {
      if (!data.options || data.options.length === 0) {
        // console.log("[DEBUG] Validation failed: No options provided");
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message:
            "At least one option is required when product has variations",
        });
      } else {
        // console.log("[DEBUG] Validating options:", data.options);
        // Validate each option individually
        data.options.forEach((option, index) => {
          // console.log(`[DEBUG] Validating option ${index}:`, option);
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
};

export default function EditProductClient({
  product,
  allCategories,
}: EditProductClientProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
  const [deleteOptionDialogOpen, setDeleteOptionDialogOpen] = useState(false);
  const [optionIndexToDelete, setOptionIndexToDelete] = useState<number | null>(
    null
  );
  const { showToast } = useToast();
  const [optionModalLoading, setOptionModalLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug product data
  // console.log("[DEBUG] Product data received:", product);
  // console.log("[DEBUG] Product options:", product.options);
  // console.log("[DEBUG] Product options type:", typeof product.options);
  // console.log(
  //   "[DEBUG] Product options isArray:",
  //   Array.isArray(product.options)
  // );

  // Prepare initial categories for react-select
  const productCategoryIds = Array.isArray(product.category_ids)
    ? product.category_ids
    : [];
  const initialCategories = allCategories
    .filter((cat) => productCategoryIds.includes(cat.id))
    .map((cat) => ({ label: cat.title, value: cat.id }));

  // Setup form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: product.name || "",
      description: product.description || "",
      price: product.price || 0,
      stockStatus:
        product.stock_status === "In Stock" ||
        product.stock_status === "Out of Stock"
          ? product.stock_status
          : "In Stock",
      selectedCategories: initialCategories,
      variation:
        Array.isArray(product.options) && product.options.length > 0
          ? "Yes"
          : "No",
      images: [],
      options: Array.isArray(product.options) ? product.options : [],
      is_published: product.is_published,
    },
  });

  // Debug form state
  const formState = form.watch();
  // console.log("[DEBUG] Form state:", formState);
  // console.log("[DEBUG] Form errors:", form.formState.errors);
  // console.log(
  //   "[DEBUG] Form errors details:",
  //   JSON.stringify(form.formState.errors, null, 2)
  // );
  // console.log("[DEBUG] Form is valid:", form.formState.isValid);
  // console.log("[DEBUG] Form is dirty:", form.formState.isDirty);

  // Set image previews from existing product images
  useEffect(() => {
    if (product.images && Array.isArray(product.images)) {
      const previews = product.images
        .map((img: any) => {
          if (typeof img === "string") {
            try {
              const parsedImg = JSON.parse(img);
              if (
                parsedImg &&
                typeof parsedImg === "object" &&
                typeof parsedImg.url === "string"
              ) {
                return parsedImg.url;
              }
            } catch (e) {}
            if (
              img.startsWith("http://") ||
              img.startsWith("https://") ||
              img.startsWith("/")
            ) {
              return img;
            }
            return null;
          } else if (
            typeof img === "object" &&
            img !== null &&
            "url" in img &&
            typeof (img as any).url === "string"
          ) {
            return (img as any).url;
          }
          return null;
        })
        .filter((url: any): url is string => url !== null);
      setImagePreviews(previews);
    } else {
      setImagePreviews([]);
    }
  }, [product.images]);

  // --- Handlers ---
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setFilesToUpload((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };
  const handleRemoveImage = (index: number) => {
    const urlToRemove = imagePreviews[index];
    if (
      !filesToUpload.some(
        (_, i) => i === index - (imagePreviews.length - filesToUpload.length)
      )
    ) {
      setImagesToDelete((prev) => [...prev, urlToRemove]);
    }
    const newPreviews = [...imagePreviews];
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
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
      const currentOptions = form.watch("options") || [];
      const updatedOptions = currentOptions.filter(
        (_, index) => index !== optionIndexToDelete
      );
      form.setValue("options", updatedOptions, { shouldValidate: true });
      showToast("Option deleted successfully!", "success");
      setDeleteOptionDialogOpen(false);
      setOptionIndexToDelete(null);
    }
  };
  const onSubmit = async (data: ProductFormValues) => {
    // console.log("[DEBUG] ===== ONSUBMIT FUNCTION CALLED =====");
    // console.log("[DEBUG] onSubmit called with data:", data);
    // console.log("[DEBUG] data.options:", data.options);
    // console.log("[DEBUG] data.variation:", data.variation);
    // console.log("[DEBUG] Form values:", form.getValues());
    // console.log("[DEBUG] Form errors:", form.formState.errors);
    // console.log("[DEBUG] Form is valid:", form.formState.isValid);
    // console.log("[DEBUG] About to call updateProductAction");

    setIsSubmitting(true);

    // Prepare the product data - let the server action handle all processing
    const productData: any = {
      name: data.productName,
      description: data.description,
      category_ids: data.selectedCategories.map((c) => c.value),
      is_published: data.is_published,
      slug: toSlug(data.productName),
    };

    if (data.variation === "No") {
      productData.price = data.price ?? 0;
      productData.stock_status =
        data.stockStatus === "In Stock" ? "in_stock" : "out_of_stock";
      productData.options = [];
    } else {
      productData.price = null;
      productData.stock_status = null;
      // Pass options as-is to the server action
      productData.options = data.options || [];
    }

    // Always include id for update
    productData.id = product.id;

    // console.log(
    //   "[DEBUG] About to call updateProduct with:",
    //   product.id,
    //   productData
    // );

    try {
      // console.log("[DEBUG] Calling updateProductAction...");
      // const response = await updateProductAction(product.id, productData);
      // console.log(
      //   "[DEBUG] Mutation success, server returned:",
      //   JSON.stringify(response, null, 2)
      // );
      showToast("Product updated successfully!", "success");
      router.push("/admin/products");
      setFilesToUpload([]);
      setImagesToDelete([]);
    } catch (error: any) {
      console.error("Mutation error:", error);
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
            <BreadcrumbLink href="/admin/products">Products</BreadcrumbLink>
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
          onSubmit={(e) => {
            // console.log("[DEBUG] ===== FORM ONSUBMIT EVENT =====");
            // Prevent form submission if option modal is open
            if (isDialogOpen) {
              // console.log(
              //   "[DEBUG] Form submission blocked - option modal is open"
              // );
              e.preventDefault();
              return;
            }

            // console.log("[DEBUG] Form onSubmit event triggered");
            // console.log("[DEBUG] Form event:", e);
            // console.log("[DEBUG] Form state at submit:", form.getValues());
            // console.log(
            //   "[DEBUG] Form errors at submit:",
            //   form.formState.errors
            // );
            // console.log(
            //   "[DEBUG] Form is valid at submit:",
            //   form.formState.isValid
            // );

            const result = form.handleSubmit(onSubmit)(e);
            // console.log("[DEBUG] Form handleSubmit result:", result);
          }}
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
                    placeholder="Enter product name"
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
          {/* Product Images - moved above variation */}
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
          {/* Variation field follows here */}
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
                                      {option.stockStatus}
                                    </TableCell>
                                    <TableCell className="text-center flex gap-2 w-full h-full">
                                      <button type="button">
                                        <Edit />
                                      </button>
                                      <button
                                        type="button"
                                        className="size-5"
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
                          onSubmit={async (data) => {
                            // console.log(
                            //   "[DEBUG] OptionModal onSubmit called with data:",
                            //   data
                            // );
                            setOptionModalLoading(true);
                            try {
                              // Don't upload the image here - let the main mutation handle it
                              const newOption = { ...data };
                              // console.log(
                              //   "[DEBUG] New option to add:",
                              //   newOption
                              // );
                              const currentOptions =
                                form.watch("options") || [];
                              // console.log(
                              //   "[DEBUG] Current options before adding:",
                              //   currentOptions
                              // );

                              // If this is the first option, switch variation to "Yes"
                              if (currentOptions.length === 0) {
                                // console.log(
                                //   "[DEBUG] First option added, switching variation to Yes"
                                // );
                                form.setValue("variation", "Yes", {
                                  shouldValidate: true,
                                });
                              }

                              const updatedOptions = [
                                ...currentOptions,
                                newOption,
                              ];
                              // console.log(
                              //   "[DEBUG] Updated options after adding:",
                              //   updatedOptions
                              // );
                              form.setValue("options", updatedOptions, {
                                shouldValidate: true,
                              });

                              // Wait for form state to update
                              await new Promise((resolve) =>
                                setTimeout(resolve, 200)
                              );

                              // console.log(
                              //   "[DEBUG] Options after add:",
                              //   form.getValues("options")
                              // );
                              // console.log(
                              //   "[DEBUG] Variation after add:",
                              //   form.getValues("variation")
                              // );
                              // console.log(
                              //   "[DEBUG] Form is valid after add:",
                              //   form.formState.isValid
                              // );

                              // Close the modal FIRST
                              setIsDialogOpen(false);
                              // console.log(
                              //   "[DEBUG] Modal closed, isDialogOpen set to false"
                              // );

                              // Wait a bit more for the modal state to update
                              await new Promise((resolve) =>
                                setTimeout(resolve, 100)
                              );

                              showToast(
                                "Option added successfully!",
                                "success"
                              );
                            } catch (err) {
                              console.error(
                                "[DEBUG] Error adding option:",
                                err
                              );
                              showToast(
                                "Failed to add option: " +
                                  (err as Error).message,
                                "error"
                              );
                            } finally {
                              setOptionModalLoading(false);
                            }
                          }}
                        />
                        <FormMessage />
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </motion.div>
          <Separator className="-mx-[24px]" />
          {/* Buttons */}
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
              onClick={() => router.push("/admin/products")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto bg-[#1B6013] text-white"
              disabled={isSubmitting || optionModalLoading || isDialogOpen}
              onClick={() => {
                // console.log(
                //   "[DEBUG] ===== UPDATE PRODUCT BUTTON CLICKED ====="
                // );
                // console.log("[DEBUG] Button disabled state:", {
                //   isSubmitting,
                //   optionModalLoading,
                //   isDialogOpen,
                // });
              }}
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
