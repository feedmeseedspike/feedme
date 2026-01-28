
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
    min_spend: 25000,
    discount_percent: 10,
    description: "10% off orders above ₦25,000 for first-time visitors",
  },
  SUBSEQUENT_FREE_DELIVERY: {
    min_spend: 50000,
    description: "Free delivery on next order if you shop above ₦50,000",
    expiry_days: 14,
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
  
  // First time visitor discount: 10% off orders above ₦25,000
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
      messages.push(`Log in for 10% Off!`);
  }
  
  // First time visitor applied message
  if (isFirstOrder && isAuthenticated && subtotal >= BONUS_CONFIG.FIRST_TIME.min_spend) {
      messages.push(`First Order Discount Applied`);
  }

  // Free delivery threshold message (Next Order)
  // Subsequent buyers (not first order) get free delivery on NEXT order if shopping > 50k
  if (subtotal >= BONUS_CONFIG.SUBSEQUENT_FREE_DELIVERY.min_spend) {
      if (!isAuthenticated) messages.push("Log in to unlock Free Delivery rewards!");
      else if (!isFirstOrder) messages.push(`You've unlocked Next Order Free Delivery!`);
  }

  return messages;
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
