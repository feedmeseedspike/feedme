import React from "react";
import {
  getProductBySlug,
  getRelatedProductsByCategory,
  getRelatedProducts,
} from "src/lib/actions/product.actions";
import ProductGalleryWrapper from "@components/shared/product/gallery-wrapper";
import { Tables } from "@/utils/database.types";

type Category = Tables<"categories">;
type ProductType = Tables<"products">;
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
import {
  getAlsoViewedProducts,
  getAlsoBoughtProducts,
} from "src/queries/products";
import { IProductInput } from "src/types";
import { mapSupabaseProductToIProductInput, CategoryData } from "src/lib/utils";
import Head from "next/head";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  try {
    const product = await getProductBySlug(slug);

    if (product) {
      const normalizeImage = (img: any): string | null => {
        if (typeof img === "string" && img.trim().length > 0) {
          if (
            img.startsWith("http://") ||
            img.startsWith("https://") ||
            img.startsWith("/")
          ) {
            return img;
          }
          try {
            const parsed = JSON.parse(img);
            if (parsed && typeof parsed === "object" && typeof parsed.url === "string") {
              return parsed.url;
            }
          } catch {
            return null;
          }
        } else if (img && typeof img === "object" && typeof (img as any).url === "string") {
          return (img as any).url;
        }
        return null;
      };
      const metaImage =
        (Array.isArray(product.images) && normalizeImage(product.images[0])) ||
        "/opengraph-image.jpg";

      const description =
        product.meta_description ||
        `${product.description || ""} Buy fresh and premium-quality ${
          product.name
        } online in Lagos with FeedMe. Enjoy competitive prices in Naira, swift delivery in Lagos, and the convenience of cash on delivery. Shop now and bring nature's goodness to your kitchen in Lagos, Ikeja, Lekki, Victoria Island, and more!`;

      return {
        title: product.name,
        description: description,
        alternates: {
          canonical: `https://shopfeedme.com/product/${slug}`,
        },
        openGraph: {
          title: product.name,
          description: description,
          images: metaImage,
          url: `https://shopfeedme.com/product/${slug}`,
        },
        twitter: {
          card: "summary_large_image",
          title: product.name,
          description: description,
          images: [metaImage],
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

  if (!product || (product.slug && product.slug !== slug)) {
    return notFound();
  }

  const supabase = await createServerComponentClient();
  const { data: categoriesData } =
    await getAllCategoriesQuery(supabase).select("id, title");

  const productCategory = categoriesData?.find(
    (cat: any) => cat.id === product.category_ids?.[0]
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
    limit: 12,
  });

  let alsoViewedProducts: IProductInput[] = [];
  try {
    const rawAlsoViewedProducts = await getAlsoViewedProducts(
      supabase,
      product.id
    );
    if (rawAlsoViewedProducts) {
      alsoViewedProducts = rawAlsoViewedProducts.map((p: ProductType) =>
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
      alsoBoughtProducts = rawAlsoBoughtProducts.map((p: ProductType) =>
        mapSupabaseProductToIProductInput(p, categoriesData as CategoryData[])
      );
    }
  } catch (error) {
    console.error("Error fetching also bought products:", error);
  }

  let linkedBundles: any[] = [];
  try {
    const rawLinkedBundles = await getRelatedProducts(product.id);
    if (rawLinkedBundles) {
      linkedBundles = rawLinkedBundles;
    }
  } catch (error) {
    console.error("Error fetching related bundles:", error);
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
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/logo.png",
            description: product.description || "",
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
              images: Array.isArray(product.images) && product.images.length > 0 ? [product.images[0]] : ["/logo.png"],
            },
            alternates: {
              canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`,
            },
            openGraph: {
              title: product.name,
              description: product.description || "",
              images: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "/logo.png",
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

  // Helpers to sanitize image strings coming from DB
  const normalizeImage = (img: any): string | null => {
    const storageBase = process.env.NEXT_PUBLIC_SUPABASE_URL
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
      : null;
    if (typeof img === "string" && img.trim().length > 0) {
      // Allow absolute or site-root relative paths
      if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("/")) {
        return img;
      }
      // If it's a JSON string with url, attempt to parse
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
        if (storageBase) {
          return `${storageBase}${img.replace(/^\//, "")}`;
        }
        return null;
      }
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
    return null;
  };

  const safeImages = (() => {
    if (Array.isArray(product.images)) {
      const cleaned = product.images
        .map((img) => normalizeImage(img))
        .filter((u): u is string => typeof u === "string" && u.length > 0);
      return cleaned.length > 0 ? cleaned : ["/product-placeholder.png"];
    }
    return ["/product-placeholder.png"];
  })();

  // Sanitize linked recipes/bundles (images and slug)
  const safeRecipes =
    Array.isArray(linkedBundles) && linkedBundles.length > 0
      ? linkedBundles.map((recipe: any) => {
          const img =
            normalizeImage(recipe.image) ||
            normalizeImage(recipe.image_url) ||
            (Array.isArray(recipe.images)
              ? normalizeImage(recipe.images[0])
              : null) ||
            normalizeImage((recipe as any).thumbnail_url) ||
            "/product-placeholder.png";
          return {
            ...recipe,
            slug:
              recipe.slug ||
              (recipe.name ? toSlug(recipe.name) : recipe.id) ||
              recipe.id ||
              "",
            images: recipe.images || (img ? [img] : []),
            image: img,
          };
        })
      : [];

  // Handle both old array format and new object format for options
  const productOptions = (() => {
    const base =
      Array.isArray(product.options)
        ? (product.options as any[]).filter(Boolean)
        : product.options && typeof product.options === "object"
          ? (product.options as any).variations || []
          : [];
    return base.map((opt: any) => ({
      ...opt,
      image: normalizeImage(opt?.image) || "/product-placeholder.png",
    }));
  })();

  // Extract customizations from new format
  const productCustomizations = (() => {
    if (
      product.options &&
      typeof product.options === "object" &&
      !Array.isArray(product.options)
    ) {
      return (product.options as any).customizations || [];
    }
    return [];
  })();

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
              images: safeImages,
              avgRating: product.avg_rating || 0,
              numReviews: product.num_reviews || 0,
              ratingDistribution: ratingDistArr,
              options: productOptions,
              customizations: productCustomizations,
              slug: product.slug,
              category: product.category_ids?.[0] || "",
              price: product.price || 0,
              vendor: {
                id: product.vendor_id || "",
                shopId: (product as any).vendor_shopId || "",
                displayName: (product as any).vendor_displayName || "",
                logo: (product as any).vendor_logo || "",
              },
              in_season: product.in_season,
            }}
            cartItemId={cartItemId}
            recipes={safeRecipes}
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
          <section className="mt-10">
            <ProductSlider
              products={relatedProducts.data || []}
              title={"You may also like"}
            />
          </section>
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
