export const dynamic = "force-dynamic";
import { getUser } from "src/lib/actions/auth.actions";
import { createClient } from "@utils/supabase/server";
import { redirect } from "next/navigation";
import WalletClient from "./WalletClient";

export default async function WalletPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  // 1. Get authenticated user
  const user = await getUser();
  if (!user) {
    return redirect("/login?callbackUrl=/account/wallet");
  }

  console.log("walet user", user)

  // 2. Create server-side supabase client
  const supabase = await createClient();

  // 3. Fetch wallet balance
  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", user.user_id)
    .maybeSingle();

    console.log("wallet", wallet)

  // 4. Fetch transactions (add pagination if needed)
  const page = Number(searchParams?.page || 1);
  const pageSize = 10;
  const start = (page - 1) * pageSize;
  const end = start + pageSize - 1;

  const {
    data: transactions,
    error: txError,
    count,
  } = await supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .eq("user_id", user.user_id)
    .order("created_at", { ascending: false })
    .range(start, end);

  // 5. Handle errors
  if (walletError || txError) {
    return <div>Error loading wallet or transactions.</div>;
  }

  // 6. Render UI (pass to client component for interactivity)
  return (
    <WalletClient
      user={user}
      walletBalance={wallet?.balance}
      transactions={transactions || []}
      totalTransactions={count || 0}
      currentPage={page}
      pageSize={pageSize}
    />
  );
}
