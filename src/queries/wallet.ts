import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@utils/supabase/client";

const supabase = createClient();

// Wallet balance query
export const useWalletBalanceQuery = (userId: string) => {
  return useQuery({
    queryKey: ["wallet", "balance", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!userId,
  });
};

// Transactions query
export const useTransactionsQuery = (userId: string) => {
  return useQuery({
    queryKey: ["wallet", "transactions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};

// Add funds mutation
export const useAddFundsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      email,
      amount,
    }: {
      email: string;
      amount: number;
    }) => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error("No access token found");
      const res = await fetch("/api/wallet/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, amount }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to initialize transaction");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", "balance", variables.email],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", "transactions", variables.email],
      });
    },
  });
};

// Withdraw funds mutation
export const useWithdrawFundsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amount,
      account_number,
      bank_code,
      recipient_name,
    }: {
      amount: number;
      account_number: string;
      bank_code: string;
      recipient_name: string;
    }) => {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) throw new Error("No access token found");
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, account_number, bank_code, recipient_name }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to transfer funds");
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["wallet", "balance", variables.account_number],
      });
      queryClient.invalidateQueries({
        queryKey: ["wallet", "transactions", variables.account_number],
      });
    },
  });
};