import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/config";
import { createClient } from "@/lib/supabase/server";
import SignUpForm from "./SignUpForm";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/app");
  }

  return <SignUpForm supabaseConfigured={configured} />;
}
