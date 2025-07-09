import React from "react";
import {
  getProductBySlug,
  getRelatedProductsByCategory,
} from "src/lib/actions/product.actions";
import ProductGalleryWrapper from "@components/shared/product/gallery-wrapper";
import Container from "@components/shared/Container";
import RatingSummary from "@components/shared/product/rating-summary";
import { Separator } from "@components/ui/separator";
import { formatNaira, generateId, toSlug } from "src/lib/utils";
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
import Link from "next/link";
import { getAllCategoriesQuery } from "src/queries/categories";
import { createServerComponentClient } from "src/utils/supabase/server";
import { Tables } from "src/utils/database.types";
import {
  getAlsoViewedProducts,
  getAlsoBoughtProducts,
} from "src/queries/products";
import { IProductInput } from "src/types";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import Head from "next/head";

type ProductType = Tables<"products">;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  try {
    const product = await getProductBySlug(slug);

    if (product) {
      return {
        title: product.name,
        description: `${
          product.description || ""
        } Buy fresh and premium-quality ${
          product.name
        } online at FeedMe Nigeria today. Enjoy competitive prices in Naira, swift delivery, and the convenience of cash on delivery. Shop now and bring nature's goodness to your kitchen!`,
        openGraph: {
          title: product.name,
          description: product.description || "",
          images: product.images?.[0] || "/logo.png",
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
  const { page } = searchParams;

  const params = await props.params;
  const { slug } = params;

  const user = await getUser();
  const product: ProductType = await getProductBySlug(slug);

  if (!product) {
    return (
      <section>
        <Container>
          <h1 className="h2-bold text-center">Product Not Found</h1>
          <p className="text-center">
            The product you are looking for does not exist or has been removed.
          </p>
        </Container>
      </section>
    );
  }

  const supabase = await createServerComponentClient();
  const { data: categoriesData } =
    await getAllCategoriesQuery(supabase).select("id, title");

  const productCategory = categoriesData?.find(
    (cat) => cat.id === product.category_ids?.[0]
  );

  const cartItemId = generateId();

  const ratingDistArr = Array.isArray(product.rating_distribution)
    ? (product.rating_distribution as { count: number }[]).filter(Boolean)
    : [];
  const totalRatings = ratingDistArr.reduce(
    (acc: number, curr: any) =>
      acc + (typeof curr?.count === "number" ? curr.count : 0),
    0
  );

  const relatedProducts = await getRelatedProductsByCategory({
    category: product.category_ids?.[0] || "",
    productId: product.id,
    page: Number(page || "1"),
  });

  let alsoViewedProducts: IProductInput[] = [];
  try {
    const rawAlsoViewedProducts = await getAlsoViewedProducts(
      supabase,
      product.id
    );
    if (rawAlsoViewedProducts) {
      alsoViewedProducts = rawAlsoViewedProducts.map((p) =>
        mapSupabaseProductToIProductInput(p, categoriesData as CategoryData[])
      );
    }
  } catch (error) {
    console.error("Error fetching also viewed products:", error);
  }

  let alsoBoughtProducts: IProductInput[] = [];
  try {
    const rawAlsoBoughtProducts = await getAlsoBoughtProducts(
      supabase,
      product.id
    );
    if (rawAlsoBoughtProducts) {
      alsoBoughtProducts = rawAlsoBoughtProducts.map((p) =>
        mapSupabaseProductToIProductInput(p, categoriesData as CategoryData[])
      );
    }
  } catch (error) {
    console.error("Error fetching also bought products:", error);
  }

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
            image: product.images?.[0],
            description: product.description,
            // brand: {
            //   "@type": "Brand",
            //   name: product.brand || "FeedMe",
            // },
            offers: {
              "@type": "Offer",
              url: `${siteUrl}/product/${product.slug}`,
              priceCurrency: "NGN",
              price: product.price,
              availability:
                (product.countInStock ?? 0) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              seller: {
                "@type": "Organization",
                name: "FeedMe Nigeria",
              },
            },
            twitter: {
              card: "summary_large_image",
              title: product.name,
              description: product.description || "",
              images: product.images?.[0] || "/logo.png",
            },
            alternates: {
              canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
            },
            openGraph: {
              title: product.name,
              description: product.description || "",
              images: product.images?.[0] || "/logo.png",
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
              type: "product",
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

  // Ensure options is ProductOption[] and filter out nulls
  const productOptions = Array.isArray(product.options)
    ? (product.options as any[]).filter(Boolean)
    : [];

  return (
    <>
      <Head>
        <ProductJsonLd
          product={{
            name: product.name || "",
            images: product.images || [],
            description: product.description || "",
            brand: product.brand || undefined,
            slug: product.slug || "",
            price: product.price || 0,
            countInStock: product.count_in_stock || 0,
            numReviews: product.num_reviews || 0,
            avgRating: product.avg_rating || 0,
          }}
        />
      </Head>
      <section>
        <Container>
          {/* {productCategory && (
          <div className="mb-4 text-sm text-gray-500">
            <Link href={`/categories`} className="hover:underline">
              Categories
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/category/${toSlug(productCategory.title)}`}
              className="hover:underline"
            >
              {productCategory.title}
            </Link>
            <span className="mx-2">/</span>
            <span>{product.name}</span>
          </div>
        )} */}
          <AddToBrowsingHistory
            id={product.id!}
            category={product.category_ids || []}
          />
          <ProductDetailsClient
            product={{
              _id: product.id,
              name: product.name,
              images: product.images || [],
              avgRating: product.avg_rating || 0,
              numReviews: product.num_reviews || 0,
              ratingDistribution: ratingDistArr,
              options: productOptions,
              slug: product.slug,
              category: product.category_ids?.[0] || "",
              price: product.price || 0,
              vendor: {
                id: product.vendor_id || "",
                shopId: (product as any).vendor_shopId || "",
                displayName: (product as any).vendor_displayName || "",
                logo: (product as any).vendor_logo || "",
              },
            }}
            cartItemId={cartItemId}
          />

          {/* Product Description and Reviews */}
          <div className="bg-white my-6 p-3">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="!border-none">
                <AccordionTrigger>Product Description</AccordionTrigger>
                <AccordionContent>{product.description || ""}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
          <Separator className="mt-2" />
          <section className="mt-6">
            <h2 className="h2-bold mb-2" id="reviews">
              Customer Reviews (
              {typeof totalRatings === "number" ? totalRatings : 0})
            </h2>
            <ReviewList product={product} />
          </section>
          {/* <section className="mt-10">
          <ProductSlider
            products={relatedProducts.data || []}
            title={"You may also like"}
          />
        </section> */}
          {alsoViewedProducts.length > 0 && (
            <section className="mt-10">
              <ProductSlider
                products={alsoViewedProducts}
                title={"Customers who viewed this item also viewed"}
              />
            </section>
          )}
          {alsoBoughtProducts.length > 0 && (
            <section className="mt-10">
              <ProductSlider
                products={alsoBoughtProducts}
                title={"Customers who bought this item also bought"}
              />
            </section>
          )}
          <section>
            <BrowsingHistoryList className="mt-10" />
          </section>
        </Container>
      </section>
    </>
  );
};
export default ProductDetails;
