# Lesin design system (MASTER)
Generated with ui-ux-pro-max (`search.py --design-system`, then narrowed by `--domain product|color|style|typography`). **Update:** palette switched from teal to the purple of `lesin-mvp/` (accent #5B4BFF) so staging matches the MVP; amber CTA kept.

**Chosen (verified in skill data):** Marketplace (P2P) → *Flat Design* + *Accessible & Ethical*; palette purple + amber; type *Friendly SaaS* (Plus Jakarta Sans); Lucide SVG icons; mobile bottom nav.

| Token | Light | Note |
|---|---|---|
| canvas | #F6F5FB | MVP background |
| ink | #17162B | MVP ink |
| subtle | #4A4866 | skill muted foreground |
| accent (primary) | #5B4BFF | from lesin-mvp, 6:1 with white text |
| cta (costs a lead / money) | #D97706 + dark text | skill LMS accent, 5.7:1 with #1C1917 |
| line | #DEDBF5 | |
Semantic rule: **purple = free / navigation / selection; amber = spends a lead or money.**
Rules: SVG icons only; ≥44 px targets; visible focus; hover feedback 150 ms; reduced motion respected; no raw colours in components (use tokens in `src/app/theme.css`).
