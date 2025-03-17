"use client";

import { useState, useEffect } from "react";
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

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: AgentFormValues) => void;
  agent?: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    location: string;
    image: string; // URL of the existing image
  };
}

// List of Lagos areas
const lagosAreas = [
  "Lagos Island", "Lagos Mainland", "Victoria Island (VI)", "Ikoyi", "Lekki", 
  "Ajah", "Ikeja", "Surulere", "Yaba", "Apapa", "Oshodi", "Isolo", "Egbeda", 
  "Agege", "Ikorodu", "Badagry", "Epe", "Alimosho", "Mushin", "Festac Town", 
  "Amuwo-Odofin", "Ijegun", "Ijora", "Gbagada", "Ogba", "Magodo", "Ketu", 
  "Maryland", "Anthony", "Ojota", "Ilupeju", "Palmgrove", "Shomolu", "Bariga", 
  "Oworonshoki", "Ikotun", "Ejigbo", "Idimu", "Ipaja", "Abule Egba", "Ojo", 
  "Satellite Town", "Lagos Marina", "Oniru", "Lagos Lagoon"
];

export default function EditAgentModal({
  isOpen,
  onClose,
  onSubmit,
  agent,
}: EditAgentModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<AgentFormValues>({
    resolver: zodResolver(AgentSchema),
    defaultValues: {
      name: agent?.name || "",
      email: agent?.email || "",
      phoneNumber: agent?.phoneNumber || "",
      location: agent?.location || "Ikeja, Lagos",
    },
  });

  const [image, setImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    agent?.image || null
  );

  // Pre-fill the form when the agent prop changes
  useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        email: agent.email,
        phoneNumber: agent.phoneNumber,
        location: agent.location,
      });
      setPreviewImage(agent.image);
    }
  }, [agent, reset]);

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
      setValue("image", file);
    }
  };

  // Handle form submission
  const submitForm = (data: AgentFormValues) => {
    if (image || previewImage) {
      const formData = {
        ...data,
        location: `${data.location}, Lagos`, // Concatenate location with "Lagos"
        image: image || previewImage, // Use the new image or the existing one
      };
      if (onSubmit) onSubmit(formData); // Pass updated data to parent
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] lg:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="mx-auto text-lg font-semibold flex justify-center flex-col items-center gap-2">
            <Agent />
            Edit Agent
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
              defaultValue={agent?.location || "Ikeja, Lagos"}
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
                {previewImage ? (
                  <img
                    src={previewImage}
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}