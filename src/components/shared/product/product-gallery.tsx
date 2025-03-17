'use client';

import Image from 'next/image';

export default function ProductGallery({
  images,
  onImageSelect,
}: {
  images: string[];
  onImageSelect: (index: number) => void;
}) {
  return (
    <div className="flex gap-2">
      {images.map((image, index) => (
        <button
          key={index}
          onClick={() => onImageSelect(index)}
          onMouseOver={() => onImageSelect(index)}
          className={`overflow-hidden ${
            index === 0
              ? 'border border-[#F0800F] rounded-[8px] size-[60px] p-[1px]'
              : ''
          }`}
        >
          <Image
            src={image}
            alt="Product Thumbnail"
            width={60}
            height={60}
            className="border rounded-[8px] w-full h-full"
          />
        </button>
      ))}
    </div>
  );
}