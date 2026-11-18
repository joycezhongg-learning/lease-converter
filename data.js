// Market data for Lease Converter — retail leasing conventions, Asia-Pacific.
// Research compiled Nov 2026 from CBRE, JLL, Cushman & Wakefield (C&W) and others.
// See ../retail-rent-conventions.md for the full research table and sources.

window.LC_DATA = (() => {
  // Area units, expressed in square metres.
  const UNITS = {
    sqm:    { label: "m²",     long: "square metre", sqm: 1 },
    sqft:   { label: "sq ft",  long: "square foot",  sqm: 0.09290304 },
    ping:   { label: "ping",   long: "ping 坪",       sqm: 400 / 121 },
    tsubo:  { label: "tsubo",  long: "tsubo 坪",      sqm: 400 / 121 },
    pyeong: { label: "pyeong", long: "pyeong 평",     sqm: 400 / 121 },
  };

  // Rent periods, expressed in months.
  const PERIODS = {
    day:   { label: "day",   months: 12 / 365 },
    month: { label: "month", months: 1 },
    year:  { label: "year",  months: 12 },
  };

  // Fallback FX (units per 1 USD). Used only if live rates can't load.
  const FX_FALLBACK = {
    date: "approximate fallback",
    rates: { USD: 1, CNY: 7.12, HKD: 7.78, TWD: 30.6, JPY: 151, KRW: 1395, SGD: 1.30,
             MYR: 4.21, THB: 32.6, IDR: 16550, VND: 26350, PHP: 58.4, INR: 88.4, AUD: 1.53 },
  };

  const CURRENCIES = {
    USD: "US dollar", CNY: "Chinese yuan", HKD: "Hong Kong dollar", TWD: "New Taiwan dollar",
    JPY: "Japanese yen", KRW: "Korean won", SGD: "Singapore dollar", MYR: "Malaysian ringgit",
    THB: "Thai baht", IDR: "Indonesian rupiah", VND: "Vietnamese dong", PHP: "Philippine peso",
    INR: "Indian rupee", AUD: "Australian dollar",
  };

  // trend: "up" | "down" | "flat"
  const MARKETS = [
    {
      id: "au", name: "Australia", currency: "AUD", unit: "sqm", period: "year",
      quote: "A$ per m² per year",
      basis: "Net lettable area (PCA method).",
      included: "Retail is often discussed as gross face rent (rent plus outgoings). Research such as CBRE reports net face rent, which excludes outgoings. Always confirm which one is quoted.",
      extras: ["Outgoings (building running costs) are passed to tenants on a net lease.", "Turnover (percentage) rent is common in shopping centres.", "Effective rents take off incentives and can sit well below face rents."],
      caution: "Australia quotes per year. Net vs gross face rent can differ by a large margin, so check which one you are comparing.",
      bench: { value: 1425, unit: "sqm", period: "year", freq: "Quarterly", what: "Perth regional shopping centre, net face", src: "CBRE", when: "Q2 2026", change: "+0.7% q-o-q", trend: "up",
               url: "https://www.cbre.com.au/insights/figures/perth-retail-figures-q2-2026" },
    },
    {
      id: "cn", name: "China (Mainland)", currency: "CNY", unit: "sqm", period: "day",
      quote: "RMB per m² per day",
      basis: "Net lettable area for mall retail (CBRE). Note this differs from office, which is quoted on gross floor area.",
      included: "Excludes the management fee, which is quoted separately. CBRE's headline includes tax.",
      extras: ["Benchmarks are ground-floor mall rents. Upper floors are much cheaper.", "Turnover rent is common in malls.", "Beijing and Shanghai both quote retail per day, even though Beijing office research is per month."],
      caution: "China quotes retail per day. A month is converted as 365 ÷ 12 = 30.42 days.",
      bench: { value: 31.4, unit: "sqm", period: "day", freq: "Quarterly", what: "Shanghai shopping centre, ground floor, citywide", src: "CBRE", when: "Q2 2026", change: "Declining", trend: "down",
               url: "https://mktgdocs.cbre.com/2299/a8d6f209-bfb2-4e2e-9ac2-f015311fdd3c-640012745/Q2_2026_Shanghai_Figures_EN_fi.pdf",
               extra: "Beijing: RMB 29.8 per m² per day (CBRE Q2 2026, −0.8% year to date)." },
    },
    {
      id: "hk", name: "Hong Kong", currency: "HKD", unit: "sqft", period: "month",
      quote: "HK$ per sq ft per month",
      basis: "Gross area for most shop listings. Lettable area in some research. Saleable area is used for sales, not leases.",
      included: "Excludes management fee, government rates and government rent.",
      extras: ["High-street benchmarks cover Central, Causeway Bay, Tsim Sha Tsui and Mong Kok.", "Gross-to-net efficiency varies building by building, so there's no single conversion."],
      caution: "Hong Kong shop areas are usually gross, not net. The same HK$ psf can mean very different usable space.",
      bench: { value: 844, unit: "sqft", period: "month", freq: "Quarterly", what: "Causeway Bay prime high street", src: "C&W", when: "Q1 (year to verify)", change: "−1% q-o-q", trend: "down",
               url: "https://www.thestandard.com.hk/finance/article/231703/Retail-rents-slip-in-Tsim-Sha-Tsui-Causway-Bay",
               extra: "Tsim Sha Tsui: HK$934 psf per month (same report). CBRE Q1 2026 high-street rents +0.9% q-o-q." },
    },
    {
      id: "in", name: "India", currency: "INR", unit: "sqft", period: "month",
      quote: "₹ per sq ft per month",
      basis: "Carpet area for retail (C&W: ground-floor vanilla stores for high streets, carpet area for malls). Office uses chargeable or super built-up area.",
      included: "Common area maintenance (CAM) is charged separately.",
      extras: ["Carpet area is net usable space, so retail rates per sq ft look higher than office rates on loaded area."],
      caution: "India retail is quoted on carpet area (net). Don't compare it directly with office rents on chargeable area.",
      bench: { value: 1750, unit: "sqft", period: "month", freq: "Quarterly", what: "Khan Market, Delhi (₹1,700–1,800 range)", src: "C&W", when: "Apr–Jun 2026", change: "+9% y-o-y", trend: "up",
               url: "https://www.outlookbusiness.com/news/retail-space-rent-in-delhis-khan-market-rises-9-annually-in-apr-jun-cw" },
    },
    {
      id: "id", name: "Indonesia", currency: "IDR", unit: "sqm", period: "month",
      quote: "Rp per m² per month",
      basis: "Semi-gross / net lettable area.",
      included: "Base rent and service charge are quoted separately.",
      extras: ["High-end malls command far higher rents than the citywide average."],
      caution: "Jakarta quotes base rent and service charge separately. Add the service charge before comparing.",
      bench: { value: 334800, unit: "sqm", period: "month", freq: "Quarterly", what: "Jakarta mall average, all grades", src: "CBRE", when: "Q2 2026", change: "Edging up", trend: "up",
               url: "https://mktgdocs.cbre.com/2299/5c417c89-3e48-4d2b-afae-d240f758524f-708398475/_CBRE__Jakarta_Retail_Figures_.pdf",
               extra: "High-end malls: about Rp880,000 per m² per month." },
    },
    {
      id: "jp", name: "Japan", currency: "JPY", unit: "tsubo", period: "month",
      quote: "¥ per tsubo per month",
      basis: "Contracted area. 1 tsubo = 3.306 m².",
      included: "Whether the common-area charge (kyōeki-hi 共益費) is included varies by source. Listings usually show it as a separate line. Excludes consumption tax.",
      extras: ["Ground-floor (1F) and upper-floor rents are reported separately. 1F commands a large premium.", "Prime streets: Ginza, Omotesando, Shinjuku."],
      caution: "Check whether the quote includes kyōeki-hi (common-area charge).",
      bench: { value: 112686, unit: "tsubo", period: "month", freq: "Quarterly", what: "Prime retail, Ginza and Omotesando", src: "JLL", when: "Q2 2026", change: "+3.2% q-o-q", trend: "up",
               url: "https://realestateasia.com/commercial-retail/in-focus/tokyo-retail-rents-rise-vacancy-remains-near-zero-in-prime-corridors",
               extra: "CBRE Ginza high-street average: about ¥296,000 per tsubo per month (Q1 2026)." },
    },
    {
      id: "my", name: "Malaysia", currency: "MYR", unit: "sqft", period: "month",
      quote: "RM per sq ft per month",
      basis: "Net lettable area (JLL).",
      included: "Usually gross, including the service charge.",
      extras: ["Prime City Centre malls in Kuala Lumpur sit far above the citywide average."],
      caution: null,
      bench: { value: 34.5, unit: "sqft", period: "month", freq: "Quarterly", what: "Kuala Lumpur City Centre, gross (figure not yet verified against JLL report)", src: "JLL via EdgeProp", when: "Q2 2026", change: "+0.8% y-o-y", trend: "up",
               url: "https://www.edgeprop.my/content/1916939/jll-kl-office-and-retail-vacancies-tighten-2q-flight-quality-gathers-pace" },
    },
    {
      id: "ph", name: "Philippines", currency: "PHP", unit: "sqm", period: "month",
      quote: "₱ per m² per month",
      basis: "Not stated in research. Confirm with the landlord.",
      included: "Common-area dues are often charged separately.",
      extras: [],
      caution: null,
      bench: { value: 1783, unit: "sqm", period: "month", freq: "Quarterly", what: "Metro Manila prime malls", src: "JLL", when: "Q2 2026", change: "+0.4% q-o-q", trend: "up",
               url: "https://realestateasia.com/commercial-retail/news/manila-retail-absorption-turns-negative-retailers-restructure" },
    },
    {
      id: "sg", name: "Singapore", currency: "SGD", unit: "sqft", period: "month",
      quote: "S$ per sq ft per month (psf pm)",
      basis: "Net lettable area.",
      included: "Gross rent, including the service charge.",
      extras: ["Ground-floor (first-storey) rents are quoted separately from whole-mall averages.", "Turnover rent is common in malls."],
      caution: null,
      bench: { value: 38.7, unit: "sqft", period: "month", freq: "Quarterly", what: "Orchard Road prime", src: "CBRE", when: "Q1 2026", change: "+0.5% q-o-q", trend: "up",
               url: "https://mktgdocs.cbre.com/2299/444570c0-6d6d-4179-a092-a52b34df83eb-1546489515/Figures_SG_Q1_2026.pdf",
               extra: "Orchard first-storey: S$41.95 psf per month (Realion, Q1 2026)." },
    },
    {
      id: "kr", name: "South Korea", currency: "KRW", unit: "pyeong", period: "month",
      quote: "₩ per pyeong per month (listings). Research uses ₩ per m².",
      basis: "Net lettable area for retail (JLL). Office uses gross floor area.",
      included: "Maintenance fee (gwanri-bi 관리비) is separate. A deposit (bojeung-geum 보증금) is quoted alongside the monthly rent.",
      extras: ["Key money (gwonri-geum 권리금) is a lump sum paid to the outgoing tenant. It isn't part of rent, and it can be large on prime ground floors.", "Pyeong is used by agents. Official statistics use m²."],
      caution: "Korean retail deals often involve key money (권리금) on top of rent and deposit.",
      bench: { value: 49100, unit: "sqm", period: "month", freq: "Quarterly", what: "Seoul ground floor, shops in multi-unit retail buildings (집합상가)", src: "Korea Real Estate Board", when: "Q1 2026", change: "Myeongdong rising", trend: "up",
               url: "https://v.daum.net/v/8jx1jPJ6mn" },
    },
    {
      id: "tw", name: "Taiwan", currency: "TWD", unit: "ping", period: "month",
      quote: "NT$ per ping per month",
      basis: "Not stated in research. Listings commonly use registered area (權狀坪), which includes a share of common areas.",
      included: "Management fee is usually separate.",
      extras: ["East District shop rents are about 60% of their 2016 peak. Demand has shifted towards Xinyi department stores."],
      caution: null,
      bench: { value: 12100, unit: "ping", period: "month", freq: "Irregular (press reports of lease records)", what: "Zhongxiao East Rd Sec. 4, ground-floor shop lease", src: "UDN (lease record)", when: "Jul 2025", change: "Below 2016 peak", trend: "down",
               url: "https://money.udn.com/money/story/5621/8962223" },
    },
    {
      id: "th", name: "Thailand", currency: "THB", unit: "sqm", period: "month",
      quote: "฿ per m² per month",
      basis: "Gross.",
      included: "Gross rent, generally including the service charge.",
      extras: [],
      caution: null,
      bench: { value: 2722, unit: "sqm", period: "month", freq: "Quarterly", what: "Bangkok prime retail, gross", src: "JLL", when: "Q1 2026", change: "+0.6% q-o-q (Q2)", trend: "up",
               url: "https://realestateasia.com/commercial-retail/news/bangkok-prime-retail-rents-inch-06-in-q2" },
    },
    {
      id: "vn", name: "Vietnam", currency: "USD", unit: "sqm", period: "month",
      quote: "US$ per m² per month",
      basis: "Gross asking rent. The benchmark is the ground floor.",
      included: "Generally includes the service charge and excludes VAT.",
      extras: ["Rents are quoted in US dollars. Some research now also shows VND."],
      caution: "Vietnam retail is quoted in US dollars, not dong.",
      bench: { value: 238.2, unit: "sqm", period: "month", freq: "Quarterly", what: "Ho Chi Minh City centre, ground floor", src: "JLL", when: "Q2 2026", change: "+0.8% q-o-q", trend: "up",
               url: "https://research.jllapsites.com/appd-market-report/q1-2026-retail-ho-chi-minh-city/",
               extra: "City Fringe ground floor: US$66.8 per m² per month." },
    },
  ];

  // Date the benchmark figures were last checked against new releases.
  const CHECKED = "18 Nov 2026";

  return { UNITS, PERIODS, FX_FALLBACK, CURRENCIES, MARKETS, CHECKED };
})();
