# Design System — AquaPay

## 1. Visual theme

**Color strategy:** Restrained. Cool slate neutrals, one administrative blue for
primary actions and the current nav item.

**Reference:** A municipal counter — slate desk, white forms, a stamped blue
header. Chosen after three warm-paper directions (cream, greenbar, receipt
stock) were all rejected: they read as costume rather than as a tool. Blue on
slate is the least romantic option available, which is the point.

**Scene:** A community office with the lights on. The furniture is dark, the
paperwork is white, the canvas between them is pale slate. Light is the default;
dark is the same room at night, never pure black.

**Mood:** Ledger. Hairline rules. Sheets on a desk. No glow, no glass, no
decorative grid.

## 2. Color

Use OKLCH tokens in `frontend/src/app/globals.css`. Do not use `#000` or `#fff`.

Every neutral sits on hue 250–260, including the dark furniture. That shared hue
is what keeps the top bar reading as part of the room instead of a black band
pasted over it.

| Role | Light | Dark | Use |
|---|---|---|---|
| Sidebar | Deep slate 0.222 | Deepest slate 0.142 | Top bar, the only dark furniture |
| Background | Pale slate 0.971 | Night slate 0.196 | App canvas |
| Card | Near-white 0.999 | Raised slate 0.238 | Sheets that hold content |
| Foreground | Cool ink | Pale slate | Body, headings |
| Primary | Administrative blue | Lifted blue | Primary button, active nav, key numbers |
| Muted | Dusted slate | Lamp surface | Hover, zebra, chips |
| Border | Soft rule | Dim rule | 1px only |

**Four surfaces, one staircase.** Furniture → canvas → sheet, plus muted for
interior fills. In light the sheet is the brightest thing on screen; in dark the
order inverts but the furniture stays the deepest step. Do not invent a fifth
level; if something needs to separate, give it a hairline, not a new grey.

Accent usage ≤10% of the surface. Never color-code every icon. One saturated
control per table row — a state badge next to a state toggle is the same fact
twice, and eight of them stack into a stripe that outshouts the data.

Disabled states get their own colours (`muted` on `muted-foreground`). Never
stack opacity on a filled control — 40% on the primary button lands at 1.2:1 and
vanishes.

## 3. Typography

- UI: `Nunito` — remates redondos, más cercano a un mostrador que a una terminal.
  IBM Plex era demasiado cuadrado para los paneles.
- Data (DPI, receipt no., money): `IBM Plex Mono`
- Fixed rem scale (`--text-caption` 0.8125, `--text-body` 1, `--text-subhead`
  1.125, `--text-heading` 1.875)
- H1 1.875rem / 600 / -0.025em. H2 1.125rem / 600. Body 1rem / 400. Meta 0.8125rem
- The H1-to-body jump is deliberately close to 2×. At 1.5rem the page title was
  competing with card titles and nothing read as the top of the page.
- No uppercase tracking labels. Sentence case.
- Nothing below 0.8125rem. Use `text-caption`, never `text-xs`.
- Everything monospaced gets slashed zero and tabular figures automatically
  (base rule on `.font-mono`). A DPI must never read `0` as `O`.

## 4. Layout

- **One shell for both roles.** A single dark top bar, full width, sticky. What
  changes between administrator and treasurer is the set of links, not the
  furniture. Two different chromes for two roles was twice the code and taught
  the user the app twice.
- Content is full-bleed with `px-4 / sm:px-6 / lg:px-8`, left-aligned. Nothing is
  centered in a column — a centered card on a full-width page reads as an
  unfinished screen next to a left-aligned one.
- Prose stays readable via `max-w-prose` on descriptions; narrow forms cap their
  own width (`max-w-xl`) but stay flush left.
- Vertical rhythm: `PageStack` at 28px between blocks. Spacing scale 8 / 12 / 16 /
  20 / 28.
- Radius: 8px (`--radius`) everywhere; 4px only for controls under 28px.
- Elevation: hairline border, no drop shadow. The single exception is a layer
  that floats over content it does not own (toast): 1px border plus a 10% scrim.
- Modal scrim: tinted `foreground/25`. No backdrop blur.

## 5. Components

- **Top bar:** 56px, `bg-sidebar`, wordmark left, links beside it, identity and
  session controls right. Active link is a filled blue pill; the rest sit at 65%
  and come up to full on hover. Controls on the bar draw their border from
  `currentColor`, so the same component works on dark furniture and on the light
  login canvas.
- **Button:** 8px radius, 44px on touch / 40px on desktop. Primary = blue fill.
  Hover darkens the fill (`color-mix` toward foreground); never fades it with
  opacity, which lets the canvas bleed through and looks washed.
- **Input:** 8px, 44px touch / 40px desktop, 1px border. Controls sitting in the
  same row must share a height — a 40px field beside 32px pills is the tell.
- **Stats:** one sheet divided by hairlines, not five floating cards. The grid
  uses negative margins so the trailing rules get clipped and the strip can wrap
  on mobile without leaving stray lines.
- **Table:** lives inside a card. 44px header row in caption size and muted;
  12px cell padding; first and last cells pad to 20px so they line up with the
  card's own padding and its section headers. Money carries the weight,
  identifiers stay muted.
- **Empty:** a sentence and an action, centered in the space it is standing in.
  An empty chart card with the message pinned to the top-left is just a hole.
- **Toast:** paper card with a hairline, bottom-right. Colour lives in the text,
  never in the fill. Do not use sonner's `richColors`.
- **Skeleton:** must trace the shape of what loads in, including its radius.
- **Wordmark:** type only, inheriting `currentColor`. No droplet tile.

### Focus

Two tiers, one visual language, applied by a single base rule.

- **Fields:** border inks to `--ring` plus a 2px halo at 25%, no offset. Reads as
  the field itself waking up.
- **Buttons, links, everything else:** 2px ring at 50% with a 2px background
  offset, so the ring stays legible against a filled control.

Never `outline: none` without a replacement.

## 6. Do / Don't

**Do**
- Put the next receipt number near the emit action
- Use tabular lining figures for money and dates
- Keep Spanish copy local and short
- Verify mobile with a real viewport override; `--window-size` on Windows lies
  about the layout viewport and invents overflow that isn't there

**Don't**
- Droplet / water motifs
- Four equal metric cards
- Side-stripe accents, gradient text, glass headers
- "Bienvenido de nuevo"
- Nested cards or avatar initials on every row
- Library defaults left visible (`richColors` toasts, 8px shadcn radius, `ring-3`)
- Two controls stating the same fact in one cell
