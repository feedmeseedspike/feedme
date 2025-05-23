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
import { CloudUpload } from "lucide-react";
import Agent from "@components/icons/addAgent.svg";

const AgentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  location: z.string().min(1, "Location is required"),
  image: z.any().refine((file) => file instanceof File, "Image is required"),
});

type AgentFormValues = z.infer<typeof AgentSchema>;

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AgentFormValues) => void;
}

const lagosAreas = [
  "Lagos Island",
  "Lagos Mainland",
  "Victoria Island (VI)",
  "Ikoyi",
  "Lekki",
  "Ajah",
  "Ikeja",
  "Surulere",
  "Yaba",
  "Apapa",
  "Oshodi",
  "Isolo",
  "Egbeda",
  "Agege",
  "Ikorodu",
  "Badagry",
  "Epe",
  "Alimosho",
  "Mushin",
  "Festac Town",
  "Amuwo-Odofin",
  "Ijegun",
  "Ijora",
  "Gbagada",
  "Ogba",
  "Magodo",
  "Ketu",
  "Maryland",
  "Anthony",
  "Ojota",
  "Ilupeju",
  "Palmgrove",
  "Shomolu",
  "Bariga",
  "Oworonshoki",
  "Ikotun",
  "Ejigbo",
  "Idimu",
  "Ipaja",
  "Abule Egba",
  "Ojo",
  "Satellite Town",
  "Lagos Marina",
  "Oniru",
  "Lagos Lagoon",
];

export default function AgentModal({
  isOpen,
  onClose,
  onSubmit,
}: AgentModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AgentFormValues>({
    resolver: zodResolver(AgentSchema),
    defaultValues: {
      location: "Ikeja, Lagos",
    },
  });

  const [image, setImage] = useState<File | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setValue("image", file);
    }
  };

  const submitForm = (data: AgentFormValues) => {
    if (image) {
      const formData = {
        ...data,
        location: `${data.location}, Lagos`, // Concatenate location with "Lagos"
        image, // Include the image file in the form data
      };
      // console.log(formData);
      if (onSubmit) onSubmit(formData); // Call the onSubmit prop if provided
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            <Agent />
            Add New Agent
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitForm)} className="space-y-3">
          {/* Full Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Full Name
            </label>
            <Input
              {...register("name")}
              id="name"
              placeholder="Enter agent's full name here"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address
              </label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="Enter agent's email address"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium mb-2"
              >
                Phone Number
              </label>
              <Input
                {...register("phoneNumber")}
                id="phoneNumber"
                type="tel"
                placeholder="Enter agent's phone number"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium mb-2"
            >
              Location
            </label>
            <Select
              onValueChange={(value) => setValue("location", value)}
              defaultValue="Ikeja, Lagos" // Default value for the Select component
            >
              <SelectTrigger className="w-full border p-4 rounded-lg">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                {lagosAreas.map((area, index) => (
                  <SelectItem key={index} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium mb-2">
              Profile Picture
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
                  <img
                    src={URL.createObjectURL(image)}
                    alt="Preview"
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
            <Button variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button type="submit" className="w-full bg-[#1B6013]">
              Add Agent
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
