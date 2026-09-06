# Design System — AquaPay

## 1. Visual theme

**Color strategy:** Restrained. Pale greenbar neutrals, one stamp-brick accent for primary actions and the current nav item.

**Reference:** Continuous-form accounting paper — the pale green "greenbar" stock, with a red rubber stamp on it. Chosen deliberately over the warm cream off-white, which has become the reflex surface and reads as generic. The green is barely there (chroma 0.008); it registers as "not white" before it registers as green.

**Scene:** Morning in the community hall. Fluorescent tube plus an open door to Retalhuleu sun. Paper, ink, a calculator. Light is the default. Dark is the same room after dusk, under a lamp, never pure black.

**Mood:** Ledger. Hairline rules. Tight corners. No glow, no glass, no decorative grid.

## 2. Color

Use OKLCH tokens in `frontend/src/app/globals.css`. Do not use `#000` or `#fff`.

| Role | Light | Dark | Use |
|---|---|---|---|
| Background | Greenbar paper | Lamp charcoal | App canvas |
| Foreground | Cool ink | Pale paper | Body, headings |
| Primary | Stamp brick | Lighter stamp | Primary button, key numbers |
| Muted | Dusted paper | Raised lamp surface | Hover, zebra, chips |
| Border | Soft rule | Dim rule | 1px only |
| Destructive | Ink red | Ink red | Errors |
| Success | Ledger green | Ledger green | Paid / active |

Accent usage ≤10% of the surface. Never color-code every icon.

Disabled states get their own colours (`muted` on `muted-foreground`). Never stack
opacity on a filled control — 40% on the primary button lands at 1.2:1 and vanishes.

## 3. Typography

- UI: `Source Sans 3` (not Inter, not Roboto)
- Data (DPI, receipt no., money): `Source Code Pro`
- Fixed rem scale, ratio ~1.2 (`--text-caption` 0.8125, `--text-body` 1, `--text-subhead` 1.125, `--text-heading` 1.5)
- H1 1.5rem / 600. H2 1.125rem / 600. Body 1rem / 400. Meta 0.8125rem
- No uppercase tracking labels. Sentence case.
- Nothing below 0.8125rem. Use `text-caption`, never `text-xs`.
- Everything monospaced gets slashed zero and tabular figures automatically
  (base rule on `.font-mono`). A DPI must never read `0` as `O`.

## 4. Layout

- Admin: 15rem sidebar, content max 72rem
- Treasurer: top bar, same content width
- Spacing: 8 / 12 / 16 / 24 / 40. Vary rhythm; do not stack identical `space-y-6` cards
- Radius: 6px (`--radius`) everywhere; 4px only for controls under 28px. No 16px panels
- Elevation: hairline border, no drop shadow. The single exception is a layer that
  floats over content it does not own (toast): 1px border plus a 10% scrim shadow
- Modal scrim: tinted `foreground/25`. No backdrop blur

## 5. Components

- **Button:** 6px radius, 44px on touch / 40px on desktop. Primary = stamp fill.
  Hover darkens the fill (`color-mix` toward foreground); never fades it with opacity,
  which lets the paper bleed through and looks washed.
- **Input:** 6px, 44px touch / 40px desktop, 1px border.
- **Nav active:** muted fill + medium weight. Not inverted pills.
- **Stats:** one horizontal ledger row, hairline above, whitespace between columns.
  No vertical rules (they strand themselves when the grid wraps). No icon boxes.
- **Table:** 44px header row in caption size and muted; 12px cell padding; first and
  last cells flush to the edge. Money carries the weight, identifiers stay muted.
- **Empty:** a sentence and an action. No dashed card with a huge icon.
- **Toast:** paper card with a hairline, bottom-right. Colour lives in the text,
  never in the fill. Do not use sonner's `richColors`.
- **Skeleton:** must trace the shape of what loads in. A circle where no avatar
  will appear is a lie.
- **Wordmark:** type only. No droplet tile.

### Focus

Two tiers, one visual language, applied by a single base rule.

- **Fields:** border inks to `--ring` plus a 2px halo at 25%, no offset. Reads as the
  field itself waking up.
- **Buttons, links, everything else:** 2px ring at 50% with a 2px background offset,
  so the ring stays legible against a filled control.

Never `outline: none` without a replacement.

## 6. Do / Don't

**Do**
- Put the next receipt number near the emit action
- Use tabular lining figures for money and dates
- Keep Spanish copy local and short

**Don't**
- Droplet / water motifs
- Four equal metric cards
- Side-stripe accents, gradient text, glass headers
- "Bienvenido de nuevo"
- Nested cards or avatar initials on every row
- Library defaults left visible (`richColors` toasts, 8px shadcn radius, `ring-3`)
