# Lease Convert design system

One system, two places that use the same names:

| | Code | Figma |
|---|---|---|
| Where | `app.css` (tokens at the top) | Lease Convert file → **Design system** page |
| Tokens | CSS custom properties (`--color-text`) | Variables (`color/text`), WEB code syntax `var(--color-text)` |
| Light / dark | `prefers-color-scheme` + `data-theme` | **Color** collection, modes Light / Dark |
| Type | `--text-*`, `--weight-*` | Text styles `LC/*` (SF Pro), sizes bound to `text/*` |
| Elevation | `--shadow-*` | Effect styles `LC/Shadow *` |
| Living reference | `styleguide.html` (renders the real CSS) | Component sets with descriptions + a Convert screen built only from instances, Light and Dark |

## Tokens

- **Colour (21 + 2 glass):** named by job, not hue. `bg`, `surface`, `fill` (inputs, tracks, current tab, chips), `selected`, `text`, `text-2`, `text-muted`, `border`, `border-strong`, `accent` (blue = tap me), `on-accent`, `label-from` (orange), `label-to` (purple), `positive`, `negative`, `warn-bg`, `warn-text`, `setting-open` (globe yellow), `scrim`, `seg-on-bg`, `seg-on-text`; Figma also has `glass-fill`, `glass-edge` (code uses a gradient).
- **Type:** caption 12, small 13, body 15, lead 18, number 20, title 24; regular / semibold / bold; system font.
- **Space:** 4px base with half steps: 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40.
- **Radius:** xs 6 (unit button, segment), sm 8 (input, track, callout, menu item), md 12, lg 14 (cards, menus), sheet 22, pill.
- **Control heights:** 28 text button, 32 chip/unit, 36 tab/segment, 38 input, 40 select/icon/outline, 44 tap minimum.
- **Motion:** `--ease-out`, `--ease-drawer`, `--ease-spring-open` / `--ease-spring-back` (the logo and globe tilts).

## Components (code class → Figma component)

| Component | Code | Figma | Variants / properties |
|---|---|---|---|
| Icon | `.ic`, `.ic.sm` | `Icon/*` (17) | 20px default, 16px small |
| Button | `.btn .btn--chip/outline/primary/icon/text/unit` | `Button` | Variant × State; Label, Show icon, Icon (swap), Show trailing icon |
| Nav pill | `.nav-pill` | `Nav pill` | built from Nav logo, Nav tab, Nav globe |
| Nav tab | `.nav-tab` | `Nav tab` | State = Default / Current |
| Nav logo | `.nav-logo` | `Nav logo` | State = Default / Current (tilted) |
| Nav globe | `.nav-globe` | `Nav globe` | State = Closed / Open |
| Menu | `.menu`, `#lang-menu`, `#basis-menu` | `Menu / Language`, `Menu / Rent basis` | |
| Menu item | `.menu-item`, `.menu-item--2line` | `Menu item` | Type × State |
| Card | `.card .card--from/--to` | (frame in the example) | |
| Card header | `.card-head`, `.card-label` | `Card header` | Side = From / To |
| Market select | `.market-select` | `Market select` | Market |
| Field row | `.field-row`, `.field-box` | `Field row` | Unit = Label / Menu; Label, Value |
| Segmented control | `.seg` | `Segment`, `Segmented control` | Selected |
| Toggle row | `.toggle-row`, `.toggle-label` | `Toggle row` | Label |
| Result row | `.results .row` | `Result row` | Label, Number, Unit, Icon |
| Callout | `.callout`, `.callout--warn` | `Callout` | Type = Neutral / Warn |
| Sheet option | `.mopt` | `Sheet option` | Current |
| List row | `.rows li a` | `List row` | Market, Convention |
| Trend tag | `.trendtag` | `Trend tag` | Trend = Up / Down / Flat |

Rules: components read tokens only. A view may place a component (margin, width) but not restyle it.

## Decisions (24 Nov 2026): one look per component

The first refactor kept five near-duplicates so nothing visible changed. They are now one each:

1. **Chip button = `color/fill`.** The lighter `fill-subtle` vanished on the page background (Email feedback sits on #f7f7f5, not a card), so it was retired. Copy Result is one shade darker than before.
2. **One menu spec.** Radius 14 = item radius 8 + 6px inset (radii nest, so the corners run parallel), soft border, `--shadow-menu`. `--shadow-popover` and `--radius-xl` retired.
3. **Segmented control** is `min(64%, 228px)` everywhere, so the toggles line up across the From and To cards. Track radius 8 = segment 6 + 2px inset. Unselected text is `text-2` instead of 78% / 85% opacity: a colour token reads the same on any background.
4. **Toggle labels** are `text-2` in both cards (was 70% opacity in one, `text-2` in the other).
5. **Off-scale values gone:** segment track 11 → 8, menu item 10 → 8, callout padding and gap 7 → 8 (the neutral callout is 2px taller).

Rule that came out of this: when a container has an inset, its radius is the child's radius plus the inset.

## Checking a CSS change changed nothing

`../tools/style-snapshot.js` records the computed style and position of every visible element in 11 app states (convert empty/filled, Change open, unit menu, market sheet, language menu, markets, market guide, trends, about, footer open). Copy it into the app folder you're serving, then in the browser console:

```js
await new Promise(r => { const s = document.createElement('script'); s.src = 'style-snapshot.js'; s.onload = r; document.head.appendChild(s); });
await __run('base', 'light')   // before the change, on a fresh load
await __run('cmp', 'light')    // after the change, on a fresh load: count 0 = identical
```

Run it at 375px in light and dark. Delete the copy before shipping.
