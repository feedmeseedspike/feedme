"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

// Import necessary hooks and types
import {
  usePromotionsQuery,
  useCreatePromotionMutation,
  useDeletePromotionMutation,
  useUpdatePromotionMutation,
} from "../../../queries/promotions";
import { Database } from "src/utils/database.types"; // Assuming this path is now correct
import { z } from "zod";

// Reuse the same schema as PromoCardsManager, but default is_featured_on_homepage to false
const promotionFormSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  tag: z
    .string()
    .min(1, { message: "Tag is required." })
    .regex(/^[a-z0-9-]+$/, {
      message: "Tag must be lowercase, alphanumeric, and can include hyphens.",
    }), // Basic tag format validation
  discount_text: z.string().optional().nullable(), // Allow null or undefined from DB
  background_color: z.string().optional().nullable(), // Allow null or undefined from DB
  image_url: z.string().optional().nullable(), // Allow null or undefined from DB
  is_active: z.boolean().default(true).optional(),
  old_price: z
    .preprocess(
      (val) => (val === "" ? null : Number(val)),
      z.nullable(z.number().positive("Must be a positive number.").optional())
    )
    .optional()
    .nullable(), // Allow null or undefined
  new_price: z
    .preprocess(
      (val) => (val === "" ? null : Number(val)),
      z.nullable(z.number().positive("Must be a positive number.").optional())
    )
    .optional()
    .nullable(), // Allow null or undefined
  extra_discount_text: z.string().optional().nullable(), // Allow null or undefined
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
    .nullable(), // Allow null or undefined
  is_featured_on_homepage: z.boolean().default(false).optional(), // Default to false for this manager
});

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
type PromotionInsert = Database["public"]["Tables"]["promotions"]["Insert"];
type PromotionFormData = z.infer<typeof promotionFormSchema>;

export default function TagBannersManager() {
  // Use the query hook to fetch promotions, filtered for non-featured ones
  const {
    data: promotions,
    isLoading,
    error,
  } = usePromotionsQuery({ isFeatured: false });

  // Use mutation hooks for CRUD operations
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

  // const [tagBanners, setTagBanners] = useState(initialTagBanners); // Remove local state
  const [editingBanner, setEditingBanner] = useState<Partial<Promotion> | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false); // State for delete confirmation
  const [promoToDelete, setPromoToDelete] = useState<Promotion | null>(null); // State for promo to delete

  // State for form data and validation errors
  const [newPromoFormData, setNewPromoFormData] = useState<
    Partial<PromotionFormData>
  >({
    title: "",
    tag: "",
    discount_text: undefined, // Corresponds to subtitle in old UI
    background_color: undefined, // Corresponds to bgColor
    image_url: undefined, // Corresponds to imageUrl
    is_active: true,
    old_price: undefined,
    new_price: undefined,
    extra_discount_text: undefined,
    countdown_end_time: undefined,
    is_featured_on_homepage: false, // Default to false for this manager
  });
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);

  // Function to handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setNewPromoFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Handle form save (Add/Edit)
  const handleSave = async () => {
    setFormErrors([]); // Clear previous errors
    const validationResult = promotionFormSchema.safeParse(newPromoFormData);

    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      console.error("Form validation errors:", validationResult.error.issues);
      return;
    }
    const validatedData = validationResult.data;

    // Convert Date to ISO string if necessary for database
    const dataToSave = {
      ...validatedData,
      countdown_end_time:
        validatedData.countdown_end_time instanceof Date
          ? validatedData.countdown_end_time.toISOString()
          : validatedData.countdown_end_time,
    };

    if (editingBanner?.id) {
      // Update existing promotion
      updatePromotion(
        {
          id: editingBanner.id,
          ...dataToSave,
        } as Database["public"]["Tables"]["promotions"]["Update"], // Cast to update type
        {
          onSuccess: () => {
            // showToast("Banner updated successfully!", "success"); // Uncomment if useToast is used
            closeDialog();
          },
          onError: (err) => {
            console.error("Error updating banner:", err);
            // showToast(`Failed to update banner: ${err.message}`, "error"); // Uncomment if useToast is used
          },
        }
      );
    } else {
      // Create new promotion
      createPromotion(
        {
          ...dataToSave,
          is_featured_on_homepage: false,
        } as Database["public"]["Tables"]["promotions"]["Insert"], // Ensure false for this manager
        {
          onSuccess: () => {
            // showToast("Banner added successfully!", "success"); // Uncomment if useToast is used
            closeDialog();
          },
          onError: (err) => {
            console.error("Error adding banner:", err);
            // showToast("Failed to add banner: " + err.message, "error"); // Uncomment if useToast is used
          },
        }
      );
    }
  };

  // Function to open Add/Edit dialog
  const openDialog = (banner: Partial<Promotion> | null = null) => {
    setFormErrors([]); // Clear errors
    if (!banner) {
      // Add mode
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
        is_featured_on_homepage: false,
      });
    } else {
      // Edit mode - populate form with existing data
      setNewPromoFormData({
        title: banner.title || "",
        tag: banner.tag || "",
        discount_text: banner.discount_text ?? undefined, // Map to discount_text
        background_color: banner.background_color ?? undefined, // Map to background_color
        image_url: banner.image_url ?? undefined, // Map to image_url
        is_active: banner.is_active ?? true,
        old_price: banner.old_price ?? undefined,
        new_price: banner.new_price ?? undefined,
        extra_discount_text: banner.extra_discount_text ?? undefined,
        countdown_end_time: banner.countdown_end_time
          ? new Date(banner.countdown_end_time) // Ensure Date object
          : undefined,
        is_featured_on_homepage: banner.is_featured_on_homepage ?? false, // Populate from existing or default
      });
    }
    setEditingBanner(banner); // Keep track of the banner being edited
    setIsDialogOpen(true);
  };

  // Function to close Add/Edit dialog
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setFormErrors([]); // Clear errors on close
    // Clear form data on close as well
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
      is_featured_on_homepage: false, // Reset to false
    });
  };

  // Function to open the delete confirmation modal
  const openDeleteDialog = (promo: Promotion) => {
    setPromoToDelete(promo);
    setIsDeleteDialogOpen(true);
  };

  // Function to close the delete confirmation modal
  const closeDeleteDialog = () => {
    setPromoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Function to handle the actual deletion
  const handleDelete = () => {
    if (promoToDelete) {
      deletePromotion(promoToDelete.id.toString(), {
        // Use delete mutation
        onSuccess: () => {
          // showToast("Banner deleted successfully!", "success"); // Uncomment if useToast is used
          closeDeleteDialog();
        },
        onError: (err) => {
          console.error("Error deleting banner:", err);
          // showToast(`Failed to delete banner: ${err.message}`, "error"); // Uncomment if useToast is used
          closeDeleteDialog();
        },
      });
    }
  };

  // Helper to find validation error for a specific field
  const findFormError = (fieldName: keyof PromotionFormData) => {
    return formErrors.find((err) => err.path.join("."));
  };

  // Handle loading and error states
  if (isLoading) {
    return <div>Loading tag banners...</div>; // Or a skeleton
  }

  if (error) {
    console.error("Error fetching tag banners:", error);
    return <div>Error loading tag banners.</div>;
  }

  // Ensure promotions data is an array
  const promotionList = promotions || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tag Page Banners</h2>
        <Button onClick={() => openDialog(null)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Tag Banner
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
                src={promo.image_url || "/images/placeholder.png"}
                alt={promo.title || "Tag banner image"}
                fill
                className="object-contain"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{promo.title}</h3>
              {promo.discount_text && (
                <p className="text-sm text-gray-500">{promo.discount_text}</p>
              )}
              <p className="text-sm">Tag: {promo.tag}</p>
              <p className="text-sm">
                Status: {promo.is_active ? "Active" : "Inactive"}
              </p>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => openDialog(promo)}>
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => openDeleteDialog(promo)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner?.id ? "Edit Tag Banner" : "Add New Tag Banner"}
            </DialogTitle>
            <DialogDescription>
              {editingBanner?.id
                ? "Edit the tag page banner details."
                : "Fill in the details for the new tag page banner."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="tag">Tag (URL path)</Label>
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
            
            <div className="space-y-2">
              <Label htmlFor="discount_text">Subtitle (Discount Text)</Label>
              <Input
                id="discount_text"
                name="discount_text"
                value={newPromoFormData.discount_text ?? ""}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="background_color">Background Color</Label>
              <Input 
                id="background_color"
                name="background_color"
                type="text"
                value={newPromoFormData.background_color ?? ""}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input
                id="image_url"
                name="image_url"
                value={newPromoFormData.image_url ?? ""}
                onChange={handleInputChange}
                    />
                  </div>

            <div className="flex items-center space-x-2">
              <Label htmlFor="is_active">Is Active</Label>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={newPromoFormData.is_active ?? true}
                onChange={handleInputChange}
                className="form-checkbox"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? "Saving..."
                : editingBanner?.id
                ? "Save Changes"
                : "Add Banner"}
            </Button>
          </DialogFooter>
          {createError && (
            <div className="text-red-600 mt-2">
              Error creating: {createError.message}
            </div>
          )}
          {updateError && (
            <div className="text-red-600 mt-2">
              Error updating: {updateError.message}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the tag banner "
              {promoToDelete?.title}"? This action cannot be undone.
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
          {deleteError && (
            <div className="text-red-600 mt-2">
              Error deleting: {deleteError.message}
      </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
