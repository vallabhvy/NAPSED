import { useState } from "react";

interface AvatarProps {
  src: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

export function Avatar({
  src,
  alt,
  className = "h-8 w-8 rounded-none",
  fallbackText,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  const initials = fallbackText
    ? fallbackText.substring(0, 2).toUpperCase()
    : alt.substring(0, 2).toUpperCase();

  if (hasError || !src) {
    return (
      <div
        className={`${className} chassis-plate text-theme-ink flex items-center justify-center font-mono font-bold text-xs uppercase shrink-0`}
        title={alt}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} object-cover shrink-0`}
    />
  );
}
