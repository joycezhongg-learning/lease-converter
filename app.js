(() => {
  const { UNITS, PERIODS, FX_FALLBACK, CURRENCIES, MARKETS, CHECKED } = window.LC_DATA;
  const $ = (id) => document.getElementById(id);
  const byId = Object.fromEntries(MARKETS.map((m) => [m.id, m]));

  // ---------- storage (best-effort) ----------
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // ---------- FX ----------
  let FX = { ...FX_FALLBACK, live: false };
  const FX_KEY = "lc-fx-v1";
  async function loadFx() {
    const cached = store.get(FX_KEY);
    const complete = (c) => c && c.rates && Object.keys(CURRENCIES).every((k) => Number.isFinite(c.rates[k]));
    // Reuse saved rates only if they are fresh AND cover every currency (a newly added
    // currency, such as GBP, forces a refetch).
    if (complete(cached) && Date.now() - cached.fetched < 12 * 3600e3) { FX = cached; return; }
    try {
      const r = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
      const j = await r.json();
      if (j.result !== "success") throw new Error("fx");
      const rates = {};
      Object.keys(CURRENCIES).forEach((c) => { rates[c] = j.rates[c] ?? FX_FALLBACK.rates[c]; });
      FX = { rates, date: new Date(j.time_last_update_unix * 1000).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }), live: true, fetched: Date.now() };
      store.set(FX_KEY, FX);
    } catch {
      if (cached) FX = { ...cached, rates: { ...FX_FALLBACK.rates, ...cached.rates } };
    }
  }
  function fxNote() {
    return FX.live
      ? `Exchange rates from open.er-api.com, updated ${FX.date}. Indicative only.`
      : `Offline: using approximate built-in exchange rates. Reconnect for live rates.`;
  }

  // ---------- formatting ----------
  const SYM = { USD: "US$", CNY: "RMB ", HKD: "HK$", TWD: "NT$", JPY: "¥", KRW: "₩", SGD: "S$", MYR: "RM", THB: "฿", IDR: "Rp", VND: "VND ", PHP: "₱", INR: "₹", AUD: "A$", GBP: "£" };
  const BIG = new Set(["JPY", "KRW", "IDR", "VND"]);
  function num(v, maxFrac) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac, minimumFractionDigits: 0 }).format(v);
  }
  function money(v, cur) {
    const a = Math.abs(v);
    let mn, mx;
    if (BIG.has(cur)) { mn = 0; mx = a < 10 ? 2 : 0; }
    else if (a < 100) { mn = mx = 2; }
    else if (a < 1000) { mn = 0; mx = 1; }
    else { mn = mx = 0; }
    const s = new Intl.NumberFormat("en-US", { minimumFractionDigits: mn, maximumFractionDigits: mx }).format(v);
    return SYM[cur] + s;
  }
  function areaFmt(v) { return num(v, v < 100 ? 2 : v < 10000 ? 1 : 0); }
  const parse = (s) => { const n = parseFloat(String(s).replace(/[,\s_]/g, "")); return Number.isFinite(n) && n >= 0 ? n : null; };

  // ---------- form setup ----------
  const el = {
    fromMarket: $("from-market"), toMarket: $("to-market"), area: $("area"), fromUnit: $("from-unit"),
    rent: $("rent"), fromCur: $("from-cur"), fromRUnit: $("from-runit"), fromPeriod: $("from-period"),
    toCur: $("to-cur"), toRUnit: $("to-runit"), toPeriod: $("to-period"),
  };
  const opt = (v, t) => { const o = document.createElement("option"); o.value = v; o.textContent = t; return o; };
  [el.fromMarket, el.toMarket].forEach((s) => MARKETS.forEach((m) => s.append(opt(m.id, m.name))));
  [el.fromUnit, el.fromRUnit, el.toRUnit].forEach((s) => Object.entries(UNITS).forEach(([k, u]) => s.append(opt(k, u.label))));
  [el.fromPeriod, el.toPeriod].forEach((s) => Object.entries(PERIODS).forEach(([k, p]) => s.append(opt(k, p.label))));
  [el.fromCur, el.toCur].forEach((s) => Object.keys(CURRENCIES).forEach((c) => s.append(opt(c, c))));

  function applyMarket(side) {
    const m = byId[(side === "from" ? el.fromMarket : el.toMarket).value];
    if (side === "from") {
      el.fromUnit.value = m.unit; el.fromRUnit.value = m.unit; el.fromPeriod.value = m.period; el.fromCur.value = m.currency;
    } else {
      el.toRUnit.value = m.unit; el.toPeriod.value = m.period; el.toCur.value = m.currency;
    }
  }

  const saved = store.get("lc-form-v1");
  if (saved) {
    Object.entries(saved).forEach(([k, v]) => { if (el[k] && v != null) el[k].value = v; });
  } else {
    el.fromMarket.value = "sg"; el.toMarket.value = "jp";
    applyMarket("from"); applyMarket("to");
  }
  const save = () => store.set("lc-form-v1", Object.fromEntries(Object.entries(el).map(([k, e]) => [k, e.value])));

  // ---------- compute & render ----------
  function compute() {
    const from = byId[el.fromMarket.value], to = byId[el.toMarket.value];
    const area = parse(el.area.value), rent = parse(el.rent.value);
    const r = FX.rates;
    const out = { from, to };
    if (area != null) out.sqm = area * UNITS[el.fromUnit.value].sqm;
    if (rent != null) {
      out.usdSqmMo = rent / UNITS[el.fromRUnit.value].sqm / PERIODS[el.fromPeriod.value].months / r[el.fromCur.value];
      out.destRate = out.usdSqmMo * r[el.toCur.value] * UNITS[el.toRUnit.value].sqm * PERIODS[el.toPeriod.value].months;
    }
    if (out.sqm != null && out.usdSqmMo != null) {
      out.totalUsdMo = out.usdSqmMo * out.sqm;
    }
    return out;
  }

  const ico = (id) => `<svg class="ic" aria-hidden="true"><use href="#${id}"/></svg>`;
  function render() {
    const c = compute();
    const toU = el.toRUnit.value, toCur = el.toCur.value, toP = el.toPeriod.value, fromCur = el.fromCur.value;
    const rows = [];
    if (c.sqm != null) {
      const others = ["sqm", "sqft", "ping"].filter((u) => u !== toU && !(UNITS[u].sqm === UNITS[toU].sqm))
        .map((u) => `${areaFmt(c.sqm / UNITS[u].sqm)} ${u === "ping" ? "ping / tsubo / pyeong" : UNITS[u].label}`);
      rows.push(`<div class="row">${ico("i-area")}<div><div class="k">Area</div>
        <div class="v">${areaFmt(c.sqm / UNITS[toU].sqm)} <small>${UNITS[toU].label}</small></div>
        <div class="s">${others.join(" · ")}</div></div></div>`);
    }
    if (c.destRate != null) {
      rows.push(`<div class="row">${ico("i-coin")}<div><div class="k">Rent, as quoted in ${c.to.name}</div>
        <div class="v">${money(c.destRate, toCur)} <small>per ${UNITS[toU].label} per ${PERIODS[toP].label}</small></div>
        <div class="s">≈ US$${num(c.usdSqmMo, 2)} per m² per month</div></div></div>`);
    }
    if (c.totalUsdMo != null) {
      const tDest = c.totalUsdMo * FX.rates[toCur], tFrom = c.totalUsdMo * FX.rates[fromCur];
      rows.push(`<div class="row">${ico("i-cal")}<div><div class="k">Total rent</div>
        <div class="v">${money(tDest, toCur)} <small>per month</small></div>
        <div class="s">${money(tDest * 12, toCur)} per year${fromCur !== toCur ? ` · ${money(tFrom, fromCur)} per month` : ""}</div></div></div>`);
    }
    $("out").innerHTML = rows.length ? rows.join("")
      : `<p class="empty">Enter an area, a rent, or both to see the conversion.</p>`;

    const cautions = [];
    if (c.to.caution) cautions.push(c.to.caution);
    if (c.from.caution && c.from.id !== c.to.id) cautions.push(c.from.caution);
    const cau = $("caution");
    cau.hidden = !cautions.length;
    cau.innerHTML = cautions.length ? `${ico("i-info")}<span>${cautions.join(" ")} <a href="#/markets/${c.to.id}">${c.to.name} guide</a></span>` : "";
    $("to-conv").textContent = `${c.to.name} usually quotes ${c.to.quote}.`;
    $("fxnote").textContent = fxNote();
    save();
  }

  ["fromMarket", "toMarket"].forEach((k) => el[k].addEventListener("change", () => { applyMarket(k === "fromMarket" ? "from" : "to"); render(); }));
  el.fromUnit.addEventListener("change", () => { el.fromRUnit.value = el.fromUnit.value; render(); });
  Object.values(el).forEach((e) => e.addEventListener(e.tagName === "INPUT" ? "input" : "change", render));
  $("conv").addEventListener("submit", (e) => e.preventDefault());

  $("swap").addEventListener("click", () => {
    const c = compute();
    const prev = Object.fromEntries(Object.entries(el).map(([k, e]) => [k, e.value]));
    el.fromMarket.value = prev.toMarket; el.toMarket.value = prev.fromMarket;
    el.fromUnit.value = prev.toRUnit; el.fromRUnit.value = prev.toRUnit; el.fromPeriod.value = prev.toPeriod; el.fromCur.value = prev.toCur;
    el.toRUnit.value = prev.fromRUnit; el.toPeriod.value = prev.fromPeriod; el.toCur.value = prev.fromCur;
    if (c.sqm != null) el.area.value = String(+(c.sqm / UNITS[prev.toRUnit].sqm).toPrecision(7));
    if (c.destRate != null) el.rent.value = String(+c.destRate.toPrecision(7));
    render();
  });

  // ---------- markets ----------
  function benchLocal(m) {
    const b = m.bench;
    return `${money(b.value, m.currency)} per ${UNITS[b.unit].label} per ${PERIODS[b.period].label}`;
  }
  function benchUsd(m) {
    const b = m.bench;
    return b.value / UNITS[b.unit].sqm / PERIODS[b.period].months / FX.rates[m.currency];
  }
  const trendTag = (b) => `<span class="trendtag ${b.trend}">${b.trend === "flat" ? "" : ico("i-trend")}${b.change}</span>`;

  $("market-list").innerHTML = MARKETS.map((m) =>
    `<li><a href="#/markets/${m.id}"><span class="nm">${m.name}</span><span class="q">${m.quote.split(" (")[0].split(". ")[0]}</span>${ico("i-chev")}</a></li>`).join("");

  function renderMarket(id) {
    const m = byId[id];
    if (!m) { location.hash = "#/markets"; return; }
    const b = m.bench;
    $("market-detail").innerHTML = `<article class="md">
      <h1 id="h-market">${m.name}</h1>
      <p class="quote">${m.quote}</p>
      <div class="facts">
        <div class="fact"><div class="k">${ico("i-area").replace('class="ic"', 'class="ic sm"')}Area unit</div><div class="v">${UNITS[m.unit].long}</div></div>
        <div class="fact"><div class="k">${ico("i-cal").replace('class="ic"', 'class="ic sm"')}Period</div><div class="v">per ${PERIODS[m.period].label}</div></div>
        <div class="fact"><div class="k">${ico("i-coin").replace('class="ic"', 'class="ic sm"')}Currency</div><div class="v">${CURRENCIES[m.currency]}</div></div>
      </div>
      <dl class="dl">
        <div><dt>Area basis</dt><dd>${m.basis}</dd></div>
        <div><dt>What's included</dt><dd>${m.included}</dd></div>
        ${m.extras.length ? `<div><dt>Good to know</dt><dd><ul>${m.extras.map((x) => `<li>${x}</li>`).join("")}</ul></dd></div>` : ""}
      </dl>
      ${m.caution ? `<p class="note-warn">${ico("i-info")}<span>${m.caution}</span></p>` : ""}
      <section class="bench" aria-labelledby="bh">
        <h2 id="bh" class="bench-h">${ico("i-store").replace('class="ic"', 'class="ic sm"')}Latest benchmark</h2>
        <p class="big">${benchLocal(m)}</p>
        <p class="meta">${b.what} · ${b.src}, ${b.when} · ${trendTag(b)}</p>
        <p class="meta">≈ US$${num(benchUsd(m), 2)} per m² per month</p>
        ${b.extra ? `<p class="meta">${b.extra}</p>` : ""}
        <p class="meta">Source publishes: ${b.freq.toLowerCase()} · Last checked ${CHECKED}</p>
        <div class="actions">
          <a class="btn primary" href="#/" data-convert="${m.id}">Convert to ${m.name}</a>
          <a class="btn" href="${b.url}" target="_blank" rel="noopener">Source ${ico("i-arrow").replace('class="ic"', 'class="ic sm"')}</a>
        </div>
      </section>
    </article>`;
    const go = document.querySelector("[data-convert]");
    go.addEventListener("click", () => { el.toMarket.value = m.id; applyMarket("to"); render(); });
  }

  // ---------- trends ----------
  function renderTrends() {
    const rows = MARKETS.map((m) => ({ m, usd: benchUsd(m) })).sort((a, b) => (!!a.m.bench.note - !!b.m.bench.note) || (b.usd - a.usd));
    $("trend-body").innerHTML = rows.map(({ m, usd }) => `<tr>
      <td><a href="#/markets/${m.id}">${m.name}</a><div class="sub">${m.bench.what}</div></td>
      <td>${benchLocal(m)}${m.bench.note ? `<div class="sub">${m.bench.note}</div>` : ""}</td>
      <td class="num" data-label="US$ / m² / month">${num(usd, 2)}${m.bench.note ? "*" : ""}</td>
      <td>${trendTag(m.bench)}<div class="sub">${m.bench.when}</div></td>
      <td><a href="${m.bench.url}" target="_blank" rel="noopener">${m.bench.src}</a><div class="sub">${m.bench.freq.split(" (")[0]}</div></td></tr>`).join("");
    $("fxnote2").textContent = fxNote();
  }

  // ---------- router ----------
  const views = ["convert", "markets", "market", "trends"];
  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b] = h.split("/");
    let v = "convert";
    if (a === "markets" && b) v = "market"; else if (a === "markets") v = "markets"; else if (a === "trends") v = "trends";
    views.forEach((x) => {
      const node = $("view-" + x), show = x === v;
      if (show && node.hidden && route.ran) { node.classList.remove("enter"); void node.offsetWidth; node.classList.add("enter"); }
      node.hidden = !show;
    });
    document.querySelectorAll("[data-nav]").forEach((n) => {
      const on = n.dataset.nav === v || (v === "market" && n.dataset.nav === "markets");
      on ? n.setAttribute("aria-current", "page") : n.removeAttribute("aria-current");
    });
    if (v === "market") renderMarket(b);
    if (v === "trends") renderTrends();
    if (v === "convert") render();
    const titles = { convert: "Lease Converter", markets: "Market Guides · Lease Converter", trends: "Latest Retail Rents · Lease Converter", market: `${byId[b]?.name ?? "Market"} · Lease Converter` };
    document.title = titles[v];
    if (route.ran) { window.scrollTo(0, 0); $("main").focus({ preventScroll: true }); }
    route.ran = true;
    if (typeof onScroll === "function") onScroll();
  }
  // In-app links switch views with pushState instead of a hash jump.
  // iOS Safari treats a hash-link tap as a navigation (progress bar, page
  // snapshot), which shows up as a brief flash; pushState avoids that.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#/"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    const href = a.getAttribute("href");
    if (location.hash === href || (href === "#/" && (location.hash === "" || location.hash === "#"))) { window.scrollTo(0, 0); return; }
    history.pushState(null, "", href);
    route();
  });
  window.addEventListener("popstate", route);

  // Nav glass turns sheerer once the page scrolls
  const pill = document.querySelector(".pill");
  const darkCard = document.querySelector(".outcard");
  function onScroll() {
    pill.classList.toggle("sheer", window.scrollY > 8);
    // Flip nav text to light while the dark output panel passes underneath
    const p = pill.getBoundingClientRect(), mid = (p.top + p.bottom) / 2;
    const d = darkCard.offsetParent ? darkCard.getBoundingClientRect() : null;
    pill.classList.toggle("on-dark", !!d && d.top < mid && d.bottom > mid);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  $("checked").textContent = CHECKED;
  route();
  loadFx().then(() => route.ran && (render(), !$("view-trends").hidden && renderTrends(), !$("view-market").hidden && renderMarket(location.hash.split("/")[2])));

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
