export const dynamic = "force-dynamic";
import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";

import Pagination from "@components/shared/pagination";
import {
  getProductsServer,
  getAllTags,
} from "../../../../lib/actions/product.actions";
import ProductSortSelector from "@components/shared/product/product-sort-selector";
import {
  getFilterUrl,
  toSlug,
  mapSupabaseProductToIProductInput,
} from "../../../../lib/utils";
import { Tables } from "@/utils/database.types";

type Category = Tables<"categories">;

import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
// import Headertags from "@components/shared/header/Headertags";
import { ProductSkeletonGrid } from "@components/shared/product/product-skeleton";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import ErrorBoundary from "@components/shared/ErrorBoundary";
import { getAllCategories } from "src/lib/api";
import Head from "next/head";
import { notFound } from "next/navigation";

type Product = Tables<"products">;

const sortOrders = [
  { value: "price-low-to-high", name: "Price: Low to high" },
  { value: "price-high-to-low", name: "Price: High to low" },
  { value: "newest-arrivals", name: "Newest arrivals" },
  { value: "avg-customer-review", name: "Avg. customer review" },
  { value: "best-selling", name: "Best selling" },
];

const CATEGORY_META_MAP: Record<string, { description: string; keywords: string[] }> = {
  fruits: {
    description: "buy all types of farm fresh fruits at the greatest price and get it delivered to your doorstep under 3hours!",
    keywords: ["pears", "mango", "orange", "lemon", "strawberry", "apple", "kiwi", "pomegranates", "pawpaw", "pineapple", "plum", "coconut", "watermelon", "grape", "agbalumo"]
  },
  tubers: {
    description: "select the finest yams, including abuja yam, all types of potatos; irish, sweet, cocoya, and get it delivered to your doorstep under 3hours!",
    keywords: ["yam", "tuber of yam", "potatos", "irish potatos", "cocoyam", "sweet potato"]
  },
  oils: {
    description: "the best cooking oil for your everyday consumption from Laziz to Kings oil and get it delivered under 3hours!",
    keywords: ["groundnut oil", "banga oil", "palm oil", "oyster oil", "sesame oil"]
  },
  "pantry-canned-goods": {
    description: "choose from our selection of canned meat and fish like hot dogs, corned beef, sardines and geisha alike, tin tomatoes and cooking butter, all great company of meals. Food that requires no cooking from top brands like Titus, Simas, Gino, Sunripe, Exeter, Honeywell, available in lagos",
    keywords: ["geisha", "semovita", "sardine", "canned fish", "caanned peas", "sweet corn", "canned corn"]
  },
  "soup-ingredients": {
    description: "choose from our array of local soup ingredients, like ogbono, banga, egusi, efo-riro, edikang ikong, and all native Nigeria soup you want to prepare. Available in lagos",
    keywords: ["oha soup", "gbegiri", "ogbono", "egusi", "banga", "periwinkles"]
  },
  "meat-poultry-seafood": {
    description: "protein cuts like chicken, pomo, crayfish, stockfish, all seafood including crabs and periwinkles, gizzard and other types for your meal are available in lagos",
    keywords: ["gizzard", "live-chicken", "orobo chicken", "frozen food", "crayfish", "stockfish", "sausage", "roundabout", "cow", "goat", "pomo", "catfish", "snail", "panla fish"]
  },
  vegetables: {
    description: "extensive selection of vegetables and soup tickners like ugu, scentleaf, water leaf, okazi and much more are available in lagos",
    keywords: ["broccoli", "beetroot", "kale", "lemon grass", "ugu", "okazi leaf", "moimoi leaf", "ewedu", "okro", "radish", "scent leaf", "waterleaf", "cabbage", "uziza", "bitterleaf"]
  },
  "grains-and-legumes": {
    description: "buy all types of grains and legumes including rice, beans, maize and more, and get it delivered to your doorstep under 3hours!",
    keywords: ["rice", "beans", "ofada", "maize", "millet", "guinea corn", "legumes", "grains"]
  },
  "spices-and-condiment": {
    description: "the best spices and condiments for your everyday cooking to add rich flavor to your meals, available in lagos and delivered under 3hours!",
    keywords: ["salt", "maggi", "curry", "thyme", "garlic", "ginger", "seasoning", "spices"]
  },
  general: {
    description: "shop for all your general grocery and household items at the best prices and get them delivered to your doorstep under 3hours in lagos!",
    keywords: ["grocery", "food", "supermarket", "household", "general items"]
  },
  "pepper-mix": {
    description: "buy freshly blended pepper mix perfect for your stews and soups, hygienically packaged and delivered to your doorstep under 3hours!",
    keywords: ["pepper mix", "blended pepper", "tatashe", "rodo", "shombo", "tomato mix", "stew mix"]
  },
  "seeds-and-nuts": {
    description: "choose from our selection of premium seeds and nuts, great for snacking and cooking, all available in lagos with delivery under 3hours!",
    keywords: ["groundnut", "cashew nuts", "walnut", "sesame seeds", "melon seeds", "nuts", "seeds"]
  },
  "herbal-teas": {
    description: "discover our range of soothing herbal teas for your wellness and refreshment, available in lagos and delivered to you under 3hours!",
    keywords: ["green tea", "hibiscus", "zobo", "ginger tea", "herbal tea", "slimming tea", "wellness"]
  }
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const categorySlug = params.slug.toLowerCase();
  
  // Re-fetch to get accurate titles for metadata
  const allCategories = await getAllCategories();
  const cat = allCategories.find((c: Category) => toSlug(c.title).toLowerCase() === categorySlug);
  
  if (!cat) {
    // Return a 404 directly from metadata generation to avoid Soft 404s in Google Search Console
    notFound();
  }
  
  const categoryName = cat.title;

  const categoryImage = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/category-images/${categorySlug}.jpg`
    : "/opengraph-image.jpg";

  const customMeta = CATEGORY_META_MAP[categorySlug];
  const description = customMeta 
    ? customMeta.description 
    : `Browse our selection of ${categoryName.toLowerCase()} products in Lagos, Nigeria. Find the best deals on ${categoryName} at FeedMe. Fast delivery in Lagos, Ikeja, Lekki, Victoria Island, and more!`;
    
  const keywords = customMeta
    ? customMeta.keywords
    : [
      `${categoryName}`,
      "food",
      "grocery",
      "online shopping",
      "delivery",
      `${categoryName} Lagos`,
      `${categoryName} delivery Lagos`,
      `${categoryName} Ikeja`,
      `${categoryName} Lekki`,
      `${categoryName} Victoria Island`,
    ];

  return {
    title: `${categoryName}`,
    description,
    keywords,
    alternates: {
      canonical: `https://www.shopfeedme.com/category/${categorySlug}`,
    },
    openGraph: {
      title: `${categoryName}`,
      description,
      type: "website",
      url: `https://www.shopfeedme.com/category/${categorySlug}`,
      images: [categoryImage || "/opengraph-image.jpg"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | FeedMe`,
      description,
      images: [categoryImage || "/opengraph-image.jpg"],
    },
  };
}

async function CategoryContent({
  categoryId,
  categoryName,
  sort,
  page,
  allCategories,
}: {
  categoryId: string;
  categoryName: string;
  sort: string;
  page: string;
  allCategories: any[];
}) {
  const data = await getProductsServer({
    category: categoryId,
    page: Number(page),
    sort,
    limit: 20,
  });

  const noResults = data.totalProducts === 0;

  return (
    <div className="space-y-4">
      <div className="font-medium text-lg bg-white rounded-md p-3 w-full">
        {`Showing ${data.from}-${data.to} of ${data.totalProducts} results`}
      </div>
      {data.products.length === 0 ? (
        <div className="text-2xl md:text-3xl font-semibold flex justify-center items-center pt-36">
          No product found
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          {data.products.map((product: Product) => (
            <ProductdetailsCard
              key={product.id}
              product={mapSupabaseProductToIProductInput(
                product,
                allCategories
              )}
            />
          ))}
        </div>
      )}
      {data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} />
      )}
    </div>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: {
    tag?: string;
    price?: string;
    rating?: string;
    sort?: string;
    page?: string;
  };
}) {
  const categorySlug = params.slug;
  const { sort = "best-selling", page = "1" } = searchParams;

  const allCategories = await getAllCategories();
  
  // Debug logging
  console.log(`[CategoryDebug] URL Slug: ${categorySlug}`);
  
  const categoryObj =
    allCategories.find((c: Category) => toSlug(c.title).toLowerCase() === categorySlug.toLowerCase()) ||
    allCategories.find((c: Category) =>
      c.title
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '') === categorySlug.toLowerCase()
    ) ||
    allCategories.find((c: Category) => {
        const normalizedTitle = c.title?.toLowerCase().replace(/[^a-z0-9]/g, '') || "";
        const normalizedSlug = categorySlug.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedTitle === normalizedSlug && normalizedTitle !== "";
    });

  if (!categoryObj) {
    console.error(`[CategoryError] Category not found for slug: ${categorySlug}. Checked ${allCategories.length} categories.`);
    return notFound();
  }

  const categoryId = categoryObj.id;
  const categoryName = categoryObj.title;

  const filterParams = {
    category: categoryName,
    sort,
    page,
    q: "all",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://shopfeedme.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: categoryObj.title,
        item: `https://shopfeedme.com/category/${categorySlug}`,
      },
    ],
  };
  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      </Head>
      <main>
        <div className="md:border-b shadow-sm">
          <div className="bg-white py-4">
            <Container>
              <CustomBreadcrumb hideCategorySegment={true} />
            </Container>
          </div>
          <Container>
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center">
                <h1 className="text-[#1B6013] text-2xl md:text-3xl !leading-5 font-bold">
                  {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                </h1>
              </div>
              <div className="flex items-center">
                <div className="rounded-2xl px-4">
                  <ProductSortSelector
                    sortOrders={sortOrders}
                    sort={sort}
                    params={filterParams}
                  />
                </div>
              </div>
            </div>
          </Container>
        </div>

        <Container className="py-8">
          <ErrorBoundary>
            <Suspense fallback={<ProductSkeletonGrid count={12} />}>
              <CategoryContent
                categoryId={categoryId}
                categoryName={categoryName}
                sort={sort}
                page={page}
                allCategories={allCategories}
              />
            </Suspense>
          </ErrorBoundary>
        </Container>
      </main>
    </>
  );
}
