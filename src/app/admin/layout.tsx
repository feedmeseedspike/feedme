import { redirect } from "next/navigation";
import { createServerComponentClient } from "@utils/supabase/server";
import { AdminSidebar } from "@/components/admin/adminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { GetUserReturn } from "src/lib/actions/auth.actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerComponentClient();

  // Check if user is authenticated
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    redirect("/login?redirectTo=/admin");
  }

  // Check if user is admin/staff
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "is_staff, role, display_name, avatar_url, birthday, created_at, favorite_fruit, status, user_id, has_used_new_user_spin, loyalty_points"
    )
    .eq("user_id", userData.user.id)
    .single();

  if (profileError || (!profile?.is_staff && profile?.role !== "admin")) {
    console.log("[AdminLayout] Access Denied. Redirecting...", {
      user: userData.user.email,
      userId: userData.user.id,
      profile: profile ? { role: profile.role, is_staff: profile.is_staff } : null,
      error: profileError
    });
    redirect("/?error=access_denied");
  }

  const profileWithEmail = (profile
    ? { ...profile, email: userData.user.email ?? null, updated_at: null }
    : null) as GetUserReturn;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar user={profileWithEmail} />
        <main className="p-8 flex-1">{children}</main>
      </div>
    </SidebarProvider>
  );
}
