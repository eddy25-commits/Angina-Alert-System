export default function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-hl-alert/10 px-3 py-2.5 text-sm text-hl-alert-deep"
    >
      {message}
    </p>
  );
}
