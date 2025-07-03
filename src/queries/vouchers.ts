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
  try {
    const res = await fetch('/api/voucher/get-voucher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, totalAmount }),
    });
    const result = await res.json();
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Voucher validation failed.' };
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