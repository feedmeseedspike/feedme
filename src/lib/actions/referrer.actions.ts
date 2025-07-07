"use server";

import { createVoucher } from './voucher.actions';
import { createClient } from 'src/utils/supabase/server';
import { formatError } from 'src/lib/utils';

interface IssueReferrerDiscountParams {
  referrerUserId: string;
  referrerEmail: string;
  referralId: string;
  discountAmount: number;
}

interface IssueReferrerDiscountResult {
  success: boolean;
  message: string;
  voucherCode?: string;
  error?: any;
}

export async function issueReferrerDiscount(params: IssueReferrerDiscountParams): Promise<IssueReferrerDiscountResult> {
  const supabase = await createClient();

  try {
    // Check if the referrer has already claimed this specific referral's discount
    const { data: existingReferral, error: fetchError } = await supabase
      .from('referrals')
      .select('status, referrer_discount_amount')
      .eq('id', params.referralId)
      .single();

    if (fetchError || !existingReferral) {
      return { success: false, message: 'Referral record not found.' };
    }

    if (existingReferral.status !== 'qualified') {
      return { success: false, message: 'Referral is not yet qualified for discount.' };
    }

    if (existingReferral.referrer_discount_amount > 0) {
        return { success: false, message: 'Referrer has already received a discount for this referral.' };
    }

    // Create a voucher for the referrer
    const voucherResult = await createVoucher({
      userId: params.referrerUserId,
      discountType: 'fixed',
      discountValue: params.discountAmount,
      name: `Referral Reward for ${params.referrerEmail}`,
      description: `Discount for referring a qualified user (Referral ID: ${params.referralId.substring(0, 8)}...)`,
      maxUses: 1, // Single use voucher for the referrer
    });

    if (!voucherResult.success) {
      return { success: false, message: voucherResult.message, error: voucherResult.error };
    }

    // Update the referral record to mark the discount as given
    const { error: updateError } = await supabase
      .from('referrals')
      .update({
        referrer_discount_amount: params.discountAmount, // Record the amount given
        status: 'claimed', // Mark as claimed
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.referralId);

    if (updateError) {
      return { success: false, message: formatError(updateError.message) };
    }

    return { success: true, message: 'Referrer discount issued successfully!', voucherCode: voucherResult.voucherCode };

  } catch (error: any) {
    return { success: false, message: formatError(error.message || 'An unexpected error occurred'), error: error };
  }
} 