import ProfileClient from "./ProfileClient";
import { getUser } from "src/lib/actions/auth.actions";
import { redirect } from "next/navigation";
import supabaseAdmin from "@/utils/supabase/admin";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?callbackUrl=/account/profile");
  }
  // Fetch email from auth.users
  const { data: authUser, error } = await supabaseAdmin.auth.admin.getUserById(
    user.user_id
  );

  return (
    <ProfileClient user={{ ...user, email: authUser?.user?.email ?? "" }} />
  );
}
