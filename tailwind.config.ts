import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#2E7D32",
          navy: "#0F172A"
        }
      },
      boxShadow: {
        soft: "0 20px 45px -30px rgba(15, 23, 42, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
