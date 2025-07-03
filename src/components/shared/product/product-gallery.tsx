'use client';

import Image from 'next/image';
import { cn } from '../../../lib/utils';

export default function ProductGallery({
  images,
  selectedIndex = 0,
  onImageSelect,
}: {
  images: string[];
  selectedIndex?: number;
  onImageSelect: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {images.map((image, index) => (
        <button
          key={index}
          onClick={() => onImageSelect(index)}
          className={cn(
            "shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden transition-all duration-200",
            selectedIndex === index
              ? "border-[#F0800F] p-[1px]"
              : "border-transparent hover:border-gray-300"
          )}
          aria-label={`View image ${index + 1}`}
        >
          <Image
            src={image}
            alt="Product Thumbnail"
            width={64}
            height={64}
            className="w-full h-full object-cover rounded-md"
          />
        </button>
      ))}
    </div>
  );
}