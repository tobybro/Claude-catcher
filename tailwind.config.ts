import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        score: {
          good: "#22c55e",
          okay: "#eab308",
          bad: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};

export default config;
