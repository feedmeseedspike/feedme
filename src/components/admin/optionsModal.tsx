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
import { CloudUpload, Plus } from "lucide-react";
import Option from "@components/icons/option.svg";
import { OptionSchema } from "src/lib/validator";
import { uploadOptionImage } from "src/lib/api";
import Image from "next/image";

type OptionFormValues = z.infer<typeof OptionSchema>;

interface AddOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: OptionFormValues) => void;
}

export default function OptionModal({
  isOpen,
  onClose,
  onSubmit,
}: AddOptionModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OptionFormValues>({
    resolver: zodResolver(OptionSchema),
    defaultValues: {
      stockStatus: "In Stock",
    },
  });

  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setValue("image", file); // Set the image value in the form
    }
  };

  const submitForm = async (data: OptionFormValues) => {
    setUploadError(null);
    let imageUrl = data.image;
    if (image && image instanceof File) {
      setUploading(true);
      try {
        imageUrl = await uploadOptionImage(image);
      } catch (err: any) {
        setUploadError(err.message || "Failed to upload image");
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    const formData = {
      ...data,
      price: parseFloat(String(data.price)), // Ensure price is a number
      image: imageUrl,
    };
    if (onSubmit) onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            <Option />
            Add New Option
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitForm)} className="space-y-3">
          {/* Option Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Option Name
            </label>
            <Input
              {...register("name")}
              id="name"
              placeholder="Enter option name (e.g., 1kg, 500g)"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-2">
              Price (₦)
            </label>
            <Input
              {...register("price")}
              id="price"
              type="number"
              placeholder="₦ 00.00"
            />
            {errors.price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          {/* Stock Status */}
          <div>
            <label
              htmlFor="stockStatus"
              className="block text-sm font-medium mb-2"
            >
              Stock Status
            </label>
            <Select
              onValueChange={(value: "In Stock" | "Out of Stock") =>
                setValue("stockStatus", value)
              }
              defaultValue="In Stock"
            >
              <SelectTrigger className="w-full border p-4 rounded-lg">
                <SelectValue placeholder="Select Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-2">
              Image
            </label>
            <div className="flex flex-col items-center border p-4 rounded-md cursor-pointer">
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer text-center"
              >
                {image ? (
                  <Image
                    src={URL.createObjectURL(image)}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 py-2">
                    <CloudUpload />
                    <p className="text-sm text-center">
                      Click to upload or drag & drop
                    </p>
                    <p className="text-sm">PNG or JPG</p>
                  </div>
                )}
              </label>
            </div>
            {errors.image && (
              <p className="text-red-500 text-sm mt-1">
                {errors.image.message}
              </p>
            )}
          </div>

          {uploadError && (
            <p className="text-red-500 text-sm mt-1">{uploadError}</p>
          )}

          {/* Buttons */}
          <div className="flex w-full space-x-2">
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full bg-[#1B6013]"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Add Option"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
