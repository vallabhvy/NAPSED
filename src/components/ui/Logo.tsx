import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  light?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  size = "md",
  light = false,
}) => {
  const heightClasses = {
    sm: "h-5",
    md: "h-7",
    lg: "h-9",
    xl: "h-12",
    "2xl": "h-16",
    "3xl": "h-20",
  };

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <img
        src="/logo.png"
        alt="napsed."
        className={`${heightClasses[size]} w-auto object-contain ${
          light ? "brightness-0 invert" : ""
        }`}
      />
    </div>
  );
};
