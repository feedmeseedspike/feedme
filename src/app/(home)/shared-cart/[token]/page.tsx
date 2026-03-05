import { getSharedCart } from "src/lib/actions/shared-cart.actions";
import SharedCartClient from "./SharedCartClient";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: { token: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getSharedCart(params.token);

  if (!result.success || !result.items.length) {
    return {
      title: "Shared Cart | FeedMe",
      description: "This shared cart has expired or doesn't exist.",
    };
  }

  const itemCount = result.items.length;
  const subtotal = result.items.reduce(
    (acc, item) => acc + (item.price ?? 0) * item.quantity,
    0
  );

  const formattedSubtotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(subtotal);

  const firstItemImage = result.items.find(i => i.image)?.image || "https://feedme.ng/icon.png";

  return {
    title: `Shared Cart: ${itemCount} Item${itemCount === 1 ? "" : "s"} (${formattedSubtotal}) | FeedMe`,
    description: `Someone shared their FeedMe cart with you containing ${itemCount} item${itemCount === 1 ? "" : "s"}. Tap to view and add to your cart! 🛒✨`,
    openGraph: {
      title: "A FeedMe cart has been shared with you! 🛒",
      description: `Contains ${itemCount} items worth ${formattedSubtotal}. Open to view and add all in one tap.`,
      images: [
        {
          url: firstItemImage,
          width: 800,
          height: 800,
          alt: "Items in your shared FeedMe cart",
        }
      ],
      type: "website",
      siteName: "FeedMe",
    },
    twitter: {
      card: "summary_large_image",
      title: "FeedMe Shared Cart 🛒",
      description: `Check out these ${itemCount} items someone shared with you on FeedMe!`,
      images: [firstItemImage],
    },
  };
}

export default async function SharedCartPage({ params }: PageProps) {
  const result = await getSharedCart(params.token);

  if (!result.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center space-y-4 max-w-sm">
          {/* Decorative icon */}
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-7 h-7 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Cart not found
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">{result.error}</p>
          <Link
            href="/"
            className="inline-block mt-2 bg-[#1B6013] text-white text-xs font-black uppercase tracking-widest px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
          >
            Shop on FeedMe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SharedCartClient items={result.items} createdAt={result.createdAt} />
  );
}
