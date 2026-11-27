# 4. Design tokens
Defined as CSS custom properties in `src/app/theme.css` (light + `prefers-color-scheme: dark`). Tailwind colours (`bg-canvas`, `text-subtle`, `bg-accent`, …) map to them in `tailwind.config.ts`. No component may use raw palette colours (`stone-*`, `teal-*`).
Groups: colour (canvas, surface, sunken, line, ink, subtle, accent, danger, notice) · type scale 12/14/16/20/24 · spacing 4 px grid · radius sm/md/lg · sheet shadow · 44 px touch target.
