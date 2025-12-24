import { cn } from "@/lib/utils";

interface HealingBudsLogoProps {
  className?: string;
  variant?: "white" | "dark" | "gradient";
}

/**
 * HealingBudsLogo - Inline SVG Logo Component
 * 
 * Benefits over PNG:
 * - No whitespace issues - path bounds are exact
 * - Perfect scaling at any size
 * - Smaller file size (no network request)
 * - Theme-compatible with CSS color control
 * - Crisp at any resolution (retina ready)
 */
const HealingBudsLogo = ({ className, variant = "white" }: HealingBudsLogoProps) => {
  // Color configuration based on variant
  const colors = {
    white: {
      primary: "#FFFFFF",
      accent: "#4ADE80", // Soft green accent
    },
    dark: {
      primary: "#1a2e2a",
      accent: "#2D5A4A",
    },
    gradient: {
      primary: "url(#logoGradient)",
      accent: "url(#accentGradient)",
    },
  };

  const { primary, accent } = colors[variant];

  return (
    <svg
      viewBox="0 0 280 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-12 w-auto", className)}
      aria-label="Healing Buds Logo"
      role="img"
    >
      {/* Gradient definitions for gradient variant */}
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#2D5A4A" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="50%" stopColor="#4ADE80" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>

      {/* Cannabis Leaf Icon - Stylized HB Mark */}
      <g transform="translate(0, 8)">
        {/* Central leaf */}
        <path
          d="M32 8 C32 8 28 20 28 32 C28 44 32 56 32 56 C32 56 36 44 36 32 C36 20 32 8 32 8Z"
          fill={accent}
          opacity="0.9"
        />
        {/* Left leaf */}
        <path
          d="M32 28 C32 28 20 24 12 28 C4 32 0 40 0 40 C0 40 12 38 20 36 C28 34 32 28 32 28Z"
          fill={accent}
          opacity="0.7"
        />
        {/* Right leaf */}
        <path
          d="M32 28 C32 28 44 24 52 28 C60 32 64 40 64 40 C64 40 52 38 44 36 C36 34 32 28 32 28Z"
          fill={accent}
          opacity="0.7"
        />
        {/* Inner left leaf */}
        <path
          d="M32 32 C32 32 24 30 18 34 C12 38 10 46 10 46 C10 46 18 44 24 42 C30 40 32 32 32 32Z"
          fill={accent}
          opacity="0.5"
        />
        {/* Inner right leaf */}
        <path
          d="M32 32 C32 32 40 30 46 34 C52 38 54 46 54 46 C54 46 46 44 40 42 C34 40 32 32 32 32Z"
          fill={accent}
          opacity="0.5"
        />
        {/* Stem */}
        <path
          d="M30 52 L30 62 Q32 64 34 62 L34 52 Q32 50 30 52Z"
          fill={accent}
          opacity="0.8"
        />
      </g>

      {/* "HEALING" Text */}
      <text
        x="76"
        y="38"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        fontWeight="700"
        fontSize="24"
        letterSpacing="0.05em"
        fill={primary}
      >
        HEALING
      </text>

      {/* "BUDS" Text */}
      <text
        x="76"
        y="62"
        fontFamily="Plus Jakarta Sans, system-ui, sans-serif"
        fontWeight="600"
        fontSize="20"
        letterSpacing="0.15em"
        fill={primary}
        opacity="0.85"
      >
        BUDS
      </text>

      {/* Decorative line */}
      <rect
        x="76"
        y="44"
        width="60"
        height="1"
        fill={accent}
        opacity="0.5"
      />
    </svg>
  );
};

export default HealingBudsLogo;
