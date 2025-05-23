"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ProductGalleryWrapper from "./gallery-wrapper";
import RatingSummary from "./rating-summary";
import { Separator } from "@components/ui/separator";
import AddToCart from "./add-to-cart";
import ShareLike from "./product-shareLike";
import Options from "../../../app/(home)/product/options";
import Freshness from "@components/icons/freshness.svg";
import FastDelivery from "@components/icons/fastDelivery.svg";
import Security from "@components/icons/security.svg";
import { formatNaira, generateId } from "src/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "src/store";
import Link from "next/link";
import { setSelectedOption } from "src/store/features/optionsSlice";
import { useToast } from "src/hooks/useToast";

const datas = [
  {
    id: 1,
    icon: <FastDelivery />,
    title: "Fast Delivery",
    description: "Get your order at your doorstep in 3 hours or less.",
  },
  {
    id: 2,
    icon: <Security />,
    title: "Security & Privacy",
    description:
      "Safe payments: We do not share your personal details with any third parties without your consent.",
  },
];

interface ProductOption {
  name: string;
  price: number;
  image: string;
}

export default function ProductDetailsClient({
  product,
  cartItemId,
}: {
  product: {
    _id?: string;
    name: string;
    images: string[];
    avgRating: number;
    numReviews: number;
    ratingDistribution: any;
    options?: ProductOption[];
    slug: string;
    category: string;
    price: number;
    vendor: {
      id: string;
      shopId: string;
      displayName: string;
      logo?: string;
    };
  };
  cartItemId: string;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const selectedOption = useSelector((state: RootState) => 
    product._id ? state.options.selectedOptions[product._id] : undefined
  );

  // Find the selected option data with proper fallback
  const selectedOptionData = useMemo(() => {
    if (!product.options || product.options.length === 0) return null;

    // If no option selected but options exist, use first option
    if (!selectedOption) {
      return product.options[0];
    }

    // Find the selected option
    const option = product.options.find(opt => opt.name === selectedOption);

    // Fallback to first option if selected option not found
    return option || product.options[0];
  }, [selectedOption, product.options]);

  // Set default option if none is selected
  useEffect(() => {
    if (product._id && product.options && product.options.length > 0 && !selectedOption) {
      dispatch(setSelectedOption({
        productId: product._id,
        option: product.options[0].name
      }));
    }
  }, [product._id, product.options, selectedOption, dispatch]);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleOptionChange = useCallback((value: string) => {
    if (product._id) {
      dispatch(setSelectedOption({
        productId: product._id,
        option: value
      }));
    }
  }, [dispatch, product._id]);

  return (
    <div className="py-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-8 bg-white my-6 p-3">
      <div className="col-span-3">
        <ProductGalleryWrapper
          images={product.images}
          name={product.name}
          selectedIndex={selectedImageIndex}
        />
      </div>

      <div className="col-span-3">
        <h1 className="text-2xl">{product.name}</h1>
        <RatingSummary
          avgRating={product.avgRating}
          numReviews={product.numReviews}
          asPopover
          ratingDistribution={product.ratingDistribution}
          showTotalCount={true}
        />
        <p className="text-[#12B76A] text-[14px] border py-1 px-2 border-[#bfe0d0] w-fit flex gap-1 items-center">
          Freshness Guarantee <Freshness className="size-4" />
        </p>
        <p className="text-[12px] pt-2">90k+ brought in past month</p>
        <Separator className="mt-4 mb-2" />
        <div className="flex flex-col gap-2">
          <p className="h4-bold">Variation: Grade A</p>

          {/* Thumbnail Gallery */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(index)}
                className={`shrink-0 w-16 h-16 border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                  selectedImageIndex === index
                    ? "border-[#F0800F] p-[1px]"
                    : "border-transparent hover:border-gray-300"
                }`}
                aria-label={`View ${product.name} image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover rounded-md"
                />
              </button>
            ))}
          </div>
        </div>
        <Separator className="mt-4 mb-2" />
        {product.options && product.options.length > 0 && (
          <Options
            options={product.options}
            selectedOption={selectedOptionData?.name}
            onOptionChange={handleOptionChange}
          />
        )}
      </div>

      {/* Add to Cart Section */}
      <div className="col-span-1 md:col-span-6 lg:col-span-2  border border-[#DDD5DD] p-4 w-full h-fit">
        <div className="flex gap-2 items-center">
          <p className="text-sm text-gray-500">Sold by</p>
          <Link
            href={`/vendors/${product.vendor.id}`}
            className="hover:underline"
          >
            <div>
              <p className="text-xs text-gray-400">{product.vendor.shopId}</p>
            </div>
          </Link>
        </div>
        <Separator className="my-4" />
        <div className="flex flex-col gap-[5px]">
          {datas.map((data) => (
            <div className="" key={data.id}>
              <div className="flex gap-1 items-center">
                <p className="size-4">{data.icon}</p>
                <p className="h6-bold">{data.title}</p>
              </div>
              <p className="h6-light">{data.description}</p>
            </div>
          ))}
        </div>
        <Separator className="mt-4 mb-2" />
        <AddToCart
          item={{
            clientId: generateId(),
            product: product._id || "",
            name: product.name,
            slug: product.slug,
            category: product.category,
            price: selectedOptionData?.price ?? product.price,
            quantity: 1,
            image: product.images[0],
            options: product.options,
            option: selectedOptionData ? {
              name: selectedOptionData.name,
              price: selectedOptionData.price,
              image: selectedOptionData.image,
            } : undefined,
            selectedOption: selectedOptionData?.name,
            // vendor: product.vendor.id,
            // vendorDisplayName: product.vendor.displayName,
          }}
        />
        <div className="pt-[8px] w-full">
          <ShareLike product={product} />
        </div>
      </div>
    </div>
  );
}