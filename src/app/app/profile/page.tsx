import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";
import NotificationSetup from "@/components/NotificationSetup";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  return (
    <div>
      <Link href="/app" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Your profile
      </h1>
      <p className="mt-2 text-sm text-hl-mist">{user!.email}</p>
      <ProfileForm initialDisplayName={profile?.display_name ?? ""} />
      <div className="mt-8">
        <NotificationSetup />
      </div>
    </div>
  );
}
