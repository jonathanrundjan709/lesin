# 3. Information architecture
Two audiences share one shell. Nav is a top bar on desktop and stays a 3-item bar on mobile (few items → no hamburger).

```
Lesin
├── Cari guru  /              Parent. Filters → tutor rows → select ≤3 → request sheet → confirmation
├── Lesson hub /hub           Both. Parent: lessons + notes (read). Tutor: lessons + add note
└── Untuk tutor /tutor        Tutor. Balance → requests (unlock → WhatsApp) → buy leads → QRIS sheet
```
**Content hierarchy per screen**
- `/`: title → filters (area, subject, level) → result count + privacy note → rows (what they teach · where; credentials; level tags; rate; action) → sticky selection bar.
- `/tutor`: title + demo switcher → balance → requests → packs → fine print (expiry, not e-money).
- `/hub`: title + role tabs → lesson (subject·child, slot) → add-note form (tutor only) → note timeline.

**Row anatomy (tutor result).** Line 1 subjects · area. Line 2 education · years · rating · verified. Line 3 level tags. Right: rate/session + action. On mobile the action drops below, full width.

**Flows.** Parent: filter → select → "Kirim permintaan" → sheet (name, WhatsApp, subject/level/area, note) → confirmation. Tutor: request → "Buka · 1 lead" → "WhatsApp {nama}"; if 0 leads → scroll/pack picker → QRIS sheet → balance updates.
**Gaps to build later:** OTP login, request status for parents, verification upload, report button, admin.
