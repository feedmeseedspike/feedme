"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import ProductGallery from "./product-gallery";
import { X } from "lucide-react";

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

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <LayoutGroup>
      <div className="flex flex-col gap-4 h-full">
        {/* Main Image Trigger */}
        <motion.div
          layoutId={`product-image-${selectedImageIndex}`}
          onClick={() => setIsOpen(true)}
          className="flex-1 relative w-full h-full bg-white border border-gray-200 flex items-center justify-center p-4 cursor-zoom-in"
        >
          <div className="h-[60vh] sm:h-[50vh] md:h-[60vh] lg:h-[80vh] flex items-center justify-center">
            <Image
              src={images[selectedImageIndex]}
              alt={`${name} - main view`}
              fill
              className="object-contain w-full h-full"
            />
          </div>
        </motion.div>

        {/* Zoomed Modal Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center bg-[#00000033] backdrop-blur-lg cursor-zoom-out"
              onClick={() => setIsOpen(false)}
            >
              <button
                className="absolute top-4 right-4 p-2 border rounded-full bg-gray-400/40 text-white backdrop-blur-lg z-[101]"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
              >
                <X />
              </button>

              <motion.div
                layoutId={`product-image-${selectedImageIndex}`}
                className="rounded-md w-fit h-[80%] flex items-center justify-center cursor-auto"
                onClick={(e) => e.stopPropagation()} 
              >
                <Image
                  src={images[selectedImageIndex]}
                  width={1000}
                  height={1000}
                  alt={`${name} - enlarged view`}
                  className="object-contain h-full w-auto max-w-[90vw] max-h-[80vh] rounded-md"
                />
              </motion.div>

              {/* Thumbnail Gallery in Modal */}
              <div className="flex flex-col items-center mt-4">
                <ProductGallery
                  images={images}
                  selectedIndex={selectedImageIndex}
                  onImageSelect={handleImageSelect}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
