import React from "react";
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from "src/lib/actions/product.actions";
import ProductGalleryWrapper from "@components/shared/product/gallery-wrapper";
import Container from "@components/shared/Container";
import RatingSummary from "@components/shared/product/rating-summary";
import { Separator } from "@components/ui/separator";
import { formatNaira, generateId } from "src/lib/utils";
import ReviewList from "src/app/(home)/product/[slug]/review-list";
import AddToCart from "@components/shared/product/add-to-cart";
import FastDelivery from "@components/icons/fastDelivery.svg";
import Security from "@components/icons/security.svg";
import Freshness from "@components/icons/freshness.svg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import { getUser } from "src/lib/actions/auth.actions";
import AddToBrowsingHistory from "@components/shared/product/add-to-browsing-history";
import BrowsingHistoryList from "@components/shared/browsing-history-list";
import Options from "../options";
import ProductSlider from "@components/shared/product/product-slider";
import Image from "next/image";
import ProductDetailsClient from "@components/shared/product/product-details-client";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  try {
    const product = await getProductBySlug(slug);
    console.log(product.id);

    if (product) {
      return {
        title: product.name,
        description: `${
          product.description || product.description.substring(0, 160)
        } Buy fresh and premium-quality ${
          product.name
        } online at FeedMe Nigeria today. Enjoy competitive prices in Naira, swift delivery, and the convenience of cash on delivery. Shop now and bring nature's goodness to your kitchen!`,
        openGraph: {
          title: product.name,
          description:
            product.description || product.description.substring(0, 160),
          images: product.images[0] || "/logo.png",
        },
      };
    }
  } catch (error) {
    console.error("Error fetching product metadata:", error);
  }

  return {
    title: "Product Not Found",
    description: "The product you are looking for does not exist.",
    openGraph: {
      title: "Product Not Found",
      description: "The product you are looking for does not exist.",
      images: "/logo.png",
    },
  };
}

const ProductDetails = async (props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page: string; color: string; size: string }>;
}) => {
  const searchParams = await props.searchParams;
  const { page, color, size } = searchParams;

  const params = await props.params;
  const { slug } = params;

  const user = await getUser();
  const product = await getProductBySlug(slug);
  // console.log(product);
  const cartItemId = generateId();

  const totalRatings = product.rating_distribution.reduce(
    (acc, { count }) => acc + count,
    0
  );

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category_ids[0],
    productId: product.id,
    page: Number(page || "1"),
  });

  // console.log(product.options);

  const ProductJsonLd = ({
    product,
  }: {
    product: {
      name: string;
      images: string[];
      description: string;
      brand?: string;
      slug: string;
      price: number;
      countInStock: number;
      numReviews: number;
      avgRating: number;
    };
  }) => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.name,
            image: product.images[0],
            description: product.description,
            brand: {
              "@type": "Brand",
              name: product.brand || "FeedMe",
            },
            offers: {
              "@type": "Offer",
              url: `${siteUrl}/product/${product.slug}`,
              priceCurrency: "NGN",
              price: product.price,
              availability:
                product.countInStock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: "FeedMe Nigeria",
              },
            },
            aggregateRating:
              product.numReviews > 0
                ? {
                    "@type": "AggregateRating",
                    ratingValue: product.avgRating,
                    reviewCount: product.numReviews,
                  }
                : undefined,
          }),
        }}
      />
    );
  };
  return (
    <section>
      <Container>
        <AddToBrowsingHistory
          id={product.id!}
          category={product.category_ids}
        />
        <ProductDetailsClient
          product={{
            _id: product.id,
            name: product.name,
            images: product.images,
            avgRating: product.avg_rating,
            numReviews: product.num_reviews,
            ratingDistribution: product.rating_distribution,
            options: product.options,
            slug: product.slug,
            category: product.category_ids[0],
            price: product.price,
            vendor: {
              id: product.vendor_id,
              shopId: product.vendor_shopId,
              displayName: product.vendor_displayName,
              logo: product.vendor_logo,
            },
          }}
          cartItemId={cartItemId}
        />

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
          <ReviewList userId={user?.id} product={product} />
        </section>
        <section className="mt-10">
          <ProductSlider
            products={relatedProducts.data}
            title={"You may also like"}
          />
        </section>
        <section>
          <BrowsingHistoryList className="mt-10" />
        </section>
      </Container>
    </section>
  );
};
export default ProductDetails;
