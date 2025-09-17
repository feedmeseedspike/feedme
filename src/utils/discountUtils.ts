/**
 * Utility functions for handling discount codes and vouchers
 */

export interface DiscountCode {
  code: string;
  discount_percentage: number;
  valid_from: string;
  valid_until: string;
  usage_limit?: number;
  used_count?: number;
}

/**
 * Generate a unique discount code for new users
 * @param userEmail - User's email to create personalized code
 * @returns Generated discount code
 */
export function generateWelcomeDiscountCode(userEmail: string): string {
  const emailPrefix = userEmail.split('@')[0].toUpperCase();
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-3);
  
  return `WELCOME${emailPrefix.substring(0, 3)}${randomSuffix}${timestamp}`;
}

/**
 * Create a welcome discount code object
 * @param userEmail - User's email
 * @param discountPercentage - Percentage discount (default: 5)
 * @param validDays - Number of days the code is valid (default: 30)
 * @returns Complete discount code object
 */
export function createWelcomeDiscount(
  userEmail: string, 
  discountPercentage: number = 5,
  validDays: number = 30
): DiscountCode {
  const code = generateWelcomeDiscountCode(userEmail);
  const now = new Date();
  const validUntil = new Date(now.getTime() + (validDays * 24 * 60 * 60 * 1000));
  
  return {
    code,
    discount_percentage: discountPercentage,
    valid_from: now.toISOString(),
    valid_until: validUntil.toISOString(),
    usage_limit: 1, // One-time use for welcome discount
    used_count: 0
  };
}

/**
 * Validate if a discount code is still valid
 * @param discountCode - The discount code object
 * @returns Boolean indicating if code is valid
 */
export function isDiscountCodeValid(discountCode: DiscountCode): boolean {
  const now = new Date();
  const validFrom = new Date(discountCode.valid_from);
  const validUntil = new Date(discountCode.valid_until);
  
  return (
    now >= validFrom &&
    now <= validUntil &&
    (discountCode.usage_limit === undefined || 
     discountCode.used_count === undefined ||
     discountCode.used_count < discountCode.usage_limit)
  );
}

/**
 * Format discount percentage for display
 * @param percentage - Percentage value
 * @returns Formatted string with % symbol
 */
export function formatDiscountPercentage(percentage: number): string {
  return `${percentage}%`;
}

/**
 * Calculate discount amount from percentage
 * @param originalAmount - Original order amount
 * @param discountPercentage - Discount percentage
 * @returns Calculated discount amount
 */
export function calculateDiscountAmount(
  originalAmount: number, 
  discountPercentage: number
): number {
  return (originalAmount * discountPercentage) / 100;
}