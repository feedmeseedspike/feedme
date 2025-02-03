import React from "react";
import { getProductBySlug } from "src/lib/actions/product.actions";
import ProductGallery from "@components/shared/product/product-gallery";
import Image from "next/image";
import Container from "@components/shared/Container";
import RatingSummary from "@components/shared/product/rating-summary";
import { Separator } from "@components/ui/separator";

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
  return (
    <section>
      <Container>
        <div className="py-4 grid grid-cols-1 md:grid-cols-5 gap-8 ">
          <div className="col-span-2">
            <Image
              src={product.images[0]}
              width={450}
              height={510}
              alt={product.name}
              className="bg-gray-300 w-[28rem] h-[32rem] "
            />
          </div>
          <div className="col-span-2">
            <h1 className="text-2xl">{product.name}</h1>
            <RatingSummary
              avgRating={product.avgRating}
              numReviews={product.numReviews}
              asPopover
              ratingDistribution={product.ratingDistribution}
            />
            <p className="text-[#12B76A] text-[14px] border py-1 px-2 border-[#12B76A] w-fit">
              Freshness Guarantee
            </p>
            <p className="text-[12px] pt-2">90k brought in past month</p>
            <Separator className="mt-4 mb-2" />
            <div className="flex flex-col gap-2">
              <p className="h4-bold">Variation: Grade A</p>
              <ProductGallery images={product.images} />
            </div>
          </div>
          <div className="col-span-1"></div>
        </div>
      </Container>
    </section>
  );
};

export default ProductDetails;
