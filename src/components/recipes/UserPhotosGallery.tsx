"use client";

import { useState, useEffect } from "react";
import { Heart, Camera as CameraIcon } from "lucide-react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "src/hooks/useToast";

interface UserPhoto {
  id: string;
  photo_url: string;
  caption?: string;
  guest_name?: string;
  created_at: string;
  likes_count: number;
}

interface UserPhotosGalleryProps {
  bundleId: string;
  onUploadClick: () => void;
}

export default function UserPhotosGallery({
  bundleId,
  onUploadClick,
}: UserPhotosGalleryProps) {
  const [photos, setPhotos] = useState<UserPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const { showToast } = useToast();

  useEffect(() => {
    fetchPhotos();
  }, [bundleId]);

  const fetchPhotos = async () => {
    try {
      const response = await fetch(`/api/recipes/${bundleId}/photos`);
      if (!response.ok) throw new Error("Failed to fetch photos");

      const data = await response.json();
      setPhotos(data.photos || []);
    } catch (error) {
      console.error("Error fetching photos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikePhoto = async (photoId: string) => {
    try {
      const response = await fetch(
        `/api/recipes/${bundleId}/photos/${photoId}/like`,
        { method: "POST" }
      );

      if (!response.ok) throw new Error("Failed to like photo");

      const data = await response.json();

      // Update local state
      if (data.action === "liked") {
        setLikedPhotos((prev) => new Set(prev).add(photoId));
      } else {
        setLikedPhotos((prev) => {
          const next = new Set(prev);
          next.delete(photoId);
          return next;
        });
      }

      // Refresh photos to get updated like count
      await fetchPhotos();
    } catch (error) {
      console.error("Like error:", error);
      showToast("Failed to like photo", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-[#1B6013] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CameraIcon size={24} className="text-[#F0800F]" />
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
            Community Creations
          </h3>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
            {photos.length}
          </span>
        </div>
        <button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#F0800F] text-white rounded-xl font-bold text-sm hover:bg-[#F0800F]/90 transition-colors"
        >
          <CameraIcon size={16} />
          Share Yours
        </button>
      </div>

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <CameraIcon size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium mb-4">
            No community photos yet. Be the first to share!
          </p>
          <button
            onClick={onUploadClick}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B6013] text-white rounded-xl font-black text-sm uppercase tracking-widest hover:bg-[#1B6013]/90 transition-colors"
          >
            <CameraIcon size={16} />
            Upload Your Creation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const isLiked = likedPhotos.has(photo.id);
            const timeAgo = formatDistanceToNow(new Date(photo.created_at), {
              addSuffix: true,
            });

            return (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 hover:shadow-lg transition-all"
              >
                {/* Image */}
                <Image
                  src={photo.photo_url}
                  alt={photo.caption || "User photo"}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    {/* Caption */}
                    {photo.caption && (
                      <p className="text-xs font-medium mb-2 line-clamp-2">
                        {photo.caption}
                      </p>
                    )}

                    {/* Author & Time */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold">
                        {photo.guest_name || "FeedMe User"}
                      </span>
                      <span className="opacity-75">{timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* Like Button */}
                <button
                  onClick={() => handleLikePhoto(photo.id)}
                  className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-md transition-all ${
                    isLiked
                      ? "bg-[#F0800F] text-white"
                      : "bg-white/80 text-gray-700 hover:bg-white"
                  }`}
                >
                  <Heart
                    size={16}
                    className={isLiked ? "fill-current" : ""}
                  />
                </button>

                {/* Like Count */}
                {photo.likes_count > 0 && (
                  <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-full text-white text-xs font-bold">
                    {photo.likes_count} ❤️
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
