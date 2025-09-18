"use server";

import { createClient } from "src/utils/supabase/server";
import { formatError } from "src/lib/utils";

/**
 * Voucher Management System
 * Handles cleanup, archival, and soft deletion to prevent database bloat
 */

export interface VoucherCleanupResult {
  success: boolean;
  message: string;
  deleted?: number;
  archived?: number;
  error?: string;
}

/**
 * Soft delete vouchers (mark as inactive instead of hard delete)
 * This prevents foreign key constraint issues
 */
export async function softDeleteVouchers(voucherIds: string[]): Promise<VoucherCleanupResult> {
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from('vouchers')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .in('id', voucherIds);

    if (error) throw error;

    return {
      success: true,
      message: `Successfully soft-deleted ${voucherIds.length} voucher(s)`,
      deleted: voucherIds.length
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to soft delete vouchers",
      error: formatError(error.message)
    };
  }
}

/**
 * Clean up expired welcome vouchers (30+ days old and unused)
 * This runs automatically to prevent database bloat
 */
export async function cleanupExpiredWelcomeVouchers(): Promise<VoucherCleanupResult> {
  const supabase = await createClient();

  try {
    // Find expired welcome vouchers that haven't been used
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));

    const { data: expiredVouchers, error: fetchError } = await supabase
      .from('vouchers')
      .select('id, code, created_at')
      .lt('created_at', thirtyDaysAgo.toISOString())
      .eq('used_count', 0)
      .eq('is_active', true)
      .ilike('description', '%Welcome discount%');

    if (fetchError) throw fetchError;

    if (!expiredVouchers || expiredVouchers.length === 0) {
      return {
        success: true,
        message: "No expired welcome vouchers to clean up",
        deleted: 0
      };
    }

    // Soft delete expired vouchers
    const voucherIds = expiredVouchers.map(v => v.id);
    const result = await softDeleteVouchers(voucherIds);

    if (result.success) {
      console.log(`Cleaned up ${expiredVouchers.length} expired welcome vouchers`);
    }

    return result;
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to cleanup expired vouchers",
      error: formatError(error.message)
    };
  }
}

/**
 * Clean up vouchers that have reached their usage limit
 */
export async function cleanupFullyUsedVouchers(): Promise<VoucherCleanupResult> {
  const supabase = await createClient();

  try {
    // Find vouchers that have reached their max usage
    const { data: fullyUsedVouchers, error: fetchError } = await supabase
      .from('vouchers')
      .select('id, code, max_uses, used_count')
      .eq('is_active', true)
      .not('max_uses', 'is', null);

    if (fetchError) throw fetchError;

    const vouchersToCleanup = fullyUsedVouchers?.filter(v =>
      v.max_uses !== null && v.used_count >= v.max_uses
    ) || [];

    if (vouchersToCleanup.length === 0) {
      return {
        success: true,
        message: "No fully used vouchers to clean up",
        deleted: 0
      };
    }

    const voucherIds = vouchersToCleanup.map(v => v.id);
    return await softDeleteVouchers(voucherIds);
  } catch (error: any) {
    return {
      success: false,
      message: "Failed to cleanup fully used vouchers",
      error: formatError(error.message)
    };
  }
}

/**
 * Get voucher statistics for admin dashboard
 */
export async function getVoucherStats() {
  const supabase = await createClient();

  try {
    const [activeResult, expiredResult, usedResult] = await Promise.all([
      // Active vouchers
      supabase
        .from('vouchers')
        .select('id', { count: 'exact' })
        .eq('is_active', true),

      // Expired vouchers
      supabase
        .from('vouchers')
        .select('id', { count: 'exact' })
        .lt('valid_to', new Date().toISOString())
        .eq('is_active', true),

      // Fully used vouchers
      supabase
        .from('vouchers')
        .select('id, max_uses, used_count')
        .eq('is_active', true)
        .not('max_uses', 'is', null)
    ]);

    const fullyUsedCount = usedResult.data?.filter(v =>
      v.max_uses !== null && v.used_count >= v.max_uses
    ).length || 0;

    return {
      success: true,
      data: {
        active: activeResult.count || 0,
        expired: expiredResult.count || 0,
        fullyUsed: fullyUsedCount,
        total: (activeResult.count || 0)
      }
    };
  } catch (error: any) {
    return {
      success: false,
      error: formatError(error.message)
    };
  }
}

/**
 * Run complete voucher cleanup (call this periodically)
 */
export async function runVoucherCleanup(): Promise<VoucherCleanupResult> {
  try {
    const [expiredResult, usedResult] = await Promise.all([
      cleanupExpiredWelcomeVouchers(),
      cleanupFullyUsedVouchers()
    ]);

    const totalDeleted = (expiredResult.deleted || 0) + (usedResult.deleted || 0);

    return {
      success: true,
      message: `Cleanup completed. Processed ${totalDeleted} voucher(s)`,
      deleted: totalDeleted
    };
  } catch (error: any) {
    return {
      success: false,
      message: "Voucher cleanup failed",
      error: formatError(error.message)
    };
  }
}