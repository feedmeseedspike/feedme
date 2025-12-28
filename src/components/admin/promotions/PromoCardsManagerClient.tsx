"use client";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";
import Image from "next/image";
import {
  Trash2,
  Plus,
  Upload,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Calendar } from "@components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@components/ui/tooltip";
import { format } from "date-fns";
import { useToast } from "../../../hooks/useToast";
import debounce from "lodash/debounce";
import {
  useCreatePromotionMutation,
  useDeletePromotionMutation,
  useUpdatePromotionMutation,
  useAddProductToPromotionMutation,
  useRemoveProductFromPromotionMutation,
  useLinkedProductsForPromotionQuery,
  useProductSearchQuery,
} from "../../../queries/promotions";
import { Database } from "src/utils/database.types";
import { z } from "zod";
import { createClient } from "@utils/supabase/client";
import { v4 as uuidv4 } from "uuid";

// Define Zod schema for the promotion form data
const promotionFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  tag: z
    .string()
    .min(1, { message: "Tag is required." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Tag must be lowercase, alphanumeric, and can include hyphens.",
    }),
  discount_text: z.string().optional().nullable(),
  background_color: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  is_active: z.boolean().default(true).optional(),
  old_price: z
    .preprocess(
      (val) => (val === "" ? null : Number(val)),
      z.nullable(z.number().positive("Must be a positive number.").optional())
    )
    .optional()
    .nullable(),
  new_price: z
    .preprocess(
      (val) => (val === "" ? null : Number(val)),
      z.nullable(z.number().positive("Must be a positive number.").optional())
    )
    .optional()
    .nullable(),
  extra_discount_text: z.string().optional().nullable(),
  countdown_end_time: z
    .preprocess(
      (val) =>
        val === "" || val === null || val === undefined
          ? undefined
          : val instanceof Date
            ? val
            : new Date(val as string),
      z.nullable(z.date().optional())
    )
    .optional()
    .nullable(),
  is_featured_on_homepage: z.boolean().default(true).optional(),
});

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
type PromotionInsert = Database["public"]["Tables"]["promotions"]["Insert"];
type PromotionUpdate = Database["public"]["Tables"]["promotions"]["Update"];
type PromotionFormData = z.infer<typeof promotionFormSchema>;

export default function PromoCardsManagerClient({
  promotions,
}: {
  promotions: Promotion[];
}) {
  const supabase = createClient();
  const {
    mutate: createPromotion,
    isPending: isCreating,
    error: createError,
  } = useCreatePromotionMutation();
  const {
    mutate: deletePromotion,
    isPending: isDeleting,
    error: deleteError,
  } = useDeletePromotionMutation();
  const {
    mutate: updatePromotion,
    isPending: isUpdating,
    error: updateError,
  } = useUpdatePromotionMutation();
  const {
    mutate: addProductToPromotion,
    isPending: isAddingProduct,
    error: addProductError,
  } = useAddProductToPromotionMutation();
  const {
    mutate: removeProductFromPromotion,
    isPending: isRemovingProduct,
    error: removeProductError,
  } = useRemoveProductFromPromotionMutation();
  const { showToast } = useToast();
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null);
  const [newPromoFormData, setNewPromoFormData] = useState<
    Partial<PromotionFormData>
  >({
    title: "",
    tag: "",
    discount_text: undefined,
    background_color: undefined,
    image_url: undefined,
    is_active: true,
    old_price: undefined,
    new_price: undefined,
    extra_discount_text: undefined,
    countdown_end_time: undefined,
    is_featured_on_homepage: true,
  });
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const debouncedProductSearch = debounce(setProductSearchQuery, 500);
  const {
    data: searchResults,
    isLoading: isSearchingProducts,
    error: productSearchError,
  } = useProductSearchQuery(productSearchQuery);
  const {
    data: linkedProducts,
    isLoading: isLoadingLinkedProducts,
    error: linkedProductsError,
    refetch: refetchLinkedProducts,
  } = useLinkedProductsForPromotionQuery(editingPromo?.id);

  // Handler/helper functions for PromoCardsManagerClient
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setNewPromoFormData((prevState: Partial<PromotionFormData>) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const findFormError = (fieldName: keyof PromotionFormData) => {
    return formErrors.find(
      (err: z.ZodIssue) => err.path.join(".") === fieldName
    );
  };

  const openDialog = (promo: Partial<Promotion> | null = null) => {
    setFormErrors([]);
    setSelectedFile(null);
    if (!promo) {
      setNewPromoFormData({
        title: "",
        tag: "",
        discount_text: undefined,
        background_color: undefined,
        image_url: undefined,
        is_active: true,
        old_price: undefined,
        new_price: undefined,
        extra_discount_text: undefined,
        countdown_end_time: undefined,
        is_featured_on_homepage: true,
      });
    } else {
      setNewPromoFormData({
        title: promo.title || "",
        tag: promo.tag || "",
        discount_text: promo.discount_text ?? undefined,
        background_color: promo.background_color ?? undefined,
        image_url: promo.image_url ?? undefined,
        is_active: promo.is_active ?? true,
        old_price: promo.old_price ?? undefined,
        new_price: promo.new_price ?? undefined,
        extra_discount_text: promo.extra_discount_text ?? undefined,
        countdown_end_time: promo.countdown_end_time
          ? new Date(promo.countdown_end_time)
          : undefined,
        is_featured_on_homepage: promo.is_featured_on_homepage ?? true,
      });
    }
    setEditingPromo(promo);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPromo(null);
    setFormErrors([]);
    setNewPromoFormData({
      title: "",
      tag: "",
      discount_text: undefined,
      background_color: undefined,
      image_url: undefined,
      is_active: true,
      old_price: undefined,
      new_price: undefined,
      extra_discount_text: undefined,
      countdown_end_time: undefined,
      is_featured_on_homepage: true,
    });
    setSelectedFile(null);
  };

  const openDeleteDialog = (promo: Promotion) => {
    setPromoToDelete(promo);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setPromoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = async () => {
    if (promoToDelete) {
      const { image_url: imageUrlToDelete } = promoToDelete;
      deletePromotion(promoToDelete.id, {
        onSuccess: async () => {
          if (imageUrlToDelete) {
            const urlParts = imageUrlToDelete.split("/");
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `promotions/${fileName}`;
            const { error: deleteFileError } = await supabase.storage
              .from("promotions")
              .remove([filePath]);
            if (deleteFileError) {
              console.error(
                "Error deleting promotion image from storage:",
                deleteFileError
              );
            }
          }
          showToast("Promotion deleted successfully!", "success");
          closeDeleteDialog();
        },
        onError: (err: any) => {
          console.error("Error deleting promotion:", err);
          showToast(`Failed to delete promotion: ${err.message}`, "error");
          closeDeleteDialog();
        },
      });
    }
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `promotions/${fileName}`;
    const { data, error } = await supabase.storage
      .from("promotions")
      .upload(filePath, file);
    setUploading(false);
    if (error) {
      throw error;
    }
    const { data: publicUrlData } = supabase.storage
      .from("promotions")
      .getPublicUrl(filePath);
    return publicUrlData.publicUrl;
  };

  const handleSave = async () => {
    setFormErrors([]);
    let imageUrl = newPromoFormData.image_url;
    if (selectedFile) {
      try {
        imageUrl = await uploadImage(selectedFile);
      } catch (error: any) {
        showToast(`Image upload failed: ${error.message}`, "error");
        return;
      }
    } else if (!imageUrl && !editingPromo?.id) {
      showToast("Please select an image file for the new promotion.", "error");
      return;
    }
    const validationResult = promotionFormSchema.safeParse({
      ...newPromoFormData,
      image_url: imageUrl,
    });
    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      return;
    }
    const validatedData = validationResult.data;
    const dataToSave: PromotionUpdate = {
      ...validatedData,
      ...(editingPromo?.id && { id: editingPromo.id }),
      image_url: imageUrl,
      countdown_end_time:
        validatedData.countdown_end_time instanceof Date
          ? validatedData.countdown_end_time.toISOString()
          : validatedData.countdown_end_time,
    };
    if (editingPromo?.id) {
      updatePromotion(dataToSave, {
        onSuccess: () => {
          showToast("Promotion updated successfully!", "success");
          closeDialog();
        },
        onError: (err: any) => {
          showToast(`Failed to update promotion: ${err.message}`, "error");
        },
      });
    } else {
      createPromotion(
        {
          ...dataToSave,
          is_featured_on_homepage: true,
        } as PromotionInsert,
        {
          onSuccess: () => {
            showToast("Promotion added successfully!", "success");
            closeDialog();
          },
          onError: (err: any) => {
            showToast("Failed to add promotion: " + err.message, "error");
          },
        }
      );
    }
  };

  const handleAddProduct = (productId: string) => {
    if (!editingPromo?.id) return;
    addProductToPromotion(
      { promotionId: editingPromo.id, productId },
      {
        onSuccess: () => {
          showToast("Product added to promotion!", "success");
          refetchLinkedProducts();
        },
        onError: (err: any) => {
          showToast(`Failed to add product: ${err.message}`, "error");
        },
      }
    );
  };

  const handleRemoveProduct = (productId: string) => {
    if (!editingPromo?.id) return;
    removeProductFromPromotion(
      { promotionId: editingPromo.id, productId },
      {
        onSuccess: () => {
          showToast("Product removed from promotion!", "success");
          refetchLinkedProducts();
        },
        onError: (err: any) => {
          showToast(`Failed to remove product: ${err.message}`, "error");
        },
      }
    );
  };

  // Ensure promotions data is an array
  const promotionList = promotions || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Promotional Cards</h2>
        <Button onClick={() => openDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Promo
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotionList.map((promo) => (
          <Card key={promo.id} className="overflow-hidden">
            <div
              className="h-40 relative"
              style={{ backgroundColor: promo.background_color || "#ffffff" }}
            >
              <Image
                src={promo.image_url || "/product-placeholder.png"}
                alt={promo.title || "Promo image"}
                fill
                className="object-contain"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{promo.title}</h3>
              {promo.discount_text && (
                <p className="text-sm text-gray-500">{promo.discount_text}</p>
              )}
              {promo.old_price !== null && promo.new_price !== null && (
                <p className="text-sm">
                  Price:{" "}
                  <span className="line-through">₦{promo.old_price}</span> ₦
                  {promo.new_price}
                </p>
              )}
              {promo.extra_discount_text && (
                <p className="text-sm">
                  Extra discount: {promo.extra_discount_text}
                </p>
              )}
              {promo.countdown_end_time !== null && (
                <p className="text-sm">Has countdown timer</p>
              )}
              <p className="text-sm">Tag: {promo.tag}</p>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => openDialog(promo)}>
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => openDeleteDialog(promo)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingPromo?.id ? "Edit Promo" : "Add New Promo"}
            </DialogTitle>
            <DialogDescription>
              {editingPromo?.id
                ? "Edit the promotional card."
                : "Fill in the details for the new promotional card."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <TooltipProvider>
              {/* Title */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="title">Title</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The main title of the promotional card.</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="title"
                  name="title"
                  value={newPromoFormData.title}
                  onChange={handleInputChange}
                  required
                />
                {findFormError("title") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("title")?.message}
                  </p>
                )}
              </div>
              {/* Tag */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="tag">Tag (URL path)</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      A unique identifier for the promotion, used in URLs
                      (lowercase, alphanumeric, hyphens only).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="tag"
                  name="tag"
                  value={newPromoFormData.tag}
                  onChange={handleInputChange}
                  required
                />
                {findFormError("tag") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("tag")?.message}
                  </p>
                )}
              </div>
              {/* Discount Text */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="discount_text">Discount Text</Label>
                  </TooltipTrigger>
                  {/* <TooltipContent>
                    <p>
                      Text displaying the discount (e.g., "10% OFF", "BEST
                      DEALS").
                    </p>
                  </TooltipContent> */}
                </Tooltip>
                <Input
                  id="discount_text"
                  name="discount_text"
                  value={newPromoFormData.discount_text ?? ""}
                  onChange={handleInputChange}
                />
              </div>
              {/* Background Color */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="background_color">Background Color</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The background color for the promotional card (e.g., hex
                      code or color name).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="background_color"
                  name="background_color"
                  type="text"
                  value={newPromoFormData.background_color ?? ""}
                  onChange={handleInputChange}
                />
              </div>
              {/* Image Upload */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="image">Promotion Image</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The image for the promotional card.</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    } else {
                      setSelectedFile(null);
                    }
                  }}
                  disabled={isCreating || isUpdating || uploading}
                  accept="image/*"
                />
                {(selectedFile || newPromoFormData.image_url) && (
                  <div className="relative h-32 w-full mt-2 border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {uploading ? (
                      <Loader2 className="size-8 animate-spin text-gray-500" />
                    ) : selectedFile ? (
                      <Image
                        src={URL.createObjectURL(selectedFile)}
                        alt="Selected image preview"
                        fill
                        className="object-contain"
                      />
                    ) : newPromoFormData.image_url ? (
                      <Image
                        src={newPromoFormData.image_url}
                        alt="Existing promotion image"
                        fill
                        className="object-contain"
                      />
                    ) : null}
                  </div>
                )}
              </div>
              {/* Old Price */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="old_price">Old Price</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The original price of the product (optional).</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="old_price"
                  name="old_price"
                  type="number"
                  step="0.01"
                  value={newPromoFormData.old_price ?? ""}
                  onChange={handleInputChange}
                />
                {findFormError("old_price") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("old_price")?.message}
                  </p>
                )}
              </div>
              {/* New Price */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="new_price">New Price</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The discounted price of the product (optional).</p>
                  </TooltipContent>
                </Tooltip>
                <Input
                  id="new_price"
                  name="new_price"
                  type="number"
                  step="0.01"
                  value={newPromoFormData.new_price ?? ""}
                  onChange={handleInputChange}
                />
                {findFormError("new_price") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("new_price")?.message}
                  </p>
                )}
              </div>
              {/* Extra Discount Text */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="extra_discount_text">
                      Extra Discount Text
                    </Label>
                  </TooltipTrigger>
                  {/* <TooltipContent>
                    <p>
                      Additional text for extra discounts (e.g., "64% OFF")
                      (optional).
                    </p>
                  </TooltipContent> */}
                </Tooltip>
                <Input
                  id="extra_discount_text"
                  name="extra_discount_text"
                  value={newPromoFormData.extra_discount_text ?? ""}
                  onChange={handleInputChange}
                />
              </div>
              {/* Countdown End Time */}
              <div className="space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="countdown_end_time">
                      Countdown End Time
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      The date and time when the promotion countdown ends
                      (optional).
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={
                        "w-full justify-start text-left font-normal " +
                        (!newPromoFormData.countdown_end_time &&
                          "text-muted-foreground")
                      }
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPromoFormData.countdown_end_time instanceof Date
                        ? format(newPromoFormData.countdown_end_time, "PPP")
                        : newPromoFormData.countdown_end_time
                          ? String(newPromoFormData.countdown_end_time)
                          : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        newPromoFormData.countdown_end_time instanceof Date
                          ? newPromoFormData.countdown_end_time
                          : undefined
                      }
                      onSelect={(date) => {
                        setNewPromoFormData((prevState) => ({
                          ...prevState,
                          countdown_end_time:
                            date === undefined ? undefined : date,
                        }));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {findFormError("countdown_end_time") && (
                  <p className="text-red-500 text-sm">
                    {findFormError("countdown_end_time")?.message}
                  </p>
                )}
              </div>
              {/* Is Active */}
              <div className="flex items-center space-x-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="is_active">Is Active</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle if the promotion is currently active.</p>
                  </TooltipContent>
                </Tooltip>
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={newPromoFormData.is_active ?? true}
                  onChange={handleInputChange}
                  className="form-checkbox"
                />
              </div>
            </TooltipProvider>
            {/* Product Linking Section */}
            {editingPromo?.id && (
              <div className="space-y-4 border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold">Linked Products</h3>
                <div className="space-y-2">
                  <Label htmlFor="product-search">
                    Search Products to Link
                  </Label>
                  <Input
                    id="product-search"
                    placeholder="Search by product name..."
                    value={productSearchQuery}
                    onChange={(e) => debouncedProductSearch(e.target.value)}
                  />
                </div>
                <div>
                  {isSearchingProducts && <p>Searching...</p>}
                  {productSearchError && (
                    <p className="text-red-500">Error searching products.</p>
                  )}
                  {searchResults && searchResults.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      <h4 className="font-medium">Search Results</h4>
                      {searchResults.map((product: any) => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center border-b pb-2"
                        >
                          <span>{product.name}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddProduct(product.id)}
                          >
                            Add
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {searchResults &&
                    searchResults.length === 0 &&
                    productSearchQuery && (
                      <p className="text-gray-500 text-sm">
                        No products found for &quot;{productSearchQuery}&quot;.
                      </p>
                    )}
                  {!productSearchQuery && (
                    <p className="text-gray-500 text-sm">
                      Start typing to search for products.
                    </p>
                  )}
                </div>
                <div className="space-y-2 mt-4">
                  <h4 className="font-medium">Currently Linked Products</h4>
                  {isLoadingLinkedProducts && <p>Loading linked products...</p>}
                  {linkedProductsError && (
                    <p className="text-red-500">
                      Error loading linked products.
                    </p>
                  )}
                  <div>
                    {linkedProducts && linkedProducts.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {linkedProducts.map((product: any) => (
                          <div
                            key={product.id}
                            className="flex justify-between items-center border-b pb-2"
                          >
                            <span>{product.name}</span>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveProduct(product.id)}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">
                        No products linked to this promotion yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || uploading}>
              {isCreating
                ? "Saving..."
                : editingPromo?.id
                  ? "Save Changes"
                  : "Add Promo"}
            </Button>
          </DialogFooter>
          {createError && (
            <div className="text-red-600 mt-2">
              Error: {createError.message}
            </div>
          )}
          {deleteError && (
            <div className="text-red-600 mt-2">
              Error: {deleteError.message}
            </div>
          )}
          {updateError && (
            <div className="text-red-600 mt-2">
              Error: {updateError.message}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the promotional card &quot;
              {promoToDelete?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
