import Image from "next/image";

const SIZES = {
  sm: 28,
  md: 40,
  lg: 64,
} as const;

export default function Logo({
  size = "md",
  className = "",
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const pad = Math.round(px * 0.18);
  return (
    <span
      className={`inline-flex items-center justify-center rounded-xl bg-white ${className}`}
      style={{ padding: pad }}
    >
      <Image
        src="/icons/icon-192.png"
        alt="HeartLink"
        width={px}
        height={px}
        priority
      />
    </span>
  );
}
