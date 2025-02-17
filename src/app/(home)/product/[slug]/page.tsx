import React from "react";
import { getProductBySlug } from "src/lib/actions/product.actions";
import ProductGallery from "@components/shared/product/product-gallery";
import Image from "next/image";
import Container from "@components/shared/Container";
import RatingSummary from "@components/shared/product/rating-summary";
import { Separator } from "@components/ui/separator";
import { Label } from "@components/ui/label";
import { RadioGroup, RadioGroupItem } from "@components/ui/radio-group";
import { formatNaira, generateId } from "src/lib/utils";
import ReviewList from "src/app/(home)/product/[slug]/review-list";
import AddToCart from "@components/shared/product/add-to-cart";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import ShareLike from "@components/shared/product/product-shareLike";

const datas = [
  {
    id: 1,
    icon: "",
    title: "Fast Delivery",
    description: "Get your order at your doorstep in 3 hours or less",
  },
  {
    id: 1,
    icon: "",
    title: "Fast Delivery",
    description: "Get your order at your doorstep in 3 hours or less",
  },
];

const ProductDetails = async (props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page: string; color: string; size: string }>;
}) => {
  const searchParams = await props.searchParams;

  const { page, color, size } = searchParams;

  const params = await props.params;

  const { slug } = params;

  // const session = await auth()

  const product = getProductBySlug(slug);
  console.log(product)

  const totalRatings = product.ratingDistribution.reduce(
    (acc, { count }) => acc + count,
    0
  );

  return (
    <section>
      <Container>
        <div className="py-4 grid grid-cols-1 md:grid-cols-8 gap-8 bg-white my-6 p-3">
          <div className="col-span-3 w-full md:h-auto">
            <Image
              src={product.images[0]}
              width={450}
              height={510}
              alt={product.name}
              className="bg-gray-300 w-full"
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
            <p className="text-[#12B76A] text-[14px] border py-1 px-2 border-[#12B76A] w-fit">
              Freshness Guarantee
            </p>
            <p className="text-[12px] pt-2">90k+ brought in past month</p>
            <Separator className="mt-4 mb-2" />
            <div className="flex flex-col gap-2">
              <p className="h4-bold">Variation: Grade A</p>
              <ProductGallery images={product.images} />
            </div>
            <Separator className="mt-4 mb-2" />
            {/* Select Option */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-[10px]">
                <p className="h4-bold">Select Option</p>
                <p className="text-[#B54708] text-xs font-semibold bg-[#FFFAEB] py-1 px-2 rounded-[16px] flex items-center">
                  Required
                </p>
              </div>
              <RadioGroup>
                {product.options?.map((option) => (
                  <div
                    key={option.name}
                    className="flex items-center justify-between"
                  >
                    <Label
                      htmlFor={option.name}
                      className="flex items-center gap-4"
                    >
                      <Image
                        width={54}
                        height={54}
                        src={option.image}
                        alt={option.name}
                        className="size-[54px] rounded-[5px] border-[0.31px] border-[#81a6e2]"
                      />
                      <div className="flex flex-col gap-[4px]">
                        <p className="h4-bold">{option.name}</p>
                        <p>{formatNaira(option.price)}</p>
                      </div>
                    </Label>
                    <RadioGroupItem value={option.name} id={option.name} />
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
          <div className="col-span-2 border border-[#DDD5DD] p-4 w-full h-fit">
            <div className="">
              <p className="h6-bold">
                Sold by
                {/* <span className="h6-light">
            {product?.seller ?? "Unknown Seller"}
          </span> */}
              </p>
            </div>
            <Separator className="my-4" />
            <div className="flex flex-col gap-[5px]">
              {datas.map((data) => (
                <div className="" key={data.id}>
                  <p className="h6-bold">{data.title}</p>
                  <p className="h6-light">{data.description}</p>
                </div>
              ))}
            </div>
            <Separator className="mt-4 mb-2" />
            <AddToCart
              item={{
                clientId: generateId(),
                product: product?._id || "",
                name: product.name,
                slug: product.slug,
                category: product.category,
                price: product.price,
                quantity: 1,
                image: product.images[0],
                // options: product.options,
              }}
            />
            <div className="pt-[8px]  w-full">
              <ShareLike product={product} />
            </div>
          </div>
        </div>
        <div className="bg-white my-6 p-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Product Description</AccordionTrigger>
              <AccordionContent>{product.description}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other
                components&apos; aesthetic.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <Separator className="mt-2" />
        <section className="mt-6">
          <h2 className="h2-bold mb-2" id="reviews">
            Customer Reviews ({totalRatings})
          </h2>
          <ReviewList product={product} />
        </section>
      </Container>
    </section>
  );
};
export default ProductDetails;
