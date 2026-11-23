# Changelog

Releases are numbered by the app's cache version (`VERSION` in `sw.js`). Weekly benchmark updates change only the figures in `data.js` and aren't listed here.

## v10, 23 Nov 2026: one-screen Convert, total rent and a language button

The Convert screen is rebuilt so a broker sees the whole answer without scrolling. On a 375px phone the toggles now end at about 617px, inside the first screen.

- **Two cards instead of wheels.** The **From card** holds the From market with the Area and Rent you type, so the inputs sit under the market they describe. The **To card** holds the To market with the result. The swap button sits between them, and pressing it no longer changes its colour.
- **Market list instead of scroll wheels.** Tap a market's name to open a list of all 15 markets, each showing how it quotes rent (e.g. "¥ per tsubo per month").
- **Total rent for the whole space.** Tap the unit label in the Rent box to enter either a rent per unit or the total for the space, as US and Australian listings often quote it. Switching keeps the same rent where the area allows.
- **Simpler Change panel.** One **Unit** setting now covers both area and rent, and the rent currency always follows the From market. The rent-currency menu is gone; **Rent per** stays.
- **Results and toggles in one order:** Area, Rent, Total rent; then Area in, Rent per, Currency. Each result shows its icon, label, number and unit on one line.
- **New look**, closer to Notion: a warm off-white page, white cards with hairline rows, the phone's system font, small grey input boxes and outline icons. The selected tab is grey instead of black, and the result card is no longer black.
- **Language button.** A globe at the end of the navigation bar opens an App language menu: English, with Simplified Chinese, Traditional Chinese and Japanese marked "Coming soon".
- The small grey lines under each result (US$ per m², other units, other periods) are gone, since the toggles show the same thing.

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
