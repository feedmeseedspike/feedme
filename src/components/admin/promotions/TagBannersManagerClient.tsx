"use client";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Upload, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  useCreatePromotionMutation,
  useDeletePromotionMutation,
  useUpdatePromotionMutation,
} from "../../../queries/promotions";
import { Database } from "src/utils/database.types";
import { z } from "zod";
import { createClient } from "@utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "../../../hooks/useToast";

type Promotion = Database["public"]["Tables"]["promotions"]["Row"];
type PromotionInsert = Database["public"]["Tables"]["promotions"]["Insert"];
type PromotionUpdate = Database["public"]["Tables"]["promotions"]["Update"];

// Reuse the same schema as PromoCardsManager, but default is_featured_on_homepage to false
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
  is_featured_on_homepage: z.boolean().default(false).optional(),
});

type PromotionFormData = z.infer<typeof promotionFormSchema>;

export default function TagBannersManagerClient({
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

  const [editingBanner, setEditingBanner] = useState<Partial<Promotion> | null>(
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
    is_featured_on_homepage: false,
  });
  const [formErrors, setFormErrors] = useState<z.ZodIssue[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setNewPromoFormData((prevState) => ({
      ...prevState,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setFormErrors([]);
    let imageUrl = newPromoFormData.image_url;
    if (selectedFile) {
      try {
        imageUrl = await uploadImage(selectedFile);
      } catch (error: any) {
        console.error(`Image upload failed: ${error.message}`);
        return;
      }
    } else if (!imageUrl && !editingBanner?.id) {
      console.error("Please select an image file for the new banner.");
      return;
    }
    const validationResult = promotionFormSchema.safeParse({
      ...newPromoFormData,
      image_url: imageUrl,
    });
    if (!validationResult.success) {
      setFormErrors(validationResult.error.issues);
      console.error("Form validation errors:", validationResult.error.issues);
      return;
    }
    const validatedData = validationResult.data;
    const dataToSave: PromotionUpdate = {
      ...validatedData,
      ...(editingBanner?.id && { id: editingBanner.id }),
      image_url: imageUrl,
      countdown_end_time:
        validatedData.countdown_end_time instanceof Date
          ? validatedData.countdown_end_time.toISOString()
          : validatedData.countdown_end_time,
    };
    if (editingBanner?.id) {
      updatePromotion(dataToSave, {
        onSuccess: () => {
          showToast("Banner updated successfully!", "success");
          closeDialog();
        },
        onError: (err) => {
          console.error("Error updating banner:", err);
          showToast(`Failed to update banner: ${err.message}`, "error");
        },
      });
    } else {
      createPromotion(
        {
          ...dataToSave,
          is_featured_on_homepage: false,
        } as PromotionInsert,
        {
          onSuccess: () => {
            showToast("Banner added successfully!", "success");
            closeDialog();
          },
          onError: (err) => {
            console.error("Error adding banner:", err);
            showToast("Failed to add banner: " + err.message, "error");
          },
        }
      );
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

  const openDialog = (banner: Partial<Promotion> | null = null) => {
    setFormErrors([]);
    setSelectedFile(null);
    if (!banner) {
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
      setNewPromoFormData({
        title: banner.title || "",
        tag: banner.tag || "",
        discount_text: banner.discount_text ?? undefined,
        background_color: banner.background_color ?? undefined,
        image_url: banner.image_url ?? undefined,
        is_active: banner.is_active ?? true,
        old_price: banner.old_price ?? undefined,
        new_price: banner.new_price ?? undefined,
        extra_discount_text: banner.extra_discount_text ?? undefined,
        countdown_end_time: banner.countdown_end_time
          ? new Date(banner.countdown_end_time)
          : undefined,
        is_featured_on_homepage: banner.is_featured_on_homepage ?? false,
      });
    }
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
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
      is_featured_on_homepage: false,
    });
  };

  const openDeleteDialog = (promo: Promotion) => {
    setPromoToDelete(promo);
    setIsDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setPromoToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleDelete = () => {
    if (promoToDelete) {
      const { image_url: imageUrlToDelete } = promoToDelete;
      deletePromotion(promoToDelete.id.toString(), {
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
          showToast("Banner deleted successfully!", "success");
          closeDeleteDialog();
        },
        onError: (err) => {
          console.error("Error deleting banner:", err);
          showToast(`Failed to delete banner: ${err.message}`, "error");
          closeDeleteDialog();
        },
      });
    }
  };

  const findFormError = (fieldName: keyof PromotionFormData) => {
    return formErrors.find((err) => err.path.join(".") === fieldName);
  };

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
            <div className="space-y-2">
              <Label htmlFor="image">Banner Image</Label>
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
                      alt="Existing banner image"
                      fill
                      className="object-contain"
                    />
                  ) : null}
                </div>
              )}
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
            <Button
              onClick={handleSave}
              disabled={isCreating || isUpdating || uploading}
            >
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
              Are you sure you want to delete the tag banner
              {promoToDelete?.title}? This action cannot be undone.
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
 