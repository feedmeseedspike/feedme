import { getUser } from "src/lib/actions/auth.actions";
import ReferralClient from "./ReferralClient";

export default async function ReferralPage() {
  // Fetch the user on the server
  const user = await getUser();

  // Fetch referral status
  let referralStatus = null;
  let referredUsers = null;
  let error = null;
  let isLoading = false;

  try {
    const statusRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/referral/status`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    referralStatus = await statusRes.json();
    if (!statusRes.ok)
      throw new Error(
        referralStatus.message || "Failed to fetch referral status"
      );
  } catch (err: any) {
    error = err.message || "Failed to fetch referral status";
  }

  try {
    const usersRes = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/referral/referred-users`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }
    );
    referredUsers = await usersRes.json();
    if (!usersRes.ok)
      throw new Error(
        referredUsers.message || "Failed to fetch referred users"
      );
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
