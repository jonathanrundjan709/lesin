import type { Config } from "tailwindcss";
const v = (n: string) => `var(--${n})`;
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: { canvas: v("canvas"), surface: v("surface"), sunken: v("sunken"), "sunken-strong": v("sunken-strong"), line: v("line"), "line-strong": v("line-strong"), ink: v("ink"), subtle: v("subtle"), accent: v("accent"), "accent-strong": v("accent-strong"), "accent-fg": v("accent-fg"), danger: v("danger"), notice: v("notice") },
    borderRadius: { sm: v("radius-sm"), md: v("radius-md"), lg: v("radius-lg") },
    boxShadow: { sheet: v("shadow-sheet") },
    minHeight: { target: v("target") }, minWidth: { target: v("target") },
  } },
  plugins: [],
} satisfies Config;
