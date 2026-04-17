# Tradeflow Brand Pack

Everything needed to represent Tradeflow in digital, print, and social contexts. Version 1 — April 2026.

## What's in this pack

| Folder | Use for |
|---|---|
| `svg/` | Web, email signatures, responsive layouts, anything that needs to scale. Edit in Figma / Illustrator / any vector tool. |
| `png/` | Slack avatars, keynote decks, social posts, anywhere that needs a raster image. Transparent background. |
| `pdf/` | Print deliverables — business cards, signage, merchandise. Hand these to your printer. |
| `favicon/` | Browser tab icons and mobile web-app icons. |

## Logo variants

- **`tradeflow-logo`** — Horizontal lockup (icon + wordmark) on dark backgrounds. Default.
- **`tradeflow-logo-light`** — Horizontal lockup on light backgrounds. Dark wordmark; the icon stays on its self-contained dark badge for maximum contrast.
- **`tradeflow-icon`** — The mark alone. Use when space is tight (favicons, avatars, stickers, loading screens).

## Color palette

| Role | Hex | RGB | CMYK (print) | Pantone (closest) |
|---|---|---|---|---|
| Gold (primary accent) | `#D4AF37` | 212, 175, 55 | 0, 17, 74, 17 | Pantone 7555 C |
| Gold highlight | `#F2D378` | 242, 211, 120 | 0, 13, 50, 5 | — |
| Gold shadow | `#9E7C17` | 158, 124, 23 | 0, 22, 85, 38 | — |
| Black (background) | `#0A0A0A` | 10, 10, 10 | 0, 0, 0, 96 | Black 6 C |
| Off-white (text on dark) | `#F5F5F5` | 245, 245, 245 | 0, 0, 0, 4 | — |

The gold is a three-stop gradient in the vector files — not a flat color. On print, substitute a single Pantone 7555 C for solid runs, or specify gold foil for premium cards.

## Typography

- **Wordmark** — Gambetta Semibold (available free at [fontshare.com/fonts/gambetta](https://www.fontshare.com/fonts/gambetta))
- **Fallback** — Georgia Bold (system font, renders safely when Gambetta isn't available)
- **UI body** — General Sans (fontshare.com) / Poppins (Google Fonts)

If sending a PDF to a printer, either install Gambetta on their machine or ask them to convert the wordmark text to outlines before proofing. The vector PDFs in this pack render the text with system Georgia — mention this explicitly if exact typography matters.

## Minimum sizes

- **Icon alone** — 16px on screen, 10mm in print
- **Horizontal lockup** — 120px wide on screen, 30mm in print. Below that, use the icon alone.

## Clear space

Leave a margin around the logo equal to the height of the "T" in the wordmark. No other elements (text, edges, imagery) inside that zone.

## What NOT to do

- Don't recolor the icon badge or wordmark outside the palette above
- Don't stretch or squish — scale proportionally only
- Don't add drop shadows, bevels, or outer glows
- Don't place the dark-badge icon on a busy photo without a solid panel behind it
- Don't rebuild the wordmark in a different typeface

## Business card guidance

- Recommended stock: matte black 16pt with gold-foil mark on the front
- Alternate: soft-touch white 14pt with the dark-badge icon printed as a 4-color process
- Spot gloss or foil on just the icon reads most premium — the wordmark can stay flat ink
- Card dimensions: 3.5" × 2" (US) or 85mm × 55mm (EU/UK)

## File naming convention

`tradeflow-{variant}-{size}.{ext}` — version bumps go in a new folder (`brand/v2/...`), never overwrite.

## Questions

Reply to the email this pack came with. Source SVGs live in `apps/web/public/` in the Tradeflow repo if you need to regenerate any size.
