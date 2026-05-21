import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* Shadcn compat */
        background:  "var(--background)",
        foreground:  "var(--foreground)",
        card: {
          DEFAULT:    "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT:    "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT:    "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT:    "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT:    "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT:    "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT:    "var(--destructive)",
          foreground: "var(--destructive-foreground, #ffffff)",
        },
        border: "var(--border)",
        input:  "var(--input)",
        ring:   "var(--ring)",
        sidebar: {
          DEFAULT:              "var(--sidebar)",
          foreground:           "var(--sidebar-foreground)",
          primary:              "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent:               "var(--sidebar-accent)",
          "accent-foreground":  "var(--sidebar-accent-foreground)",
          border:               "var(--sidebar-border)",
          ring:                 "var(--sidebar-ring)",
        },

        /* OMARA surface tokens */
        surface: {
          DEFAULT:              "var(--surface)",
          "container-lowest":   "var(--surface-container-lowest)",
          "container-low":      "var(--surface-container-low)",
          container:            "var(--surface-container)",
          "container-high":     "var(--surface-container-high)",
        },
        "on-surface": {
          DEFAULT:  "var(--on-surface)",
          variant:  "var(--on-surface-variant)",
        },
        outline: {
          DEFAULT:  "var(--outline)",
          variant:  "var(--outline-variant)",
        },

        /* OMARA primary scale */
        "primary-container":  "var(--primary-container)",
        "primary-fixed":      "var(--primary-fixed)",
        "primary-fixed-dim":  "var(--primary-fixed-dim)",

        /* OMARA semantic */
        "success-green":  "var(--success)",
        "warning-yellow": "var(--warning)",
        "error-red":      "var(--error)",
        "sky-accent":     "var(--sky-accent)",
        "navy-text":      "var(--navy-text)",
      },

      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
        xl:  "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },

      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },

      fontSize: {
        /* OMARA type scale */
        "label-md":  ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-sm":   ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "body-md":   ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg":   ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-sm": ["18px", { lineHeight: "24px", fontWeight: "600" }],
        "headline-md": ["22px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["28px", { lineHeight: "36px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "data-mono": ["14px", { lineHeight: "20px", letterSpacing: "0.02em", fontWeight: "500" }],
      },

      boxShadow: {
        card: "0px 4px 8px rgba(9,30,66,0.08)",
        "card-lg": "0px 8px 16px rgba(9,30,66,0.12)",
      },
    },
  },
  plugins: [],
};
export default config;
