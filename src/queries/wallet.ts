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
        .maybeSingle();

        console.log("Wallet balance query data:", data, error);

      if (error) throw error;
      return data?.balance || 0;
    },
    enabled: !!userId,
  });
};

// Transactions query
export const useTransactionsQuery = (userId: string, page: number = 1, pageSize: number = 10) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  return useQuery({
    queryKey: ["wallet", "transactions", userId, page, pageSize],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("transactions")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (error) throw error;
      return { data: data || [], count: count || 0 };
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
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (authError || !token) {
        console.error("Add Funds Error: No authenticated session found", authError);
        throw new Error("Authentication required to add funds");
      }
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
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (authError || !token) {
        console.error("Withdraw Funds Error: No authenticated session found", authError);
        throw new Error("Authentication required to withdraw funds");
      }
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