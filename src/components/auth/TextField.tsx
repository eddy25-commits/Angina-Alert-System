import { InputHTMLAttributes } from "react";

export default function TextField({
  label,
  id,
  className = "",
  ...props
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-hl-ink/80">{label}</span>
      <input
        id={id}
        name={id}
        className={`mt-1.5 w-full rounded-xl border border-hl-line bg-white px-4 py-3 text-base text-hl-ink placeholder:text-hl-mist focus:border-hl-blue-500 focus:outline-none ${className}`}
        {...props}
      />
    </label>
  );
}
