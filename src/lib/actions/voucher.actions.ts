"use server";

import { createClient } from "src/utils/supabase/server";
import { v4 as uuidv4 } from 'uuid';
import { formatError } from "src/lib/utils";

interface CreateVoucherParams {
  userId?: string; // Optional: If the voucher is for a specific user
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  code?: string; // Optional: If you want to specify a code, otherwise it's UUID
  minOrderAmount?: number;
  maxUses?: number; // How many times this specific voucher can be used
  validFrom?: string; // ISO date string
  validTo?: string; // ISO date string
  name: string; // A descriptive name for the voucher
  description?: string; // Optional description
}

interface CreateVoucherResult {
  success: boolean;
  message: string;
  voucherCode?: string;
  error?: any;
}

export async function createVoucher(params: CreateVoucherParams): Promise<CreateVoucherResult> {
  const supabase = await createClient();

  try {
    const voucherCode = params.code || `REF-${uuidv4().split('-')[0].toUpperCase()}`;

    const { data, error } = await supabase
      .from('vouchers')
      .insert({
        code: voucherCode,
        discount_type: params.discountType,
        discount_value: params.discountValue,
        min_order_amount: params.minOrderAmount || null,
        max_uses: params.maxUses || 1, // Default to 1 use if not specified
        valid_from: params.validFrom || null,
        valid_to: params.validTo || null,
        is_active: true,
        name: params.name,
        description: params.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Assuming 'user_id' in vouchers table to link to a specific user if needed
        user_id: params.userId || null,
      })
      .select();

    if (error) {
      console.error("Error creating voucher:", error);
      return { success: false, message: formatError(error.message), error: error };
    }

    return { success: true, message: 'Voucher created successfully!', voucherCode: voucherCode };
  } catch (error: any) {
    console.error("Unexpected error in createVoucher action:", error);
    return { success: false, message: formatError(error.message || 'An unexpected error occurred'), error: error };
  }
} 