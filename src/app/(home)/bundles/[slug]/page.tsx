export const dynamic = "force-dynamic";

import Image from "next/image";
import { formatNaira, toSlug } from "src/lib/utils";
import { Tables } from "@utils/database.types";
import { notFound } from "next/navigation";
import BundleAddToCartButton from "./BundleAddToCartButton";
import { createClient } from "@utils/supabase/server";
import { RichTextDisplay } from "@components/ui/rich-text-editor";
import Container from "@components/shared/Container";
import { Separator } from "@components/ui/separator";
import FastDelivery from "@components/icons/fastDelivery.svg";
import Security from "@components/icons/security.svg";
import Freshness from "@components/icons/freshness.svg";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@components/ui/accordion";
import ShareLike from "@components/shared/product/product-shareLike";
import RatingSummary from "@components/shared/product/rating-summary";
import { getUser } from "src/lib/actions/auth.actions";
import BundleShareLikeClient from "./BundleShareLike";
import BundleReviews from "./BundleReviews";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import BundleSlider from "@components/shared/bundles/bundle-slider";

interface BundleDetailPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({
  params,
}: BundleDetailPageProps) {
  const { slug } = params;

  try {
    const supabase = await createClient();
    
    // Get bundle for metadata
    const { data: allBundles } = await supabase
      .from('bundles')
      .select('*');

    const matchingBundle = allBundles?.find(bundle => {
      if (!bundle.name) return false;
      const bundleSlug_generated = toSlug(bundle.name);
      return bundleSlug_generated === slug;
    });

    if (matchingBundle) {
      return {
        title: matchingBundle.name,
        description: `${matchingBundle.description || ""} Get this amazing bundle with premium items delivered in 4-6 hours in Lagos. FeedMe bundles offer great value with fresh, quality products.`,
        alternates: {
          canonical: `https://shopfeedme.com/bundles/${slug}`,
        },
        openGraph: {
          title: matchingBundle.name,
          description: matchingBundle.description || "",
          images: matchingBundle.thumbnail_url || "/opengraph-image.jpg",
          url: `https://shopfeedme.com/bundles/${slug}`,
        },
        twitter: {
          card: "summary_large_image",
          title: matchingBundle.name,
          description: matchingBundle.description || "",
          images: [matchingBundle.thumbnail_url || "/opengraph-image.jpg"],
        },
      };
    }
  } catch (error) {
    console.error("Error fetching bundle metadata:", error);
  }

  return {
    title: "Bundle Not Found",
    description: "The bundle you are looking for does not exist.",
    alternates: {
      canonical: `https://shopfeedme.com/bundles/${slug}`,
    },
    openGraph: {
      title: "Bundle Not Found",
      description: "The bundle you are looking for does not exist.",
      images: "/logo.png",
    },
  };
}

export default async function BundleDetailPage({ params }: BundleDetailPageProps) {
  try {
    const supabase = await createClient();
    const user = await getUser();
    
    // First, try to get all bundles and find the one that matches the slug
    const { data: allBundles, error: fetchError } = await supabase
      .from('bundles')
      .select('*');

    if (fetchError) {
      throw fetchError;
    }

    // Find the bundle whose name, when converted to slug, matches the provided slug
    const matchingBundle = allBundles?.find(bundle => {
      if (!bundle.name) return false;
      const bundleSlug_generated = toSlug(bundle.name);
      return bundleSlug_generated === params.slug;
    });

    if (!matchingBundle) {
      notFound();
    }

    // Now fetch the bundle with its bundle_products (without nested products)
    const { data: bundle, error } = await supabase
      .from('bundles')
      .select(
        `
        *,
        bundle_products (
          product_id
        )
        `
      )
      .eq('id', matchingBundle.id)
      .single(); // Expecting a single bundle

    if (error) {
      throw error;
    }

    // Extract product IDs
    const productIds = bundle.bundle_products?.map((bp: any) => bp.product_id).filter(Boolean) || [];

    // Fetch products manually
    let linkedProducts: Tables<'products'>[] = [];
    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (productsError) {
        console.error("Error fetching linked products:", productsError);
      } else {
        linkedProducts = products || [];
      }
    }

    // Transform the data structure
    const transformedBundle = {
      ...bundle,
      products: linkedProducts
    };

    if (!transformedBundle) {
      notFound();
    }

    // Fetch related bundles (excluding current bundle)
    const { data: relatedBundlesData } = await supabase
      .from('bundles')
      .select('*')
      .neq('id', transformedBundle.id)
      .eq('published_status', 'published')
      .limit(6);

    const relatedBundles = relatedBundlesData || [];

    const datas = [
      {
        id: 1,
        icon: <FastDelivery />,
        title: "Fast Delivery",
        description: "Get your bundle at your doorstep in 3 hours or less.",
      },
      {
        id: 2,
        icon: <Security />,
        title: "Security & Privacy",
        description: "Safe payments: We do not share your personal details with any third parties without your consent.",
      },
    ];

    return (
      <>
        <main>
          <div className="md:border-b shadow-sm">
            <div className="bg-white py-4">
              <Container>
                <CustomBreadcrumb />
              </Container>
            </div>
          </div>
        </main>
        <section>
          <Container>
            <div className="py-4 grid grid-cols-1 md:grid-cols-6 lg:grid-cols-8 gap-8 bg-white my-6 p-3">
            {/* Bundle Image Gallery */}
            <div className="col-span-3">
              <div className="relative w-full h-96 lg:h-[500px] rounded-lg overflow-hidden bg-gray-100">
                {transformedBundle.thumbnail_url ? (
                  <Image
                    src={transformedBundle.thumbnail_url}
                    alt={transformedBundle.name || "Bundle image"}
                    fill
                    style={{ objectFit: "cover" }}
                    className="rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-lg">No Image Available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bundle Details */}
            <div className="col-span-3">
              <h1 className="text-2xl font-bold mb-2">{transformedBundle.name}</h1>
              
              {/* Bundle Price */}
              <div className="mt-2 mb-1">
                <p className="text-2xl font-bold text-[#1B6013] inline-block">
                  {formatNaira(transformedBundle.price || 0)}
                </p>
                {(transformedBundle as any).discount_percentage && (
                  <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
                    Save {(transformedBundle as any).discount_percentage}%
                  </span>
                )}
              </div>

              {/* Bundle Status */}
              <p className="text-[#12B76A] text-[14px] border py-1 px-2 border-[#bfe0d0] w-fit flex gap-1 items-center mb-2">
                Bundle Package <Freshness className="size-4" />
              </p>
              
              <p className="text-[12px] pt-2 mb-4">
                Includes {transformedBundle.products?.length || 0} premium items
              </p>

              {/* Rating Summary */}
              <RatingSummary
                avgRating={transformedBundle.avg_rating || 0}
                numReviews={transformedBundle.num_reviews || 0}
                asPopover
                ratingDistribution={[]}
                showTotalCount={true}
              />

              <Separator className="mt-4 mb-2" />

              {/* Bundle Items Preview */}
              <div className="flex flex-col gap-2">
                <p className="h4-bold">What&apos;s Included:</p>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  {transformedBundle.products?.slice(0, 4).map((product: Tables<"products">, index: number) => (
                    <div
                      key={product.id}
                      className="shrink-0 w-16 h-16 border rounded-lg overflow-hidden"
                    >
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name || "Product"}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  ))}
                  {transformedBundle.products && transformedBundle.products.length > 4 && (
                    <div className="shrink-0 w-16 h-16 border rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{transformedBundle.products.length - 4}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator className="mt-4 mb-2" />
            </div>

            {/* Add to Cart Section */}
            <div className="col-span-1 md:col-span-6 lg:col-span-2 border border-[#DDD5DD] p-4 w-full h-fit">
              <div className="flex flex-col gap-[5px] mb-4">
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
              
              <BundleAddToCartButton bundle={transformedBundle} />
              
              <div className="pt-[8px] w-full">
                <BundleShareLikeClient bundle={transformedBundle} />
              </div>
            </div>
          </div>

          {/* Bundle Description */}
          {transformedBundle.description && (
            <div className="bg-white my-6 p-3">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1" className="!border-none">
                  <AccordionTrigger>Bundle Description</AccordionTrigger>
                  <AccordionContent>
                    <RichTextDisplay content={transformedBundle.description} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          <Separator className="mt-2" />
          <BundleReviews bundle={transformedBundle} />
          
          {/* Related Bundles */}
          {relatedBundles.length > 0 && (
            <section className="mt-10">
              <BundleSlider
                title="You may also like"
                bundles={relatedBundles}
                hideDetails={false}
                href="/bundles"
              />
            </section>
          )}
        </Container>
      </section>
      </>
    );
  } catch (error) {
    console.error("Error fetching bundle details:", error);
    notFound();
  }
}