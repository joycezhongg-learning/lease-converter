# Lease Converter

**Convert retail rents and floor areas between Asia-Pacific markets, in the way each market actually quotes them.**

**→ Open the app: [joycezhongg-learning.github.io/lease-converter](https://joycezhongg-learning.github.io/lease-converter/)**

Retail leasing across Asia-Pacific has no common standard for quoting rent:

- **Shanghai** quotes RMB per m² per **day**.
- **Tokyo** quotes yen per **tsubo** per month.
- **Seoul** quotes won per **pyeong** per month.
- **Singapore** quotes S$ per **sq ft** per month.
- **Sydney** quotes A$ per m² per **year**.

Lease Converter is a small, fast web app that turns a rent and an area into another market's terms in one step. It's built for retail real estate brokers to use mid-conversation with a client.

---

## What it does

**Convert.** Enter a market, an area and (optionally) a rent. Pick a destination market and you get:

- the area in the destination's unit (plus m², sq ft and ping/tsubo/pyeong)
- the rent as the destination market would quote it
- the total monthly and yearly rent, in both currencies
- a short warning where the market has a known quirk, such as key money in Korea or gross-area shop listings in Hong Kong

**Market guides.** For each market: the area unit, quoting period, currency, area basis, what the headline rent includes, retail-specific notes, and the latest benchmark with its source.

**Trends.** The latest headline retail rent for every market, in local terms and normalised to US$ per m² per month, sorted highest first.

## Markets covered

| Market | Retail rent is quoted as |
|---|---|
| Australia | A$ per m² per year |
| China (Mainland) | RMB per m² per day |
| Hong Kong | HK$ per sq ft per month |
| India | ₹ per sq ft per month (carpet area) |
| Indonesia | Rp per m² per month (+ service charge) |
| Japan | ¥ per tsubo per month |
| Malaysia | RM per sq ft per month |
| Philippines | ₱ per m² per month |
| Singapore | S$ per sq ft per month |
| South Korea | ₩ per pyeong per month |
| Taiwan | NT$ per ping per month |
| Thailand | ฿ per m² per month |
| Vietnam | US$ per m² per month |

Ping (Taiwan), tsubo (Japan) and pyeong (Korea) are the same unit: **1 = 400⁄121 m² ≈ 3.306 m² ≈ 35.58 sq ft**. Per-day rents convert to per-month at **365 ÷ 12 = 30.42 days**.

## Install it on your phone

It's a Progressive Web App, so it installs from the browser with no app store.

- **iPhone:** open the link in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** open the link in Chrome, tap **⋮**, then **Add to Home screen**.

It opens full-screen like a native app. After the first visit it also works offline, using the most recently loaded exchange rates.

## Data and how often it updates

| Data | Source | Updated |
|---|---|---|
| Exchange rates | [open.er-api.com](https://open.er-api.com) | The source publishes daily. The app checks for new rates each time it opens, at most every 12 hours. |
| Rent benchmarks | CBRE, JLL and Cushman & Wakefield research, plus Korea Real Estate Board and reputable press that cites these | The sources publish quarterly. The data is checked for new releases every week. |
| Quoting conventions | Broker research, confirmed against local market practice | Reviewed as needed |

Each benchmark in the app links to its original source and shows when it was last checked.

> **Disclaimer:** All figures are indicative and come from public research. Conventions vary by landlord and building. Always verify a quote's area basis, what's included (service charge, management fee, outgoings), and the latest figures before advising a client.

## How it's built

Plain HTML, CSS and JavaScript, with no framework, build step or dependencies.

```
index.html             Page structure and the three views (Convert, Markets, Trends)
app.css                Styles, light and dark themes, responsive layout
app.js                 Conversion logic, routing, exchange-rate loading
data.js                Market conventions and rent benchmarks (the file the weekly update edits)
sw.js                  Service worker for offline use
manifest.webmanifest   Home-screen app settings
```

- **Accessibility:** every input is labelled, results are announced to screen readers, keyboard focus is visible, tap targets are at least 44px, and the app respects Reduce Motion and Reduce Transparency.
- **Privacy:** there are no accounts, no tracking and no analytics. The only outside request is for exchange rates.

### Run it locally

```bash
python3 -m http.server 5178
```

Then open <http://localhost:5178>.

### Updating the data

Benchmarks live in `data.js`. Each market has one `bench` object (value, unit, period, source, date, link).

After changing any file, bump the `?v=` numbers in `index.html` and `VERSION` in `sw.js`, so that installed copies pick up the change.
