# 7. Design review (Playwright, 375×800 and 1280×800, light + dark)
Method: headless Chromium, screenshots of `/`, request sheet, `/tutor`, `/hub`; script checks horizontal overflow and 44 px touch targets.

| # | Finding | Severity | Fix |
|---|---|---|---|
| 1 | Header links under 44 px tall | Medium (a11y) | `min-h-target` on nav + logo |
| 2 | Mobile filters stacked into 3 full rows, pushing results below the fold | Medium | 2-column grid, Area spans full width |
| 3 | Request sheet long on phones (3 stacked selects) | Low | Same 2-column pattern |
| 4 | Mobile row action and price on separate rows | Pass | Rate left, action right; full-width action on tutor board |
| 5 | Dark mode: contrast, borders, selected state | Pass | Tokens only, no raw colours |
| 6 | Horizontal scroll | Pass | None at 375 or 1280 |

Not verified: screen-reader pass, Lighthouse, real devices, Bahasa copy with native reviewer, empty/error states in a live browser (implemented, not screenshotted).
Open: parent-side request status page, OTP, verification upload, report flow, admin console (see PRD §12).
