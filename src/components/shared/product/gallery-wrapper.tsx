"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@components/ui/dialog";
import ProductGallery from "./product-gallery";

export default function ProductGalleryWrapper({
  images,
  name,
  selectedIndex = 0,
}: {
  images: string[];
  name: string;
  selectedIndex?: number;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(selectedIndex);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setSelectedImageIndex(selectedIndex);
  }, [selectedIndex]);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Main Image with Modal Trigger */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div className="flex-1 relative w-full h-full bg-white border border-gray-200 flex items-center justify-center p-4 cursor-zoom-in">
            <div className="h-[40vh] sm:h-[50vh] md:h-[60vh] lg:h-[80vh] flex items-center justify-center">
              <Image
                src={images[selectedImageIndex]}
                alt={`${name} - main view`}
                fill
                className="object-cove"
                priority
              />
            </div>
          </div>
        </DialogTrigger>

        {/* Modal Content */}
        <DialogContent className="max-w-[90vw] md:max-w-[40vw] h-[90vh">
          {/* <DialogHeader>
            <h3 className="text-lg font-medium">{name}</h3>
          </DialogHeader> */}

          {/* Main Image in Modal */}
          <div className="relative w-full h-[90dvh bg-white flex items-center justify-center">
            <Image
              src={images[selectedImageIndex]}
              alt={`${name} - enlarged view`}
              width={1500}
              height={1500}
              className="object-contain"
            />
          </div>

          {/* Thumbnail Gallery in Modal */}
          <div className="flex flex-col items-center">
            <ProductGallery
              images={images}
              selectedIndex={selectedImageIndex}
              onImageSelect={handleImageSelect}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
