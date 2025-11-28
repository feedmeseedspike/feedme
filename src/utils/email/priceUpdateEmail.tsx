import * as React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
  Link,
} from "@react-email/components";

const currencyFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

export type PriceChangeItem = {
  productName: string;
  unit?: string | null;
  category?: string | null;
  oldPrice?: number | null;
  newPrice: number;
  changeAmount?: number | null;
  changeRatio?: number | null;
};

export type PriceUpdateEmailProps = {
  captureDate: string;
  increases: PriceChangeItem[];
  decreases: PriceChangeItem[];
  newProducts: PriceChangeItem[];
  summary: {
    totalTracked: number;
    increaseCount: number;
    decreaseCount: number;
    newCount: number;
  };
  websiteUrl?: string;
  trackingId?: string; // For email open/click tracking
  recipientEmail?: string; // For tracking which user clicked
};

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "—";
  return currencyFormatter.format(value);
}

function formatPercent(value: number | null | undefined) {
  if (value == null) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

function getChangeBadge(item: PriceChangeItem) {
  if (item.changeAmount == null) {
    return { label: "NEW", color: "#1D4ED8" };
  }
  if (item.changeAmount > 0) {
    return {
      label: `↑ ${formatCurrency(Math.abs(item.changeAmount))}`,
      color: "#B91C1C",
    };
  }
  if (item.changeAmount < 0) {
    return {
      label: `↓ ${formatCurrency(Math.abs(item.changeAmount))}`,
      color: "#15803D",
    };
  }
  return { label: "UNCHANGED", color: "#6B7280" };
}

function buildTrackedUrl(
  baseUrl: string,
  path: string,
  trackingId?: string,
  recipientEmail?: string
): string {
  // Normalize baseUrl to always have a protocol
  let normalizedBaseUrl = baseUrl.trim();
  if (!normalizedBaseUrl.startsWith("http://") && !normalizedBaseUrl.startsWith("https://")) {
    // Default to https if no protocol specified
    normalizedBaseUrl = `https://${normalizedBaseUrl}`;
  }
  normalizedBaseUrl = normalizedBaseUrl.replace(/\/$/, ""); // Remove trailing slash
  
  const targetUrl = path.startsWith("http") ? path : `${normalizedBaseUrl}${path}`;
  
  if (!trackingId || !recipientEmail) {
    return targetUrl;
  }
  
  // Route through click tracking endpoint
  const trackingUrl = new URL("/api/email/track-click", normalizedBaseUrl);
  trackingUrl.searchParams.set("url", targetUrl);
  trackingUrl.searchParams.set("tracking_id", trackingId);
  trackingUrl.searchParams.set("email", encodeURIComponent(recipientEmail));
  
  return trackingUrl.toString();
}

function renderSection(
  title: string,
  items: PriceChangeItem[],
  websiteUrl: string,
  trackingId?: string,
  recipientEmail?: string,
  showLimit = 20
) {
  if (!items.length) return null;

  const displayItems = items.slice(0, showLimit);
  const hasMore = items.length > showLimit;
  const trackedUrl = buildTrackedUrl(websiteUrl, "/", trackingId, recipientEmail);

  return (
    <Section className="bg-white border border-slate-200 rounded-xl px-6 py-5 mb-6">
      <Heading className="text-base font-semibold text-slate-800 mb-3">
        {title} ({items.length} total)
      </Heading>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-600">
            <th className="px-3 py-2 rounded-l-lg">Product</th>
            <th className="px-3 py-2">Unit</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Old Price</th>
            <th className="px-3 py-2">New Price</th>
            <th className="px-3 py-2 rounded-r-lg">Change</th>
          </tr>
        </thead>
        <tbody>
          {displayItems.map((item) => {
            const badge = getChangeBadge(item);
            const changePercent =
              item.changeAmount != null
                ? formatPercent(item.changeRatio ?? null)
                : "—";
            return (
              <tr
                key={`${item.productName}-${item.unit ?? ""}`}
                className="border-t border-slate-100"
              >
                <td className="px-3 py-2 font-medium text-slate-800">
                  <div>{item.productName}</div>
                  {item.changeAmount != null && (
                    <div className="text-xs text-slate-500">
                      {changePercent} vs prev
                    </div>
                  )}
                </td>
                <td className="px-3 py-2 text-slate-600">{item.unit || "—"}</td>
                <td className="px-3 py-2 text-slate-600">
                  {item.category || "—"}
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {formatCurrency(item.oldPrice ?? null)}
                </td>
                <td className="px-3 py-2 text-slate-800 font-semibold">
                  {formatCurrency(item.newPrice)}
                </td>
                <td className="px-3 py-2">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontWeight: 600,
                      color: badge.color,
                    }}
                  >
                    <span>{badge.label}</span>
                    {item.changeAmount != null && (
                      <span style={{ fontSize: "12px", color: badge.color }}>
                        {changePercent}
                      </span>
                    )}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {hasMore && (
        <Text className="text-center mt-4">
          <Link
            href={trackedUrl}
            className="text-[#1B6013] font-medium underline"
          >
            View all {items.length} {title.toLowerCase()} on our website →
          </Link>
        </Text>
      )}
    </Section>
  );
}

export default function PriceUpdateEmail(props: PriceUpdateEmailProps) {
  const {
    captureDate,
    increases,
    decreases,
    newProducts,
    summary,
    websiteUrl = "https://shopfeedme.com",
    trackingId,
    recipientEmail,
  } = props;

  // Normalize websiteUrl to always have a protocol
  let normalizedBaseUrl = websiteUrl.trim();
  if (!normalizedBaseUrl.startsWith("http://") && !normalizedBaseUrl.startsWith("https://")) {
    normalizedBaseUrl = `https://${normalizedBaseUrl}`;
  }
  normalizedBaseUrl = normalizedBaseUrl.replace(/\/$/, ""); // Remove trailing slash
  
  const trackedShopUrl = buildTrackedUrl(normalizedBaseUrl, "/", trackingId, recipientEmail);
  const trackingPixelUrl = trackingId && recipientEmail
    ? `${normalizedBaseUrl}/api/email/track?type=open&tracking_id=${trackingId}&email=${encodeURIComponent(recipientEmail)}`
    : undefined;

  return (
    <Html>
      <Head />
      <Preview>Price movements for {captureDate}</Preview>
      <Tailwind>
        <Body className="bg-slate-100 text-slate-700">
          <Container className="max-w-xl mx-auto bg-white shadow-sm rounded-2xl overflow-hidden my-10">
            <Section className="bg-[#1B6013] px-8 py-6 text-white text-center">
              <Img
                src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png"
                width="120"
                alt="FeedMe"
                className="mx-auto mb-4"
              />
              <Heading className="text-2xl font-semibold mb-1">
                Weekly Price Update
              </Heading>
              <Text className="text-sm opacity-80">Captured {captureDate}</Text>
            </Section>

            <Section className="px-8 pt-8 pb-4">
              <Text className="text-sm leading-6 text-slate-600">
                Hello,
                <br />
                <br />
                Here is a snapshot of the latest product price movements from
                FeedMe. Use these insights to update your store listings or
                notify customers about savings.
              </Text>
            </Section>

            <Section className="px-8 pb-6">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-xl py-4">
                  <div className="text-2xl font-semibold text-[#1B6013]">
                    {summary.totalTracked}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Products with Changes
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl py-4">
                  <div className="text-2xl font-semibold text-[#B91C1C]">
                    {summary.increaseCount}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Price Increases
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl py-4">
                  <div className="text-2xl font-semibold text-[#15803D]">
                    {summary.decreaseCount}
                  </div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    Price Drops
                  </div>
                </div>
              </div>
            </Section>

            <Section className="px-8">
              {renderSection("Notable Decreases", decreases, websiteUrl, trackingId, recipientEmail)}
              {renderSection("Biggest Increases", increases, websiteUrl, trackingId, recipientEmail)}
              {renderSection("Newly Added Products", newProducts, websiteUrl, trackingId, recipientEmail)}
            </Section>

            <Section className="px-8 pb-6">
              <Text className="text-xs text-slate-500 leading-5">
                Tip: Pair this report with your inventory planner to highlight
                best-value bundles and keep family shoppers informed. For
                questions, reply to this email or contact FeedMe support.
              </Text>
            </Section>

            <Hr className="border-slate-200" />

            <Section className="px-8 py-6 text-xs text-slate-500 text-center">
              <Text className="mb-3">
                <Link
                  href={trackedShopUrl}
                  className="text-[#1B6013] font-semibold text-sm underline"
                >
                  Shop Now on FeedMe →
                </Link>
              </Text>
              <Text className="mb-2">
                You are receiving price alerts from FeedMe. To adjust your
                notifications click{" "}
                <Link
                  href="mailto:orders.feedmeafrica@gmail.com?subject=Price Update Preferences"
                  className="text-[#1B6013]"
                >
                  here
                </Link>
                .
              </Text>
              <Text>
                © {new Date().getFullYear()} FeedMe Africa. All rights
                reserved.
              </Text>
              {trackingPixelUrl && (
                <Img
                  src={trackingPixelUrl}
                  width="1"
                  height="1"
                  alt=""
                  style={{ display: "block", width: "1px", height: "1px" }}
                />
              )}
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
