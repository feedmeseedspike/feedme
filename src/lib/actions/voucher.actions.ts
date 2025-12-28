"use server";

import { createClient } from "@utils/supabase/server";
import supabaseAdmin from "src/utils/supabase/admin";
import { v4 as uuidv4 } from 'uuid';
import { formatError } from "src/lib/utils";

interface CreateVoucherParams {
  userId?: string; 
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  code?: string; 
  minOrderAmount?: number;
  maxUses?: number; 
  validFrom?: string; 
  validTo?: string; 
  name: string; 
  description?: string; 
}

interface CreateVoucherResult {
  success: boolean;
  message: string;
  voucherCode?: string;
  error?: any;
}

export async function createVoucher(params: CreateVoucherParams): Promise<CreateVoucherResult> {
  let supabase;
  
  if (supabaseAdmin) {
      supabase = supabaseAdmin;
  } else {
      console.warn("Using User Client for Voucher Creation (Admin Key missing). RLS might block this.");
      supabase = await createClient();
  }

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
        // name: params.name, // Temporarily disabled due to schema cache issue
        // description: params.description || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Assuming 'user_id' in vouchers table to link to a specific user if needed
        user_id: params.userId || null,
      })
      .select();

    if (error) {
      return { success: false, message: formatError(error.message), error: error };
    }

    return { success: true, message: 'Voucher created successfully!', voucherCode: voucherCode };
  } catch (error: any) {
    return { success: false, message: formatError(error.message || 'An unexpected error occurred'), error: error };
  }
} 