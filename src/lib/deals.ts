
// --- DeaLS & REWARDS CONFIGURATION ---

import { CartItem } from "./actions/cart.actions";

export interface Deal {
  id: string;
  title: string;
  description: string;
  type: "cashback" | "discount" | "bogo" | "gift";
}

// New Bonus Thresholds and Rules (Version 1.0)
export const BONUS_CONFIG = {
  FIRST_TIME: {
    min_spend: 0,
    discount_percent: 5,
    description: "5% off your first order",
  },
  REPEAT_ORDER_CASHBACK: {
    min_spend: 25000,
    cashback_percent: 5,
    description: "5% cashback on orders above ₦25,000 for returning members",
  },
  SUBSEQUENT_FREE_DELIVERY: {
    min_spend: 50000,
    description: "Free delivery on next order if you shop above ₦50,000",
    expiry_days: 14,
  },
  PROMO_FREE_DELIVERY_2PM: {
    min_spend: 25000,
    start_date: "2026-04-25T00:00:00+01:00",
    end_date: "2026-05-02T23:59:59+01:00",
    description: "Free delivery for 2pm schedule from April 25th to May 2nd on orders above ₦25,000",
  },
  CASHBACK_THRESHOLD: {
    spend: 100000,
    reward: 2000,
    description: "₦2,000 cashback credit on next order for every ₦100,000 spent",
  },
  LOYALTY_TIERS: [
    { threshold: 1000000, points: 3 },
    { threshold: 500000, points: 2 },
    { threshold: 200000, points: 1 },
  ],
};

/**
 * Calculates automatic discounts applied to the cart (e.g., first-order discount).
 */
export function calculateCartDiscount(subtotal: number, items: CartItem[] = [], isFirstOrder: boolean = false, isAuthenticated: boolean = false): number {
  if (!isAuthenticated) return 0;
  let discount = 0;
  
  // First time visitor discount: 5% off orders
  if (isFirstOrder && subtotal >= BONUS_CONFIG.FIRST_TIME.min_spend) {
    discount = subtotal * (BONUS_CONFIG.FIRST_TIME.discount_percent / 100);
  }

  return discount;
}

/**
 * Returns a descriptive label for the applied automatic discount.
 */
export function getAppliedDiscountLabel(subtotal: number, items: CartItem[] = [], isFirstOrder: boolean = false, isAuthenticated: boolean = false): string {
  if (!isAuthenticated) return "Deals Savings";
  if (isFirstOrder && subtotal >= BONUS_CONFIG.FIRST_TIME.min_spend) {
    return `First Order Discount (${BONUS_CONFIG.FIRST_TIME.discount_percent}%)`;
  }
  return "Deals Savings";
}

/**
 * Calculates the cashback to be awarded AFTER a successful payment.
 */
export function calculatePotentialCashBack(subtotal: number): number {
  let cashback = 0;
  // Threshold 100,000 spend = 2,000 cashback credit
  if (subtotal >= BONUS_CONFIG.CASHBACK_THRESHOLD.spend) {
    cashback = Math.floor(subtotal / BONUS_CONFIG.CASHBACK_THRESHOLD.spend) * BONUS_CONFIG.CASHBACK_THRESHOLD.reward;
  }
  return cashback;
}

/**
 * Calculates loyalty points based on Version 1.0 tiers.
 */
export function calculateLoyaltyPoints(subtotal: number): number {
    for (const tier of BONUS_CONFIG.LOYALTY_TIERS) {
        if (subtotal >= tier.threshold) return tier.points;
    }
    return 0;
}

/**
 * Returns a list of active messages/alerts for the user based on their cart.
 */
export function getDealMessages(subtotal: number, items: CartItem[] = [], isFirstOrder: boolean = false, isAuthenticated: boolean = true): string[] {
  const messages: string[] = [];

  // Authentication prompt
  if (!isAuthenticated && subtotal >= BONUS_CONFIG.FIRST_TIME.min_spend) {
      messages.push(`Log in for 5% Off!`);
  }
  
  // First time visitor applied message
  if (isFirstOrder && isAuthenticated && subtotal >= BONUS_CONFIG.FIRST_TIME.min_spend) {
      messages.push(`First Order Discount Applied`);
  }

  // Promo: Free Delivery for 2PM Schedule
  const now = new Date();
  const promo2pmStart = new Date(BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.start_date);
  const promo2pmEnd = new Date(BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.end_date);
  let hasCurrentOrderFreeDelivery = false;
  
  if (now >= promo2pmStart && now <= promo2pmEnd) {
      if (subtotal >= BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.min_spend) {
          messages.push("✨ Eligible for Free Delivery! (Schedule for 2PM)");
          hasCurrentOrderFreeDelivery = true;
      } else {
          const diff = BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.min_spend - subtotal;
          messages.push(`Add ₦${diff.toLocaleString()} to get Free 2PM Delivery`);
      }
  }

  // Free delivery threshold message (Next Order)
  // Subsequent buyers (not first order) get free delivery on NEXT order if shopping > 50k
  if (subtotal >= BONUS_CONFIG.SUBSEQUENT_FREE_DELIVERY.min_spend) {
      if (!isAuthenticated) {
          messages.push("Log in to unlock Free Delivery rewards!");
      } else if (!isFirstOrder) {
          if (hasCurrentOrderFreeDelivery) {
              messages.push(`You've ALSO unlocked Free Delivery for your NEXT order!`);
          } else {
              messages.push(`You've unlocked Next Order Free Delivery!`);
          }
      }
  }

  return messages;
}

/**
 * Checks if the current order qualifies for the 2PM Free Delivery promotion.
 * Rules: 
 * 1. Current time is before 2:00 PM (Lagos time / local time).
 * 2. Order subtotal meets the threshold (₦25,000).
 * 3. Current date is within the promotion range.
 */
export function check2PMFreeDeliveryEligibility(subtotal: number): boolean {
  const now = new Date();
  
  // 1. Date Range Check
  const start = new Date(BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.start_date);
  const end = new Date(BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.end_date);
  if (now < start || now > end) return false;

  // 2. Subtotal Check
  if (subtotal < BONUS_CONFIG.PROMO_FREE_DELIVERY_2PM.min_spend) return false;

  // 3. Time Check (Before 2:00 PM)
  const hours = now.getHours();
  if (hours >= 14) return false;

  return true;
}

/**
 * Checks if an order (by subtotal and first-order status) qualifies for the Spin Wheel.
 */
export function isEligibleForSpin(subtotal: number, isFirstOrder: boolean): boolean {
  // New Rule: Every completed purchase order qualifies for a spin.
  return true;
}

// --- SPIN WHEEL CONFIGURATION ---

export type SpinPrize = {
  id: string;
  label: string;
  sub: string;
  type: 'wallet_cash' | 'voucher_percent' | 'loyalty_points' | 'free_delivery' | 'none';
  value: number; 
  probability: number; 
  color: {
    bg: string;
    text: string;
  };
  image?: string;
};

export const SPIN_PRIZES_CONFIG: SpinPrize[] = [
  { 
    id: "percent_5", 
    label: "5%", 
    sub: "OFF", 
    type: "voucher_percent", 
    value: 5, 
    probability: 0.20, 
    color: { bg: "#FFFFFF", text: "#1B6013" }, 
    image: "https://cdn-icons-png.flaticon.com/512/726/726476.png"
  },
  { 
    id: "free_deliv", 
    label: "FREE", 
    sub: "DELIVERY", 
    type: "free_delivery", 
    value: 0, 
    probability: 0.15, 
    color: { bg: "#F97316", text: "#FFFFFF" }, 
    image: "https://cdn-icons-png.flaticon.com/512/2769/2769339.png"
  },
  { 
    id: "try_again_1", 
    label: "TRY", 
    sub: "AGAIN", 
    type: "none", 
    value: 0, 
    probability: 0.15, 
    color: { bg: "#F3F4F6", text: "#1F2937" }, 
    image: "https://img.icons8.com/ios-filled/100/1B6013/sad.png"
  },
  { 
    id: "cash_3000", 
    label: "₦3,000", 
    sub: "CASHBACK", 
    type: "wallet_cash", 
    value: 3000, 
    probability: 0.10, 
    color: { bg: "#1B6013", text: "#FFFFFF" }, 
    image: "https://cdn-icons-png.flaticon.com/512/550/550638.png"
  },
  { 
    id: "try_again_2", 
    label: "OOPs!", 
    sub: "SPIN AGAIN", 
    type: "none", 
    value: 0, 
    probability: 0.15, 
    color: { bg: "#FFFFFF", text: "#1F2937" }, 
    image: "https://img.icons8.com/ios-filled/100/1B6013/sad.png"
  },
  { 
    id: "points_5", 
    label: "5", 
    sub: "POINTS", 
    type: "loyalty_points", 
    value: 5, 
    probability: 0.25, 
    color: { bg: "#FFFFFF", text: "#F97316" }, 
    image: "https://cdn-icons-png.flaticon.com/512/1152/1152912.png"
  },
  { 
    id: "percent_10_welcome", 
    label: "10% OFF", 
    sub: "WELCOME", 
    type: "voucher_percent", 
    value: 10, 
    probability: 0, 
    color: { bg: "#1B6013", text: "#FFFFFF" }, 
    image: "https://cdn-icons-png.flaticon.com/512/726/726476.png"
  }
];
