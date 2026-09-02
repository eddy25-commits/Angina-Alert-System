import { isSupabaseConfigured } from "@/lib/config";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const params = await searchParams;
  return (
    <ResetPasswordForm
      supabaseConfigured={isSupabaseConfigured()}
      sent={params.sent === "1"}
    />
  );
}
