"use client";
import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import React, { useState, ChangeEvent } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "src/utils/database.types";
import { toast } from "sonner";
import { Checkbox } from "@components/ui/checkbox";
import { v4 as uuidv4 } from "uuid";

// Types
// Banner, InsertBanner, UpdateBanner as before

type Banner = Tables<"banners"> & { bundles?: Tables<"bundles"> | null };
type InsertBanner = TablesInsert<"banners">;
type UpdateBanner = TablesUpdate<"banners">;

export default function HomeBannersManagerClient({
  banners: initialBanners,
  promotions,
  bundles,
}: {
  banners: Banner[];
  promotions: Tables<"promotions">[];
  bundles: Tables<"bundles">[];
}) {
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Unique tags from promotions
  const uniqueTags = React.useMemo(() => {
    if (!promotions) return [];
    const tags = new Set(
      promotions.map((promo) => promo.tag).filter((tag) => tag)
    );
    return Array.from(tags);
  }, [promotions]);

  const selectableTags = React.useMemo(() => {
    const tagSet = new Set(uniqueTags);
    tagSet.add("black-friday");
    return Array.from(tagSet);
  }, [uniqueTags]);

  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [editingBanner, setEditingBanner] = useState<
    InsertBanner | UpdateBanner | null
  >(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const saveBannerMutation = useMutation<
    void,
    Error,
    InsertBanner | UpdateBanner
  >({
    mutationFn: async (bannerData) => {
      if ((bannerData as UpdateBanner).id) {
        // Update existing banner
        const { error } = await supabase
          .from("banners")
          .update(bannerData as UpdateBanner)
          .eq("id", (bannerData as UpdateBanner).id!);
        if (error) throw error;
        toast.success("Banner updated successfully!");
      } else {
        // Add new banner
        const { error } = await supabase
          .from("banners")
          .insert(bannerData as InsertBanner);
        if (error) throw error;
        toast.success("Banner added successfully!");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      closeDialog();
    },
    onError: (error) => {
      toast.error(`Error saving banner: ${error.message}`);
      console.error("Error saving banner:", error);
    },
  });

  const deleteBannerMutation = useMutation<void, Error, string>({
    mutationFn: async (bannerId) => {
      // Optional: Get the image_url before deleting the banner to delete the file
      const { data: bannerToDelete, error: fetchError } = await supabase
        .from("banners")
        .select("image_url")
        .eq("id", bannerId)
        .single();
      if (fetchError) {
        console.error("Error fetching banner for image deletion:", fetchError);
        // Proceed with banner deletion even if fetching image_url fails
      }

      const { error } = await supabase
        .from("banners")
        .delete()
        .eq("id", bannerId);
      if (error) throw error;

      // If image_url was fetched, attempt to delete the file from storage
      if (bannerToDelete?.image_url) {
        const urlParts = bannerToDelete.image_url.split("/");
        const fileName = urlParts[urlParts.length - 1]; // Simple way to get file name, adjust if using folders
        // Assuming images are in a 'banners' bucket in the root
        const filePath = fileName; // Adjust if using folders like 'banners/image.jpg'

        const { error: deleteFileError } = await supabase.storage
          .from("banners")
          .remove([filePath]);
        if (deleteFileError) {
          console.error(
            "Error deleting banner image from storage:",
            deleteFileError
          );
          // Log the error but don't prevent banner deletion
        }
      }

      toast.success("Banner deleted successfully!");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["banners"] });
    },
    onError: (error) => {
      toast.error(`Error deleting banner: ${error.message}`);
      console.error("Error deleting banner:", error);
    },
  });

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`; // Adjust if you want folders, e.g., `banner_images/${fileName}`

    const { data, error } = await supabase.storage
      .from("banners")
      .upload(filePath, file);

    setUploading(false);

    if (error) {
      throw error;
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("banners").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSave = async () => {
    if (!editingBanner) return;

    let finalBannerData = { ...editingBanner };

    if (selectedFile) {
      try {
        const publicUrl = await uploadImage(selectedFile);
        finalBannerData.image_url = publicUrl;
      } catch (error: any) {
        toast.error(`Image upload failed: ${error.message}`);
        console.error("Upload error:", error);
        return; // Stop the save process if upload fails
      }
    } else if (!editingBanner.image_url) {
      // Prevent saving if no file selected and no existing image URL (for new banners)
      toast.error("Please select an image file.");
      return;
    }

    saveBannerMutation.mutate(finalBannerData);
  };

  const openDialog = (banner?: Banner) => {
    setSelectedFile(null); // Clear selected file on opening dialog
    if (banner) {
      setEditingBanner(banner);
    } else {
      // Initialize for new banner with correct type
      setEditingBanner({
        image_url: "", // Start with empty image_url
        tag: null,
        active: true,
        type: "carousel", // Default to carousel
        order: null,
      } as InsertBanner); // Cast to InsertBanner
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setSelectedFile(null); // Clear selected file on closing
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setEditingBanner((prev) => {
      if (!prev) return null;
      if (name === "order" && type === "number") {
        return { ...prev, [name]: parseInt(value, 10) || null };
      } else {
        return { ...prev, [name]: value };
      }
    });
  };

  const handleSelectChange = (
    name: keyof (InsertBanner | UpdateBanner),
    value: string
  ) => {
    setEditingBanner((prev) => {
      if (!prev) return null;
      if (name === "tag" && value === "none-selected") {
        return { ...prev, [name]: null };
      } else if (name === "bundle_id" && value === "none-selected") {
        return { ...prev, [name]: null };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleCheckboxChange = (
    name: keyof (InsertBanner | UpdateBanner),
    checked: boolean
  ) => {
    setEditingBanner((prev) => (prev ? { ...prev, [name]: checked } : null));
  };

  const handleDelete = (banner: Banner) => {
    if (confirm("Are you sure you want to delete this banner?")) {
      // Pass the full banner object to the mutation to get image_url for deletion
      deleteBannerMutation.mutate(banner.id);
    }
  };

  const saveIsPending = saveBannerMutation.isPending || uploading;
  const deleteIsPending = deleteBannerMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Home Page Banners</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New Banner
        </Button>
      </div>

      {banners && banners.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="h-40 relative bg-gray-100">
                {banner.image_url && (
                  <Image
                    src={banner.image_url}
                    alt="Banner"
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <CardContent className="p-4">
                <p className="text-sm">Type: {banner.type}</p>
                <p className="text-sm">Tag: {banner.tag || "None"}</p>
                <p className="text-sm">Order: {banner.order ?? "None"}</p>
                <p className="text-sm">
                  Status: {banner.active ? "Active" : "Inactive"}
                </p>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => openDialog(banner)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(banner)}
                    disabled={deleteIsPending}
                  >
                    {deleteIsPending ? (
                      "Deleting..."
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <p>No banners found. Add a new banner to get started.</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBanner && (editingBanner as UpdateBanner).id
                ? "Edit Banner"
                : "Add New Banner"}
            </DialogTitle>
            <DialogDescription>
              Make changes to the home page banner here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Banner Type</Label>
              <Select
                name="type"
                value={editingBanner?.type || ""}
                onValueChange={(value) => handleSelectChange("type", value)}
                disabled={saveIsPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select banner type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="side">Side</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Banner Image</Label>
              <Input
                id="image"
                name="image"
                type="file"
                onChange={handleFileSelect}
                disabled={saveIsPending || uploading}
                accept="image/*"
              />

              {(selectedFile || editingBanner?.image_url) && (
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
                  ) : editingBanner?.image_url ? (
                    <Image
                      src={editingBanner.image_url}
                      alt="Existing banner image"
                      fill
                      className="object-contain"
                    />
                  ) : null}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">Link to Tag Page (Optional)</Label>
              <Select
                name="tag"
                value={editingBanner?.tag ?? "none-selected"}
                onValueChange={(value) => handleSelectChange("tag", value)}
                disabled={saveIsPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-selected">None</SelectItem>
                  {selectableTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bundle">Link to Bundle (Optional)</Label>
              <Select
                name="bundle_id"
                value={editingBanner?.bundle_id ?? "none-selected"}
                onValueChange={(value) =>
                  handleSelectChange("bundle_id", value)
                }
                disabled={saveIsPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bundle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none-selected">None</SelectItem>
                  {bundles?.map((bundle) => (
                    <SelectItem key={bundle.id} value={bundle.id}>
                      {bundle.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">Order (Optional)</Label>
              <Input
                id="order"
                name="order"
                type="number"
                value={editingBanner?.order ?? ""}
                onChange={handleInputChange}
                placeholder="Enter order number"
                disabled={saveIsPending}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                name="active"
                checked={editingBanner?.active ?? true}
                onCheckedChange={(checked) =>
                  handleCheckboxChange("active", checked as boolean)
                }
                disabled={saveIsPending}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeDialog}
              disabled={saveIsPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                saveIsPending ||
                uploading ||
                (!selectedFile && !editingBanner?.image_url) ||
                !editingBanner?.type
              }
            >
              {saveIsPending || uploading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
