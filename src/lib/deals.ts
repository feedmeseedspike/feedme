
// --- December Deals Configuration ---
// This file contains the logic for the "FeedMe December Deals" campaign.

import { CartItem } from "./actions/cart.actions";

export interface Deal {
  id: string;
  title: string;
  description: string;
  type: "cashback" | "discount" | "bogo" | "gift";
}

// Default configuration - can be overridden by database values in the future
export const DEFAULT_DECEMBER_DEALS = {
  JOLLY_CASHBACK: {
    id: "jolly_cashback",
    title: "Jolly 10% Cashback",
    description: "Get 10% cash back on all orders above ₦25,000",
    min_spend: 25000,
    percentage: 0.10,
    type: "cashback" as const,
  },
  FAMILY_FEAST: {
    id: "family_feast",
    title: "Family Feast Discount",
    description: "Save 15% on bulk orders above ₦45,000",
    min_spend: 45000,
    percentage: 0.15,
    type: "discount" as const,
  },
  WEEKEND_FLASH_SALE: {
    id: "weekend_flash",
    title: "Weekend Flash Sale",
    description: "Enjoy up to 20% off selected fresh produce every Friday and Saturday",
    percentage: 0.20,
    type: "discount" as const,
  },
  FREE_DELIVERY: {
    id: "free_delivery",
    title: "Free Delivery",
    description: "Free delivery on all orders above ₦50,000 within Lagos",
    min_spend: 50000,
    type: "discount" as const, // Handled as shipping cost reduction
  }
};

// Mutable configuration state - to be populated from DB if needed
export let DECEMBER_DEALS = { ...DEFAULT_DECEMBER_DEALS };

export function updateDealsConfig(newConfig: Partial<typeof DEFAULT_DECEMBER_DEALS>) {
    DECEMBER_DEALS = { ...DECEMBER_DEALS, ...newConfig };
}

/**
 * Calculates the immediate discount to be applied to the cart subtotal.
 * Currently handles:
 * - Family Feast (15% off if > 45k)
 * - (Weekend Flash Sale is applied per-item typically, but could be global if desired)
 */
export function calculateCartDiscount(subtotal: number, items: CartItem[]): number {
  let discount = 0;

  // Family Feast Discount
  // The requirements say "Save 15%... Terms: N45,000 and above".
  // It also mentions "Mostly for vegetables...". For simplicity, we apply to total if > 45k.
  let familyFeastDiscount = 0;
  let flashSaleDiscount = 0;

  // 1. Calculate Family Feast Discount (15% off > 45k)
  if (subtotal >= DECEMBER_DEALS.FAMILY_FEAST.min_spend) {
    familyFeastDiscount = subtotal * DECEMBER_DEALS.FAMILY_FEAST.percentage;
  }

  // 2. Calculate Weekend Flash Sale Discount (20% off Fresh Produce)
  if (isFlashSaleActive()) {
      items.forEach(item => {
          const product = item.products;
          if (product) {
              const categories = (product as any).category || (product as any).tags || [];
              const name = product.name?.toLowerCase() || "";
              
              const isFreshProduce = 
                  (Array.isArray(categories) && categories.some((c: string) => 
                      c.toLowerCase().includes("fruit") || c.toLowerCase().includes("vegetable")
                  )) ||
                  name.includes("fruit") || 
                  name.includes("vegetable") ||
                  name.includes("pepper") ||
                  name.includes("tomato") ||
                  name.includes("onion");
              
              if (isFreshProduce) {
                  const itemTotal = (item.price || 0) * item.quantity;
                  flashSaleDiscount += itemTotal * DECEMBER_DEALS.WEEKEND_FLASH_SALE.percentage;
              }
          }
      });
  }

  // LOGIC: Prevent Stacking.
  // Most e-commerce sites do not allow stacking of broad 15% discounts with specific 20% deals.
  // We will apply the HIGHER of the two discounts to give the customer the best deal without killing margins.
  
  if (flashSaleDiscount > 0 && familyFeastDiscount > 0) {
      return Math.max(flashSaleDiscount, familyFeastDiscount);
  }

  return flashSaleDiscount + familyFeastDiscount; // One of them is 0, so this returns the active one.
}

/**
 * Calculates the cashback to be awarded AFTER a successful payment.
 * Currently handles:
 * - Jolly 10% Cashback (> 25k)
 * - Christmas Rice & Chicken Combo (Cashback)
 */
export function calculatePotentialCashBack(subtotal: number, items: CartItem[] = []): number {
  let cashback = 0;

  // Jolly 10% Cashback
  if (subtotal >= DECEMBER_DEALS.JOLLY_CASHBACK.min_spend) {
    cashback += subtotal * DECEMBER_DEALS.JOLLY_CASHBACK.percentage;
  }

  // Combo 4: Rice & Chicken Cashback
  // Check for "Rice" (10kg?) and "Chicken"
  let hasRice = false;
  let hasChicken = false;
  
  items.forEach(item => {
     const name = item.products?.name?.toLowerCase() || "";
     if (name.includes("rice") && name.includes("10kg")) hasRice = true;
     if (name.includes("chicken")) hasChicken = true;
  });

  if (hasRice && hasChicken) {
      // "Get a discounted price on a whole chicken... become Cash Back"
      // Let's say N2000 cashback
      cashback += 2000; 
  }

  // 12. Holiday Roast Special: Beef + Chicken -> N1000 cashback
  let hasBeef = false;
  items.forEach(item => {
     const name = item.products?.name?.toLowerCase() || "";
     if (name.includes("beef")) hasBeef = true;
  });
  if (hasBeef && hasChicken) {
      cashback += 1000;
  }

  return cashback;
}

/**
 * Checks for "Weekend Flash Sale" eligibility (Friday/Saturday).
 */
export function isFlashSaleActive(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  return day === 5 || day === 6;
}

/**
 * Returns a list of active messages/alerts for the user based on their cart.
 */
export function getDealMessages(subtotal: number, items: CartItem[] = []): string[] {
  const messages: string[] = [];
  
  // Flash Sale Message
  if (isFlashSaleActive()) {
      messages.push(`⚡ Weekend Flash Sale Active! 20% Off Fresh Produce!`);
  }

  // Jolly Cashback Message
  if (subtotal >= DECEMBER_DEALS.JOLLY_CASHBACK.min_spend) {
    const amount = calculatePotentialCashBack(subtotal, items); // Use updated function
    messages.push(`🎉 You qualify for ₦${amount.toLocaleString()} Cash Back on this order!`);
  } else {
    const diff = DECEMBER_DEALS.JOLLY_CASHBACK.min_spend - subtotal;
    if (diff > 0 && diff <= 10000) { 
       messages.push(`Add ₦${diff.toLocaleString()} more to get 10% Cash Back!`);
    }
  }

  // Family Feast Message
  if (subtotal >= DECEMBER_DEALS.FAMILY_FEAST.min_spend) {
      messages.push(`✨ Family Feast Discount Applied (15% Off)!`);
  }

  // Fruit Fest Combo (Deal 6)
  // "Buy a mix of fresh fruits worth 17,500 and get a free pack of dates."
  // We can approximate this by checking total cart value or refining if we have categories
  // For now, checking general total or if we had category data properly.
  // Using a simplified threshold logic for messaging
  const FRUIT_FEST_THRESHOLD = 17500;
  if (subtotal >= FRUIT_FEST_THRESHOLD) {
      // Check if they have fruits? We can rely on 'isFlashSaleActive' check style logic but for 'Fruit'
      // Assuming if they spent 17.5k they might have fruits. 
      // ideally we iterate items.
      const hasFruits = items.some(item => {
           const name = item.products?.name?.toLowerCase() || "";
           return name.includes("fruit") || name.includes("apple") || name.includes("orange");
      });
      if (hasFruits) {
           messages.push(`🎁 Fruit Fest: You get a FREE pack of dates with this order!`);
      }
  }

  return messages;
}

// --- DeaLS & REWARDS CONFIGURATION ---

export type SpinPrize = {
  id: string;
  label: string;
  sub: string;
  type: 'wallet_cash' | 'voucher_percent' | 'item' | 'none';
  value: number; // Amount (₦) or Percentage (%)
  probability: number; // 0 to 1
  color: {
    bg: string;
    text: string;
  };
  code?: string; // For item/voucher codes
};

export const SPIN_PRIZES_CONFIG: SpinPrize[] = [
  { 
    id: "wallet_500", 
    label: "₦500", 
    sub: "CASH", 
    type: "wallet_cash", 
    value: 500, 
    probability: 0.15, 
    color: { bg: "#FFFFFF", text: "#1B6013" } // Winner: White
  },
  { 
    id: "try_again_1", 
    label: "TRY", 
    sub: "AGAIN", 
    type: "none", 
    value: 0, 
    probability: 0.25, 
    color: { bg: "#1F2937", text: "#FFFFFF" } // Loser: Dark Grey
  },
  { 
    id: "voucher_5", 
    label: "5%", 
    sub: "OFF", 
    type: "voucher_percent", 
    value: 5, 
    probability: 0.20, 
    color: { bg: "#FFFFFF", text: "#F0800F" } // Winner: White
  },
  { 
    id: "dates_pack", 
    label: "FREE", 
    sub: "DATES", 
    type: "item", 
    value: 1500, 
    probability: 0.05, 
    color: { bg: "#FFFFFF", text: "#1B6013" }, // Winner: White
    code: "FREE-DATES-DEC"
  },
  { 
    id: "try_again_2", 
    label: "TRY", 
    sub: "AGAIN", 
    type: "none", 
    value: 0, 
    probability: 0.25, 
    color: { bg: "#1F2937", text: "#FFFFFF" } // Loser: Dark Grey
  },
  { 
    id: "wallet_1000", 
    label: "₦1k", 
    sub: "CASH", 
    type: "wallet_cash", 
    value: 1000, 
    probability: 0.10, 
    color: { bg: "#FFFFFF", text: "#FBBF24" } // Winner: White
  }
];

export function getDecemberDeals() {
    return DEFAULT_DECEMBER_DEALS;
}
