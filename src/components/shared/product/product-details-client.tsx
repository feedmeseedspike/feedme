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
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "src/store";
import Link from "next/link";
import { setSelectedOption } from "src/store/features/optionsSlice";
import { useToast } from "src/hooks/useToast";
import { useCartQuery } from "src/queries/cart";
import { Button } from "@components/ui/button";
import { useUser } from "src/hooks/useUser";
import { useRouter } from "next/navigation";

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
  list_price?: number;
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
    countInStock?: number | null;
    list_price?: number;
  };
  cartItemId: string;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { data: cartItems } = useCartQuery();
  const user = useUser();
  const router = useRouter();

  const selectedOption = useSelector((state: RootState) =>
    product._id ? state.options.selectedOptions[product._id] : undefined
  );

  const optionsArr = useMemo(
    () => (Array.isArray(product.options) ? product.options : []),
    [product.options]
  );

  const selectedOptionData = useMemo(() => {
    if (optionsArr.length === 0) return null;
    if (!selectedOption) {
      return optionsArr[0];
    }
    const option = optionsArr.find((opt) => opt.name === selectedOption);
    return option || optionsArr[0];
  }, [selectedOption, optionsArr]);

  useEffect(() => {
    if (product._id && optionsArr.length > 0 && !selectedOption) {
      dispatch(
        setSelectedOption({
          productId: product._id,
          option: optionsArr[0].name,
        })
      );
    }
  }, [product._id, optionsArr, selectedOption, dispatch]);

  // Check if the current product is in cart
  const isInCart = useMemo(() => {
    if (!product._id || !cartItems) return false;
    return cartItems.some(
      (item) =>
        item.product_id === product._id &&
        JSON.stringify(item.option || null) ===
          JSON.stringify(selectedOptionData || null)
    );
  }, [product._id, cartItems, selectedOptionData]);

  // Compute images to display based on selected option
  const imagesToDisplay = useMemo(() => product.images, [product.images]);

  const handleImageSelect = (index: number) => {
    setSelectedImageIndex(index);
  };

  const handleOptionChange = useCallback(
    (value: string) => {
      if (product._id) {
        dispatch(
          setSelectedOption({
            productId: product._id,
            option: value,
          })
        );
      }
    },
    [dispatch, product._id]
  );

  return (
    <div className="py-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-8 bg-white my-6 p-3">
      <div className="col-span-3">
        <ProductGalleryWrapper
          images={imagesToDisplay}
          name={product.name}
          selectedIndex={selectedImageIndex}
        />
      </div>

      <div className="col-span-3">
        <h1 className="text-2xl">{product.name}</h1>
        {/* Product Price */}
        {optionsArr.length > 1 ? (
          <div className="mt-2 mb-1">
            <p className="text-2xl font-bold text-[#1B6013] inline-block">
              ₦
              {Math.min(...optionsArr.map((opt) => opt.price)).toLocaleString()}{" "}
              - ₦
              {Math.max(...optionsArr.map((opt) => opt.price)).toLocaleString()}
            </p>
            {(() => {
              const minList = Math.min(
                ...optionsArr.map((opt) => opt.list_price ?? opt.price)
              );
              const maxList = Math.max(
                ...optionsArr.map((opt) => opt.list_price ?? opt.price)
              );
              const minPrice = Math.min(...optionsArr.map((opt) => opt.price));
              const maxPrice = Math.max(...optionsArr.map((opt) => opt.price));
              if (minList > minPrice || maxList > maxPrice) {
                return (
                  <span className="ml-2 text-lg text-gray-400 line-through align-middle">
                    ₦{minList.toLocaleString()} - ₦{maxList.toLocaleString()}
                  </span>
                );
              }
              return null;
            })()}
          </div>
        ) : (
          <div className="mt-2 mb-1">
            <p className="text-2xl font-bold text-[#1B6013] inline-block">
              ₦{(selectedOptionData?.price ?? product.price).toLocaleString()}
            </p>
            {(() => {
              const listPrice =
                selectedOptionData?.list_price ?? product.list_price;
              const price = selectedOptionData?.price ?? product.price;
              if (listPrice && listPrice > price) {
                return (
                  <span className="ml-2 text-lg text-gray-400 line-through align-middle">
                    ₦{listPrice.toLocaleString()}
                  </span>
                );
              }
              return null;
            })()}
          </div>
        )}
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
            {imagesToDisplay.map((image, index) => (
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
        {optionsArr.length > 0 && (
          <Options
            options={optionsArr}
            selectedOption={selectedOptionData?.name}
            onOptionChange={handleOptionChange}
          />
        )}
      </div>

      {/* Add to Cart Section */}
      <div className="col-span-1 md:col-span-6 lg:col-span-2  border border-[#DDD5DD] p-4 w-full h-fit">
        {/* <div className="flex gap-2 items-center">
          <p className="text-sm text-gray-500">Sold by</p>
          <Link
            href={`/vendors/${product.vendor.id}`}
            className="hover:underline"
          >
            <div>
              <p className="text-xs text-gray-400">{product.vendor.shopId}</p>
            </div>
          </Link>
        </div> */}
        {/* <Separator className="my-4" /> */}
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
            id: product._id || "",
            name: product.name,
            slug: product.slug,
            category: product.category,
            price: selectedOptionData?.price ?? product.price,
            images: product.images,
            countInStock: product.countInStock,
            options: optionsArr,
            option: selectedOptionData,
            selectedOption: selectedOptionData?.name,
          }}
          onAuthRequired={() => {
            showToast("Please log in to add items to cart", "error");
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                window.location.pathname
              )}`
            );
          }}
        />
        {isInCart && user && (
          <Link href="/cart" className="w-full">
            <Button className="w-full mt-4 bg-[#DDD5DD] hover:bg-[#DDD5DD]/90 text-black flex items-center gap-2">
              {/* <ShoppingCart className="size-4" /> */}
              View Cart
            </Button>
          </Link>
        )}
        <div className="pt-[8px] w-full">
          <ShareLike product={{ ...product, id: product._id }} />
        </div>
      </div>
    </div>
  );
}
