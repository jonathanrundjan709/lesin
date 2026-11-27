# Lesin design system (MASTER)
Generated with ui-ux-pro-max (`search.py --design-system`, then narrowed by `--domain product|color|style|typography`). The default top match (purple "Vibrant & Block-based") was **rejected**: wrong tone for parents choosing a stranger to enter their home.

**Chosen (verified in skill data):** Marketplace (P2P) → *Flat Design* + *Accessible & Ethical*; palette *LMS* (education teal + amber); type *Friendly SaaS* (Plus Jakarta Sans); Lucide SVG icons; mobile bottom nav.

| Token | Light | Note |
|---|---|---|
| canvas | #F0FDFA | skill LMS background |
| ink | #134E4A | skill LMS foreground |
| subtle | #475569 | skill muted foreground |
| accent (primary) | #0F766E | skill teal #0D9488 darkened for 4.5:1 with white text |
| cta (costs a lead / money) | #D97706 + dark text | skill LMS accent, 5.7:1 with #1C1917 |
| line | #CFE8E3 | |
Semantic rule: **teal = free / navigation / selection; amber = spends a lead or money.**
Rules: SVG icons only; ≥44 px targets; visible focus; hover feedback 150 ms; reduced motion respected; no raw colours in components (use tokens in `src/app/theme.css`).
