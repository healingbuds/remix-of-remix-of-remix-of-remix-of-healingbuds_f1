/**
 * TrustMotifs Component
 * 
 * Custom SVG icon motifs inspired by the trust badge designs:
 * - Cannabis leaf with certification badge (EU GMP Certified)
 * - Laboratory flask with leaf (Lab Tested)
 * - Shield with checkmark (Secure & Compliant)
 * - Delivery truck with leaf (Discreet Delivery)
 * 
 * These are individual SVG components for flexible use across the site.
 */

import { cn } from "@/lib/utils";

interface MotifProps {
  className?: string;
  size?: number;
  color?: string;
}

// Cannabis leaf with certification badge motif
export const LeafCertifiedMotif = ({ className, size = 48, color = "currentColor" }: MotifProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Main cannabis leaf */}
    <path 
      d="M24 8C24 8 20 14 16 18C12 22 8 24 8 24C8 24 12 26 16 26C18 26 20 25 22 24V36C22 37.1 22.9 38 24 38C25.1 38 26 37.1 26 36V24C28 25 30 26 32 26C36 26 40 24 40 24C40 24 36 22 32 18C28 14 24 8 24 8Z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Certification badge circle */}
    <circle 
      cx="34" 
      cy="34" 
      r="10" 
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Checkmark inside badge */}
    <path 
      d="M30 34L33 37L38 31"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Laboratory flask with cannabis leaf motif
export const LabTestedMotif = ({ className, size = 48, color = "currentColor" }: MotifProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Flask body */}
    <path 
      d="M18 8H30V18L38 36C39 38.5 37 42 34 42H14C11 42 9 38.5 10 36L18 18V8Z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Flask top */}
    <path 
      d="M16 8H32"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Small leaf inside flask */}
    <path 
      d="M24 26C24 26 22 29 20 31C20 31 22 32 24 32C26 32 28 31 28 31C26 29 24 26 24 26Z"
      fill={color}
      fillOpacity="0.4"
    />
    {/* Bubbles */}
    <circle cx="20" cy="36" r="2" fill={color} fillOpacity="0.3" />
    <circle cx="28" cy="34" r="1.5" fill={color} fillOpacity="0.3" />
  </svg>
);

// Shield with checkmark motif
export const SecureShieldMotif = ({ className, size = 48, color = "currentColor" }: MotifProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Shield outline */}
    <path 
      d="M24 6L8 12V22C8 32 14.5 40 24 44C33.5 40 40 32 40 22V12L24 6Z"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Checkmark */}
    <path 
      d="M16 24L22 30L32 18"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Delivery truck with leaf motif
export const DeliveryMotif = ({ className, size = 48, color = "currentColor" }: MotifProps) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 48 48" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Truck body */}
    <rect 
      x="4" 
      y="16" 
      width="26" 
      height="18" 
      rx="2"
      fill={color}
      fillOpacity="0.15"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Truck cabin */}
    <path 
      d="M30 22H38C40 22 42 24 42 26V34H30V22Z"
      fill={color}
      fillOpacity="0.2"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Wheels */}
    <circle cx="14" cy="34" r="4" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    <circle cx="36" cy="34" r="4" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    {/* Small leaf on truck */}
    <path 
      d="M17 24C17 24 15 26 14 27C14 27 16 28 17 27C18 26 17 24 17 24Z"
      fill={color}
      fillOpacity="0.5"
    />
    {/* Speed lines */}
    <line x1="1" y1="22" x2="4" y2="22" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    <line x1="0" y1="26" x2="4" y2="26" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
  </svg>
);

// Combined trust motifs display component
interface TrustMotifsProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
};

const TrustMotifs = ({ className, size = "md", showLabels = true }: TrustMotifsProps) => {
  const iconSize = sizeMap[size];
  
  const motifs = [
    { Component: LeafCertifiedMotif, label: "EU GMP Certified" },
    { Component: LabTestedMotif, label: "Lab Tested" },
    { Component: SecureShieldMotif, label: "Secure & Compliant" },
    { Component: DeliveryMotif, label: "Discreet Delivery" },
  ];

  return (
    <div className={cn("flex flex-wrap justify-center gap-8 md:gap-12", className)}>
      {motifs.map(({ Component, label }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <Component 
            size={iconSize} 
            className="text-primary" 
          />
          {showLabels && (
            <span className="text-xs md:text-sm font-medium text-muted-foreground text-center">
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrustMotifs;
