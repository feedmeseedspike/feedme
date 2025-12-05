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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { Label } from "@components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@components/ui/dialog";
import { formatNaira, toSlug } from "src/lib/utils";

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
  recipes,
}: {
  product: {
    _id?: string;
    name: string;
    images: string[];
    avgRating: number;
    numReviews: number;
    ratingDistribution: any;
    options?: ProductOption[];
    customizations?: Array<{
      id: string;
      label: string;
      type: "select" | "toggle";
      options: Array<{
        value: string;
        label: string;
        default: boolean;
      }>;
    }>;
    slug: string;
    category: string;
    price: number;
    list_price?: number;
    vendor: {
      id: string;
      shopId: string;
      displayName: string;
      logo?: string;
    };
    countInStock?: number | null;
    in_season?: boolean | null;
  };
  cartItemId: string;
  recipes?: any[];
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [customizationSelections, setCustomizationSelections] = useState<
    Record<string, string>
  >(() => {
    // Initialize with default values
    const defaultSelections: Record<string, string> = {};
    product.customizations?.forEach((customization) => {
      const defaultOption = customization.options.find((opt) => opt.default);
      if (defaultOption) {
        defaultSelections[customization.id] = defaultOption.value;
      }
    });
    return defaultSelections;
  });
  const dispatch = useDispatch();
  const { showToast } = useToast();
  const { data: cartItems } = useCartQuery();
  const user = useUser();
  const router = useRouter();

  const selectedOption = useSelector((state: RootState) =>
    product._id ? state.options.selectedOptions[product._id] : undefined
  );

  const sanitizeImage = useCallback(
    (img: any): string => {
      const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
        : null;

      if (typeof img === "string" && img.trim().length > 0) {
        // Accept only absolute URLs or root-relative paths; otherwise fallback
        if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) {
          return img;
        }
        // try parse json with url
        try {
          const parsed = JSON.parse(img);
          if (parsed && typeof parsed === "object" && typeof parsed.url === "string") {
            const url = parsed.url;
            if (
              url.startsWith("http://") ||
              url.startsWith("https://") ||
              url.startsWith("/")
            ) {
              return url;
            }
            if (storageBase) {
              return `${storageBase}${url.replace(/^\//, "")}`;
            }
          }
        } catch {
          /* ignore */
        }
        // Unknown/relative path: if we have storage base, prepend; else placeholder
        if (storageBase) {
          return `${storageBase}${img.replace(/^\//, "")}`;
        }
        return "/placeholder.png";
      } else if (img && typeof img === "object" && typeof (img as any).url === "string") {
        const url = (img as any).url;
        if (
          url.startsWith("http://") ||
          url.startsWith("https://") ||
          url.startsWith("/")
        ) {
          return url;
        }
        if (storageBase) {
          return `${storageBase}${url.replace(/^\//, "")}`;
        }
      }
      // fallback: product primary image or placeholder
      if (Array.isArray(product.images) && product.images[0]) {
        return typeof product.images[0] === "string"
          ? (product.images[0] as string)
          : "/placeholder.png";
      }
      return "/placeholder.png";
    },
    [product.images]
  );

  const optionsArr = useMemo(() => {
    // Handle both old array format and new object format for options
    if (Array.isArray(product.options)) {
      // Old format: options is array of variations
      return product.options.filter(Boolean).map((opt: any) => ({
        ...opt,
        image: sanitizeImage(opt?.image),
      }));
    } else if (product.options && typeof product.options === "object") {
      // New format: options is object with variations and customizations
      const vars = (product.options as any).variations || [];
      return vars.map((opt: any) => ({
        ...opt,
        image: sanitizeImage(opt?.image),
      }));
    }
    return [];
  }, [product.options, sanitizeImage]);

  const selectedOptionData = useMemo(() => {
    if (optionsArr.length === 0) return null;
    if (!selectedOption) {
      return optionsArr[0];
    }
    const option = optionsArr.find((opt: any) => opt.name === selectedOption);
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
              {Math.min(
                ...optionsArr.map((opt: any) => opt.price)
              ).toLocaleString()}{" "}
              - ₦
              {Math.max(
                ...optionsArr.map((opt: any) => opt.price)
              ).toLocaleString()}
            </p>
            {(() => {
              const minList = Math.min(
                ...optionsArr.map((opt: any) => opt.list_price ?? opt.price)
              );
              const maxList = Math.max(
                ...optionsArr.map((opt: any) => opt.list_price ?? opt.price)
              );
              const minPrice = Math.min(
                ...optionsArr.map((opt: any) => opt.price)
              );
              const maxPrice = Math.max(
                ...optionsArr.map((opt: any) => opt.price)
              );
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

        {/* Product Customizations */}
        {product.customizations && product.customizations.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Customize Your Order
            </h3>
            <div className="space-y-3">
              {product.customizations.map((customization) => (
                <div key={customization.id}>
                  <label className="text-xs font-medium text-gray-700 mb-2 block">
                    {customization.label}
                  </label>

                  {customization.type === "select" ? (
                    <Select
                      value={customizationSelections[customization.id] || ""}
                      onValueChange={(value) =>
                        setCustomizationSelections((prev) => ({
                          ...prev,
                          [customization.id]: value,
                        }))
                      }
                    >
                      <SelectTrigger className="w-full h-9 text-sm">
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                      <SelectContent>
                        {customization.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <RadioGroup
                      value={customizationSelections[customization.id] || ""}
                      onValueChange={(value) =>
                        setCustomizationSelections((prev) => ({
                          ...prev,
                          [customization.id]: value,
                        }))
                      }
                      className="flex flex-wrap gap-2"
                    >
                      {customization.options.map((option) => (
                        <Label
                          key={option.value}
                          htmlFor={`${customization.id}-${option.value}`}
                          className={`flex items-center px-3 py-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                            customizationSelections[customization.id] ===
                            option.value
                              ? "border-[#F0800F] bg-orange-50 text-[#F0800F]"
                              : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          <RadioGroupItem
                            value={option.value}
                            id={`${customization.id}-${option.value}`}
                            className="mr-2 w-3 h-3"
                          />
                          {option.label}
                        </Label>
                      ))}
                    </RadioGroup>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Recipes Section */}
        {recipes && recipes.length > 0 && (
          <div className="mt-4">
            <Separator className="mb-4" />
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Recipes
            </h3>
            <div className="flex flex-wrap gap-3">
              {recipes.slice(0, 4).map((recipe: any) => (
                <div key={recipe.id} className="w-20 group flex flex-col gap-1">
                  <div className="relative w-20 h-20">
                    <Link
                      href={`/bundle/${
                        recipe.slug ||
                        (recipe.name ? toSlug(recipe.name) : recipe.id) ||
                        ""
                      }`}
                      className="block w-full h-full rounded-lg overflow-hidden border border-gray-200 group-hover:border-[#F0800F] transition-colors"
                    >
                      <Image
                        src={sanitizeImage(
                          recipe.image ||
                            (Array.isArray(recipe.images) && recipe.images[0]) ||
                            recipe.image_url
                        )}
                        alt={recipe.name}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  </div>
                  <Link
                    href={`/bundle/${
                      recipe.slug ||
                      (recipe.name ? toSlug(recipe.name) : recipe.id) ||
                      ""
                    }`}
                  >
                    <p className="text-xs text-gray-600 truncate group-hover:text-[#F0800F]">
                      {recipe.name}
                    </p>
                  </Link>
                </div>
              ))}
              {recipes.length > 4 && (
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="w-20 h-20 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <span className="text-sm font-medium text-gray-600">
                        +{recipes.length - 4}
                      </span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Recipes</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                      {recipes.map((recipe: any) => (
                        <div
                          key={recipe.id}
                          className="group flex flex-col gap-2 relative"
                        >
                          <Link
                            href={`/bundle/${
                              recipe.slug ||
                              (recipe.name ? toSlug(recipe.name) : recipe.id) ||
                              ""
                            }`}
                            className="aspect-square rounded-lg overflow-hidden border border-gray-200 group-hover:border-[#F0800F] transition-colors relative block"
                          >
                            <Image
                              src={sanitizeImage(
                                recipe.image ||
                                  recipe.image_url ||
                                  (Array.isArray(recipe.images) && recipe.images[0])
                              )}
                              alt={recipe.name}
                              fill
                              className="object-cover"
                            />
                          </Link>
                          <Link
                            href={`/bundle/${
                              recipe.slug ||
                              (recipe.name ? toSlug(recipe.name) : recipe.id) ||
                              ""
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-gray-900 group-hover:text-[#F0800F] line-clamp-2">
                                {recipe.name}
                              </p>
                              <p className="text-sm font-bold text-[#1B6013]">
                                {formatNaira(recipe.price || 0)}
                              </p>
                            </div>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
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
            id: (product as any).id || (product as any)._id || "",
            name: product.name,
            slug: product.slug,
            category: product.category,
            price: selectedOptionData?.price ?? product.price,
            images: product.images,
            countInStock: product.countInStock,
            options: optionsArr,
            option: selectedOptionData,
            selectedOption: selectedOptionData?.name,
            customizations: customizationSelections,
            in_season: product.in_season,
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
