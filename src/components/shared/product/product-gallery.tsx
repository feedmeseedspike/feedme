'use client'

import { useState } from 'react'
import Image from 'next/image'
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'
export default function ProductGallery({ images }: { images: string[] }) {
  const [selectedImage, setSelectedImage] = useState(0)
  return (
    <div className='fle gap-2'>
      <div className='flex gap-2'>
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => {
              setSelectedImage(index)
            }}
            onMouseOver={() => {
              setSelectedImage(index)
            }}
            className={` overflow-hidden ${
              selectedImage === index
                && 'border border-[#F0800F] rounded-[8px] size-[60px] p-[1px]'
            }`}
          >
            <Image src={image} alt={'product image'} width={60} height={60} className="border rounded-[8px] w-full h-full" />
          </button>
        ))}
      </div>

      
    </div>
  )
}
