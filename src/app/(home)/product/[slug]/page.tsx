import React from 'react';
import { getProductBySlug } from 'src/lib/actions/product.actions';
import ProductGalleryWrapper from '@components/shared/product/gallery-wrapper';
import Container from '@components/shared/Container';
import RatingSummary from '@components/shared/product/rating-summary';
import { Separator } from '@components/ui/separator';
import { formatNaira, generateId } from 'src/lib/utils';
import ReviewList from 'src/app/(home)/product/[slug]/review-list';
import AddToCart from '@components/shared/product/add-to-cart';
import FastDelivery from '@components/icons/fastDelivery.svg';
import Security from '@components/icons/security.svg';
import Freshness from '@components/icons/freshness.svg';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@components/ui/accordion';
import ShareLike from '@components/shared/product/product-shareLike';
import { getUser } from 'src/lib/actions/auth.actions';
import AddToBrowsingHistory from '@components/shared/product/add-to-browsing-history';
import BrowsingHistoryList from '@components/shared/browsing-history-list';
import Options from '../options';

const datas = [
  {
    id: 1,
    icon: <FastDelivery />,
    title: 'Fast Delivery',
    description: 'Get your order at your doorstep in 3 hours or less.',
  },
  {
    id: 2,
    icon: <Security />,
    title: 'Security & Privacy',
    description:
      'Safe payments: We do not share your personal details with any third parties without your consent.',
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

  const user = await getUser();
  const product = getProductBySlug(slug);

  const totalRatings = product.ratingDistribution.reduce(
    (acc, { count }) => acc + count,
    0
  );

  return (
    <section>
      <Container>
        <AddToBrowsingHistory id={product._id!} category={product.category} />
        <div className="py-4 grid grid-cols-1 md:grid-cols-8 gap-8 bg-white my-6 p-3">
          <div className="col-span-3">
            <ProductGalleryWrapper images={product.images} name={product.name} />
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
            </div>
            <Separator className="mt-4 mb-2" />
            <Options options={product.options} />
          </div>

          {/* Add to Cart Section */}
          <div className="col-span-2 border border-[#DDD5DD] p-4 w-full h-fit">
            <div className="">
              <p className="h6-bold">Sold by</p>
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
                product: product?._id || '',
                name: product.name,
                slug: product.slug,
                category: product.category,
                price: product.price,
                quantity: 1,
                image: product.images[0],
                options: product.options,
              }}
            />
            <div className="pt-[8px] w-full">
              <ShareLike product={product} />
            </div>
          </div>
        </div>

        {/* Product Description and Reviews */}
        <div className="bg-white my-6 p-3">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Product Description</AccordionTrigger>
              <AccordionContent>{product.description}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <Separator className="mt-2" />
        <section className="mt-6">
          <h2 className="h2-bold mb-2" id="reviews">
            Customer Reviews ({totalRatings})
          </h2>
          <ReviewList userId={user?.data?._id} product={product} />
        </section>
        <section>
          <BrowsingHistoryList className="mt-10" />
        </section>
      </Container>
    </section>
  );
};

export default ProductDetails;