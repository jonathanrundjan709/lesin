import type { Config } from "tailwindcss";
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { ink: "#14231f", cream: "#fbf7ef", pine: { 50:"#eef7f3",100:"#d5ece3",500:"#1f8a6b",600:"#17705a",700:"#125a49",900:"#0b3a30" }, saffron: { 100:"#fdf0cf",400:"#f5b82e",500:"#e6a110" } },
    fontFamily: { sans: ["ui-sans-serif","system-ui","-apple-system","Segoe UI","Roboto","sans-serif"], display: ["ui-serif","Georgia","Cambria","serif"] },
    borderRadius: { xl2: "1.25rem" },
    boxShadow: { card: "0 1px 2px rgba(20,35,31,.06), 0 8px 24px -12px rgba(20,35,31,.18)" }
  } },
  plugins: [],
} satisfies Config;
