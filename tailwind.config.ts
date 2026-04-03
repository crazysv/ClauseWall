import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'impact-hero': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '900' }],
        'impact-heading': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '800' }],
        'impact-stat': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '900' }],
      },
    },
  },
  plugins: [],
};
export default config;
