import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

// Node.js runtime required — Buffer is not available in the Edge runtime
export const runtime = "nodejs";
export const alt = "FeedMe Shared Cart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { token: string };
}

// Direct anon-key fetch: external scrapers (WhatsApp, iMessage…) send no cookies
// so the cookie-based server client would return nothing. Use anon key instead.
async function fetchSharedCartItems(token: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from("shared_carts")
    .select("items, expires_at")
    .eq("token", token)
    .single();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at as string) < new Date()) return null;

  const items = (data.items as any[]) || [];
  // filter out free-prize items
  return items.filter((i: any) => i.price && Number(i.price) > 0);
}

// Convert an image URL to a base64 data-URL (Node.js runtime only)
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: Props) {
  const items = await fetchSharedCartItems(params.token);
  // Wrap in a result-like shape so the rest of the code stays the same
  const result = items && items.length > 0
    ? { success: true as const, items }
    : { success: false as const, items: [] as any[] };

  // ---------- fallback when cart is missing / expired ----------
  if (!result.success || !result.items.length) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg,#1B6013 0%,#0e3a0a 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            {/* cart icon */}
            <div
              style={{
                fontSize: 80,
                lineHeight: 1,
              }}
            >
              🛒
            </div>
            <div
              style={{
                color: "white",
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: "-1px",
              }}
            >
              FeedMe Shared Cart
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: 24,
              }}
            >
              FeedMe
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  const cartItems = result.items;
  const subtotal = cartItems.reduce(
    (acc, item: any) => acc + (item.price ?? 0) * item.quantity,
    0
  );
  const formattedTotal = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(subtotal);

  // We show at most 4 product images in a 2×2 grid
  const MAX_VISIBLE = 4;
  const visibleItems = cartItems.slice(0, MAX_VISIBLE);
  const extraCount = cartItems.length - MAX_VISIBLE;

  // Pre-load images as data URLs (uses Node.js Buffer — fine since runtime = "nodejs")
  const imageData: (string | null)[] = await Promise.all(
    visibleItems.map((item) => (item.image ? toDataUrl(item.image) : Promise.resolve(null)))
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "row",
          background: "#F7F9F6",
          fontFamily: "sans-serif",
        }}
      >
        {/* ── LEFT PANEL: product collage ── */}
        <div
          style={{
            width: 630,
            height: 630,
            display: "flex",
            flexWrap: "wrap",
            flexShrink: 0,
            position: "relative",
          }}
        >
          {visibleItems.map((item, idx) => {
            const img = imageData[idx];
            const isLast = idx === MAX_VISIBLE - 1 && extraCount > 0;

            return (
              <div
                key={idx}
                style={{
                  width: "50%",
                  height: "50%",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  borderRight: idx % 2 === 0 ? "3px solid #F7F9F6" : "none",
                  borderBottom: idx < 2 ? "3px solid #F7F9F6" : "none",
                  background: "#e8ede7",
                }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img}
                    alt={item.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div style={{ fontSize: 56 }}>🥬</div>
                )}
                {/* Dark overlay for the "+N more" tile — ImageResponse doesn't support CSS filter */}
                {isLast && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0.65)",
                    }}
                  />
                )}

                {/* "+N more" overlay on the last visible tile */}
                {isLast && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        color: "white",
                        fontSize: 52,
                        fontWeight: 900,
                        lineHeight: 1,
                      }}
                    >
                      +{extraCount}
                    </div>
                    <div
                      style={{
                        color: "rgba(255,255,255,0.8)",
                        fontSize: 18,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                      }}
                    >
                      more items
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* fill empty slots if fewer than 4 items */}
          {Array.from({ length: MAX_VISIBLE - visibleItems.length }).map(
            (_, idx) => (
              <div
                key={`empty-${idx}`}
                style={{
                  width: "50%",
                  height: "50%",
                  background: "#e8ede7",
                  borderRight:
                    (visibleItems.length + idx) % 2 === 0
                      ? "3px solid #F7F9F6"
                      : "none",
                  borderBottom: visibleItems.length + idx < 2 ? "3px solid #F7F9F6" : "none",
                }}
              />
            )
          )}

          {/* FeedMe logo pill overlaid on the divider cross */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              background: "#1B6013",
              color: "white",
              fontSize: 20,
              fontWeight: 900,
              padding: "8px 18px",
              borderRadius: 999,
              letterSpacing: "0.04em",
              border: "3px solid #F7F9F6",
            }}
          >
            FeedMe
          </div>
        </div>

        {/* ── RIGHT PANEL: cart summary ── */}
        <div
          style={{
            flex: 1,
            height: 630,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 48px",
            background: "#ffffff",
          }}
        >
          {/* Top section */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#1B6013",
                color: "white",
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: "0.15em",
                padding: "6px 14px",
                borderRadius: 999,
                alignSelf: "flex-start",
              }}
            >
              🛒 SHARED CART
            </div>

            {/* headline */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#0f1a0e",
                  lineHeight: 1.1,
                  letterSpacing: "-1px",
                }}
              >
                Someone shared
              </div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 900,
                  color: "#1B6013",
                  lineHeight: 1.1,
                  letterSpacing: "-1px",
                }}
              >
                their cart with you!
              </div>
            </div>

            <div
              style={{
                fontSize: 20,
                color: "#6b7c6a",
                lineHeight: 1.4,
                maxWidth: 340,
              }}
            >
              Tap to view all items and add everything to your own cart in one
              tap.
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
              }}
            >
              {/* item count pill */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#F0F5EF",
                  borderRadius: 16,
                  padding: "16px 24px",
                  alignItems: "center",
                  minWidth: 120,
                }}
              >
                <div
                  style={{
                    fontSize: 36,
                    fontWeight: 900,
                    color: "#1B6013",
                    lineHeight: 1,
                  }}
                >
                  {cartItems.length}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7c6a",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {cartItems.length === 1 ? "ITEM" : "ITEMS"}
                </div>
              </div>

              {/* total pill */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "#F0F5EF",
                  borderRadius: 16,
                  padding: "16px 24px",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#1B6013",
                    lineHeight: 1,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {formattedTotal}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "#6b7c6a",
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  CART TOTAL
                </div>
              </div>
            </div>

            {/* domain footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                paddingTop: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: "#1B6013",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                }}
              >
                🥬
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#9aab98",
                }}
              >
                FeedMe
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
