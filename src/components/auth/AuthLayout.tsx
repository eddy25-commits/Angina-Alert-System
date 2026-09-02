import Logo from "@/components/Logo";

export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-hl-paper text-hl-ink">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-12">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <span className="font-display text-base font-semibold tracking-tight">
            HeartLink
          </span>
        </div>

        <div className="mt-12 flex-1">
          <h1 className="font-display text-2xl font-semibold leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-hl-mist">
              {subtitle}
            </p>
          )}

          <div className="mt-8">{children}</div>
        </div>

        {footer && <div className="pt-6 text-center text-sm">{footer}</div>}
      </div>
    </main>
  );
}
