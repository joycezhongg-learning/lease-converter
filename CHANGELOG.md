# Changelog

Releases are numbered by the app's cache version (`VERSION` in `sw.js`). Weekly benchmark updates change only the figures in `data.js` and aren't listed here.

## v9, 20 Nov 2026: copy the result

- **Copy button** on the result card, replacing the "Market standard" tag. It copies a short summary to paste into a chat or an email: the route, area, rent, total rent, the exchange rate with its date in brackets, the market's warning, and a one-line disclaimer. It copies what's on screen, so it follows the Per, Area in and Currency toggles. The route and total-rent lines are bold in WhatsApp and Telegram (`*bold*`), and in email, Notes and Slack (formatted text). WeChat and SMS show the asterisks as typed.
- The unit labels above Area and Rent are now the same size and colour as the field labels, and sit just inside the field's rounded corner.
- Field text and wheel lists are now 16px, the smallest size at which iPhone Safari doesn't zoom when a field is tapped.

## v8, 20 Nov 2026: mobile-first Convert screen

Brokers mostly use the app on the road, so the Convert screen was rebuilt for phones.

- **Market wheels.** From and To are now two side-by-side scroll wheels that show three markets each, with a swap button between them. They replace the two market dropdowns. The selected market always sits fully inside the selection band.
- **The last From market is remembered**, so a broker who always quotes from one market only changes To. On a first visit, the From market is guessed from the phone's time zone.
- **Area and rent on one row.** Unit, currency and period are filled in from the From market and summarised in one line. **Change** reveals them and **Hide** tucks them away. Ping, tsubo and pyeong appear as one option, "ping / tsubo / pyeong", because they are the same unit.
- **Result toggles.** The result can be shown per day, month or year; in m², sq ft or ping/tsubo/pyeong; and in the destination's currency, the From currency, or US$. Total rent follows the chosen period. A "Custom view" tag shows when the result isn't in the market's standard terms.
- **Swap carries your figures across.** The converted area and rent become the new inputs, so swapping twice returns the numbers you typed.
- Inputs use the same text size as the wheels (16.5px), large enough that iPhone Safari doesn't zoom in when you tap a field.

## v7, 18 Nov 2026: United States and United Kingdom

- Added the United States (US$ per sq ft per year) and the United Kingdom (£ per sq ft per year, Zone A, converted as typed with a warning).
- Added GBP. Saved exchange rates now refetch when a currency is missing.

## Earlier, 18 Nov 2026: first release

- Convert, Market guides and Trends for 13 Asia-Pacific markets, with live exchange rates and offline use.
