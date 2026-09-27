import type { Config } from "tailwindcss";

/**
 * Official administrative palette (Modernized)
 * Tailwind v4 reads the live tokens from `src/app/globals.css` `@theme`.
 * Keep this file aligned when adding colors so shadcn/ui and the CSS theme stay in sync.
 */
export const officialTheme = {
  colors: {
    // Brand: Deep, trustworthy blues
    navy: "#1A365D",
    "navy-soft": "#2B6CB0",
    
    // Backgrounds: Clean and subtle
    paper: "#FFFFFF", // Pure white to make cards and forms pop
    cream: "#F8F9FA", // A very subtle, cool off-white for the main app background
    
    // Text & Neutrals: High contrast and readable
    ink: "#0F172A",   // Near-black slate for crisp primary typography
    slate: "#475569", // A true slate gray for icons and neutral elements
    muted: "#64748B", // Accessible secondary text
    line: "#E2E8F0",  // Clean, crisp border color that doesn't overwhelm forms
    
    // Accents: Elegant, refined gold
    gold: "#D4AF37",
    "gold-dark": "#AA8825",
    
    // Semantic: Vibrant, standard indicators
    success: "#10B981",
    danger: "#EF4444",
    warn: "#F59E0B",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
  },
} as const;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: officialTheme.colors.navy,
          soft: officialTheme.colors["navy-soft"],
        },
        slate: officialTheme.colors.slate,
        paper: officialTheme.colors.paper,
        ink: officialTheme.colors.ink,
        muted: officialTheme.colors.muted,
        line: officialTheme.colors.line,
        gold: {
          DEFAULT: officialTheme.colors.gold,
          dark: officialTheme.colors["gold-dark"],
        },
        cream: officialTheme.colors.cream,
        success: officialTheme.colors.success,
        danger: officialTheme.colors.danger,
        warn: officialTheme.colors.warn,
      },
      borderRadius: officialTheme.borderRadius,
      fontFamily: {
        sans: ["var(--font-vazir)", "Vazirmatn", "Tahoma", "sans-serif"],
      },
    },
  },
};

export default config;