import { createClient } from "@utils/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError, formatNaira } from "src/lib/utils";
import { Database } from "src/utils/database.types";

interface GetVoucherResult {
  success: boolean;
  data?: { id: string; discountType: string; discountValue: number };
  error?: string;
}

export async function getVoucher(code: string, totalAmount: number): Promise<GetVoucherResult> {
  const supabase = createClient();

  try {
    const { data: voucher, error } = await supabase
      .from("vouchers")
      .select("*")
      .eq("code", code)
      .eq("is_active", true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return { success: false, error: "Voucher not found or inactive." };
      }
      throw error;
    }

    if (!voucher) {
      return { success: false, error: "Voucher not found or inactive." };
    }

    if (voucher.max_uses !== null && (voucher.used_count || 0) >= voucher.max_uses) {
      return { success: false, error: "Voucher has reached its maximum uses." };
    }

    if (voucher.valid_from && new Date(voucher.valid_from) > new Date()) {
      return { success: false, error: "Voucher is not yet active." };
    }

    if (voucher.valid_to && new Date(voucher.valid_to) < new Date()) {
      return { success: false, error: "Voucher has expired." };
    }

    if (voucher.min_order_amount !== null && totalAmount < voucher.min_order_amount) {
      return { success: false, error: `Minimum order amount of ${formatNaira(voucher.min_order_amount)} required.` };
    }

    const discountType = voucher.discount_type || "percentage"; // Default to percentage
    const discountValue = voucher.discount_value || 0;

    return { success: true, data: { id: voucher.id, discountType, discountValue } };
  } catch (error: any) {
    console.error("Error in getVoucher:", error);
    return { success: false, error: formatError(error.message) };
  }
}

export const useVoucherValidationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ code, totalAmount }: { code: string; totalAmount: number }) =>
      getVoucher(code, totalAmount),
    onSuccess: () => {
      // Optionally invalidate queries that depend on voucher status if needed
    },
  });
}; 