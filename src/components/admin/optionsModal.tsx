"use client";

import { useState, useEffect, useRef, useMemo } from "react";
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
import { CloudUpload } from "lucide-react";
import Option from "@components/icons/option.svg";
import { OptionSchema } from "src/lib/validator";
import Image from "next/image";

type OptionFormValues = z.infer<typeof OptionSchema>;

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: OptionFormValues) => void;
  mode?: "add" | "edit";
  initialData?: Partial<OptionFormValues>;
}

// Helper to coerce price to number or undefined
function toNumberOrUndefined(val: unknown): number | undefined {
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim() !== "") return Number(val);
  return undefined;
}

export default function OptionModal({
  isOpen,
  onClose,
  onSubmit,
  mode = "add",
  initialData,
}: OptionModalProps) {
  // Ensure initialData is always an object, memoized for useEffect deps
  const safeInitialData = useMemo(() => initialData || {}, [initialData]);
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<OptionFormValues>({
    resolver: zodResolver(OptionSchema),
    defaultValues: {
      stockStatus: safeInitialData.stockStatus || "In Stock",
      name: safeInitialData.name || "",
      price: toNumberOrUndefined(safeInitialData.price),
      list_price: toNumberOrUndefined(safeInitialData.list_price),
      image: safeInitialData.image || undefined,
    },
  });

  const [image, setImage] = useState<File | string | null>(
    safeInitialData.image || null
  );

  // Only reset form when modal is opened and initialData changes
  const prevInitialDataRef = useRef<any>(null);
  useEffect(() => {
    if (isOpen) {
      // Only reset if initialData actually changed
      if (
        JSON.stringify(prevInitialDataRef.current) !==
        JSON.stringify(safeInitialData)
      ) {
        reset({
          stockStatus: safeInitialData.stockStatus || "In Stock",
          name: safeInitialData.name || "",
          price: toNumberOrUndefined(safeInitialData.price),
          list_price: toNumberOrUndefined(safeInitialData.list_price),
          image: safeInitialData.image || undefined,
        });
        setImage(safeInitialData.image || null);
        prevInitialDataRef.current = safeInitialData;
      }
    } else {
      // Reset image state when modal closes (in add mode only)
      if (mode === "add") {
        setImage(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, safeInitialData, reset, mode]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setValue("image", file); // Set the image value in the form
    }
  };

  const submitForm = async (data: OptionFormValues) => {
    console.log("OptionModal submitForm called with:", { data, imageState: image });
    const formData = {
      ...data,
      price: parseFloat(String(data.price)),
      list_price:
        data.list_price !== undefined
          ? parseFloat(String(data.list_price))
          : undefined,
      image: image,
    };
    console.log("OptionModal formData being submitted:", formData);
    if (onSubmit) onSubmit(formData);
    // Reset image state after successful submit
    setImage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            <Option />
            {mode === "edit" ? "Edit Option" : "Add New Option"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitForm as any)} className="space-y-3">
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
          {/* List Price */}
          <div>
            <label
              htmlFor="list_price"
              className="block text-sm font-medium mb-2"
            >
              List Price (₦)
            </label>
            <Input
              {...register("list_price")}
              id="list_price"
              type="number"
              placeholder="₦ 00.00"
            />
            {errors.list_price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.list_price.message}
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
              value={watch("stockStatus") || "In Stock"}
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
                    src={
                      image instanceof File 
                        ? URL.createObjectURL(image)
                        : image
                    }
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
          {/* Buttons */}
          <div className="flex w-full space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full"
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full bg-[#1B6013]">
              {mode === "edit" ? "Save Changes" : "Add Option"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
