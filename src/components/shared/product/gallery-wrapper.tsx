'use client';

import { useState } from 'react';
import Image from 'next/image';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export default function ProductGalleryWrapper({
  images,
  name,
}: {
  images: string[];
  name: string;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Main Image with Zoom */}
      <div className="flex-1 relative w-full aspect-square bg-secondary">
        <Zoom>
          <div className="w-full h-full relative">
            <Image
              src={images[selectedImageIndex]}
              alt={name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
              className="object-contain rounded-lg"
              priority
            />
          </div>
        </Zoom>
      </div>

      {/* Thumbnail Gallery */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => handleImageSelect(index)}
            className={`shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden transition-all duration-200 ${
              selectedImageIndex === index
                ? 'border-[#F0800F] p-[1px]'
                : 'border-transparent hover:border-gray-300'
            }`}
            aria-label={`View ${name} image ${index + 1}`}
          >
            <Image
              src={image}
              alt={`${name} thumbnail ${index + 1}`}
              width={64}
              height={64}
              className="w-full h-full object-cover rounded-md"
            />
          </button>
        ))}
      </div>
    </div>
  );
}