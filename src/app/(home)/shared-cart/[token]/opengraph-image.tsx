import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

// Node.js runtime — required for Buffer
export const runtime = "nodejs";
export const alt = "FeedMe Shared Cart";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: { token: string };
}

// Fetch shared cart items using the anon key (no cookies required —
// works for WhatsApp / iMessage scrapers that send no session cookies)
async function fetchSharedCartItems(token: string) {
  try {
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
    if (
      (data as any).expires_at &&
      new Date((data as any).expires_at) < new Date()
    )
      return null;

    const rawItems = ((data as any).items as any[]) || [];
    return rawItems.filter((i: any) => i.price && Number(i.price) > 0);
  } catch {
    return null;
  }
}

// Fetch a remote image and return it as an ArrayBuffer.
// Satori (the engine behind ImageResponse) accepts ArrayBuffer directly for <img src>.
async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({ params }: Props) {
  const cartItems = await fetchSharedCartItems(params.token);

  // ── Fallback brand card when cart is missing / expired ────────────────────
  if (!cartItems || cartItems.length === 0) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #1B6013 0%, #0e3a0a 100%)",
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
            <div style={{ fontSize: 80 }}>🛒</div>
            <div
              style={{
                color: "white",
                fontSize: 52,
                fontWeight: 900,
                letterSpacing: "-1px",
              }}
            >
              FeedMe Shared Cart
            </div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 26 }}>
             FeedMe
            </div>
          </div>
        </div>
      ),
      { ...size }
    );
  }

  // ── Helper: Process Image URLs (JSON handling + Absolute URLs) ────────────
  const processImageUrl = (url: any): string | null => {
    if (!url) return null;
    let targetUrl = url;
    if (typeof url === 'string' && url.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(url);
        if (parsed?.url) targetUrl = parsed.url;
      } catch (e) {}
    } else if (url && typeof url === 'object' && url.url) {
      targetUrl = url.url;
    }
    if (typeof targetUrl !== 'string') return null;
    if (!targetUrl.startsWith('http')) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://feedme.ng";
      return `${baseUrl.replace(/\/$/, '')}/${targetUrl.replace(/^\//, '')}`;
    }
    return targetUrl;
  };

  const subtotal = cartItems.reduce(
    (acc: number, item: any) => acc + (item.price ?? 0) * item.quantity,
    0
  );
  // Safer currency formatting for OG images (some fonts lack the Naira symbol)
  const formattedTotal = `N${subtotal.toLocaleString()}`;

  // ── Fetch up to 4 product images ─────────────────────────────────────────
  const MAX_VISIBLE = 4;
  const visibleItems: any[] = cartItems.slice(0, MAX_VISIBLE);
  const extraCount = cartItems.length - MAX_VISIBLE;

  // Pre-fetch all images in parallel
  const buffers = await Promise.all(
    visibleItems.map(async (item: any) => {
      const imageUrl = processImageUrl(item.image || item.products?.images?.[0] || item.bundles?.thumbnail_url || item.offers?.image_url);
      if (!imageUrl) return null;
      try {
        const res = await fetch(imageUrl, { cache: "no-store", headers: { 'User-Agent': 'FeedMe-OG-Generator' } });
        if (!res.ok) return null;
        return await res.arrayBuffer();
      } catch (e) {
        return null;
      }
    })
  );

  const firstSuccesfulBuffer = buffers.find(b => b !== null);
  const TILE = 315;

  const tiles = Array.from({ length: MAX_VISIBLE }, (_, idx) => {
    let buf = buffers[idx];
    // Fallback to first successful buffer if this specific one failed
    if (!buf && firstSuccesfulBuffer) buf = firstSuccesfulBuffer;

    const isLastAndHasExtra = idx === MAX_VISIBLE - 1 && extraCount > 0;

    return (
      <div
        key={String(idx)}
        style={{
          width: TILE,
          height: TILE,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#d4e6d0",
          borderRight: idx % 2 === 0 ? "3px solid #F7F9F6" : "none",
          borderBottom: idx < 2 ? "3px solid #F7F9F6" : "none",
          position: "relative",
        }}
      >
        {buf ? (
          <img
            /* eslint-disable-next-line @next/next/no-img-element */
            src={buf as any}
            alt=""
            style={{
              width: TILE,
              height: TILE,
              objectFit: "cover",
            }}
          />
        ) : (
          <div style={{ 
              display: "flex", 
              width: "100%", 
              height: "100%", 
              alignItems: "center", 
              justifyContent: "center", 
              background: "#1B6013",
              color: "white",
              fontSize: 64
          }}>
            🥬
          </div>
        )}

        {isLastAndHasExtra && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: TILE,
              height: TILE,
              background: "rgba(0, 0, 0, 0.60)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                color: "white",
                fontSize: 56,
                fontWeight: 900,
                lineHeight: "1",
              }}
            >
              +{extraCount}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              more items
            </div>
          </div>
        )}
      </div>
    );
  });

  // ── Full image layout ─────────────────────────────────────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "row",
          background: "#F7F9F6",
        }}
      >
        {/* ── LEFT: 2×2 product collage ── */}
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
          {tiles}

          {/* FeedMe pill badge at the centre of the 4-tile grid */}
          <div
            style={{
              position: "absolute",
              top: 630 / 2,
              left: 630 / 2,
              transform: "translate(-50%, -50%)",
              background: "#1B6013",
              color: "white",
              fontSize: 18,
              fontWeight: 900,
              padding: "7px 18px",
              borderRadius: 999,
              border: "3px solid #F7F9F6",
              letterSpacing: "0.04em",
              display: "flex",
            }}
          >
            FeedMe
          </div>
        </div>

        {/* ── RIGHT: summary card ── */}
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
          {/* Top */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Badge */}
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
                padding: "6px 16px",
                borderRadius: 999,
                alignSelf: "flex-start",
              }}
            >
              🛒 SHARED CART
            </div>

            {/* Headline */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#0f1a0e",
                  lineHeight: "1.1",
                  letterSpacing: "-1px",
                }}
              >
                Someone shared
              </div>
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#1B6013",
                  lineHeight: "1.1",
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
                lineHeight: "1.4",
                maxWidth: 340,
              }}
            >
              Tap to view all items and add everything to your cart in one tap.
            </div>
          </div>

          {/* Bottom stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 14 }}>
              {/* Item count */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: "#F0F5EF",
                  borderRadius: 16,
                  padding: "16px 24px",
                  minWidth: 110,
                }}
              >
                <div
                  style={{
                    fontSize: 38,
                    fontWeight: 900,
                    color: "#1B6013",
                    lineHeight: "1",
                  }}
                >
                  {cartItems.length}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7c6a",
                    marginTop: 4,
                  }}
                >
                  {cartItems.length === 1 ? "ITEM" : "ITEMS"}
                </div>
              </div>

              {/* Cart total */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  flex: 1,
                  background: "#F0F5EF",
                  borderRadius: 16,
                  padding: "16px 24px",
                }}
              >
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    color: "#1B6013",
                    lineHeight: "1",
                    letterSpacing: "-0.5px",
                  }}
                >
                  {formattedTotal}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#6b7c6a",
                    marginTop: 4,
                  }}
                >
                  CART TOTAL
                </div>
              </div>
            </div>

            {/* Footer */}
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
                  fontSize: 18,
                }}
              >
                🥬
              </div>
              <div
                style={{ fontSize: 16, fontWeight: 700, color: "#9aab98" }}
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
