"use client";

import { useState } from "react";
import { Camera, X, Upload } from "lucide-react";
import { Button } from "@components/ui/button";
import { useToast } from "src/hooks/useToast";
import Image from "next/image";

interface PhotoUploadModalProps {
  bundleId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PhotoUploadModal({
  bundleId,
  isOpen,
  onClose,
  onSuccess,
}: PhotoUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image must be less than 5MB", "error");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      showToast("Please select an image", "error");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("caption", caption);

      const response = await fetch(`/api/recipes/${bundleId}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload photo");
      }

      showToast("Photo uploaded! It will appear after admin approval.", "success");
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption("");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast(error.message || "Failed to upload photo", "error");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F0800F]/10 flex items-center justify-center">
              <Camera className="text-[#F0800F]" size={20} />
            </div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
              I Made This!
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            {previewUrl ? (
              <div className="relative aspect-square w-full rounded-xl overflow-hidden border-2 border-gray-200">
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="block aspect-square w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-[#F0800F] transition-colors cursor-pointer">
                <div className="h-full flex flex-col items-center justify-center text-gray-400 hover:text-[#F0800F] transition-colors">
                  <Upload size={48} className="mb-4" />
                  <p className="font-bold text-sm uppercase tracking-widest">
                    Upload Photo
                  </p>
                  <p className="text-xs mt-2">Max 5MB • JPG, PNG</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Caption */}
          <div>
            <label
              htmlFor="caption"
              className="block text-sm font-bold text-gray-900 mb-2 uppercase tracking-widest"
            >
              Caption (Optional)
            </label>
            <textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell us about your creation..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B6013]/20 focus:border-[#1B6013] resize-none"
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium">
              📸 Your photo will be reviewed by our team before appearing on the recipe page.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedFile || isUploading}
              className="flex-1 bg-[#1B6013] hover:bg-[#1B6013]/90 text-white font-black uppercase tracking-widest"
            >
              {isUploading ? "Uploading..." : "Upload Photo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
