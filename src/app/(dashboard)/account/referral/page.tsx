import { getUser } from "src/lib/actions/auth.actions";
import ReferralClient from "./ReferralClient";
import { createServerComponentClient } from "@/utils/supabase/server";

export default async function ReferralPage() {
  // Fetch the user on the server
  const user = await getUser();

  let referralStatus = null;
  let referredUsers = null;
  let error = null;
  let isLoading = false;

  try {
    const supabase = await createServerComponentClient();
    // Fetch referral status for the current user (as referrer)
    if (user?.user_id) {
      const { data, error: referralError } = await supabase
        .from("referrals")
        .select("id, referrer_email, status")
        .eq("referrer_user_id", user.user_id)
        .single();
      if (referralError && referralError.code !== "PGRST116") {
        throw new Error(
          referralError.message || "Error fetching referral status"
        );
      }
      referralStatus = {
        data,
        message: data
          ? "Referral status fetched successfully."
          : "Referral program not activated.",
      };
    } else {
      referralStatus = { data: null, message: "User not found." };
    }
  } catch (err: any) {
    error = err.message || "Failed to fetch referral status";
  }

  try {
    const supabase = await createServerComponentClient();
    if (user?.user_id) {
      // Fetch users referred by the current user
      const { data, error: referredError } = await supabase
        .from("referrals")
        .select(
          "id, referred_user_email, status, referred_purchase_amount, created_at"
        )
        .eq("referrer_user_id", user.user_id);
      if (referredError) {
        throw new Error(
          referredError.message || "Error fetching referred users"
        );
      }
      referredUsers = { data, message: "Referred users fetched successfully." };
    } else {
      referredUsers = { data: [], message: "User not found." };
    }
  } catch (err: any) {
    error = error || err.message || "Failed to fetch referred users";
  }

  return (
    <ReferralClient
      user={user}
      referralStatus={referralStatus}
      referredUsers={referredUsers}
      isLoading={isLoading}
      error={error}
    />
  );
}
