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

  // ---------- convert: state ----------
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PINGS = new Set(["ping", "tsubo", "pyeong"]);
  const TZ = { "Asia/Singapore": "sg", "Asia/Tokyo": "jp", "Asia/Hong_Kong": "hk", "Asia/Shanghai": "cn", "Asia/Taipei": "tw",
    "Asia/Seoul": "kr", "Asia/Kuala_Lumpur": "my", "Asia/Bangkok": "th", "Asia/Jakarta": "id", "Asia/Manila": "ph",
    "Asia/Kolkata": "in", "Asia/Calcutta": "in", "Asia/Ho_Chi_Minh": "vn", "Asia/Saigon": "vn", "Europe/London": "uk" };
  function guessHome() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (TZ[tz]) return TZ[tz];
      if (tz.startsWith("Australia/")) return "au";
      if (tz.startsWith("America/")) return "us";
    } catch {}
    return "sg";
  }

  const S = {};
  function fromDefaults() { const m = byId[S.from]; Object.assign(S, { areaUnit: m.unit, rentCur: m.currency, rentUnit: m.unit, rentPeriod: m.period }); }
  function toDefaults() { const m = byId[S.to]; Object.assign(S, { showUnit: m.unit, showPeriod: m.period, showCur: m.currency }); }

  const STATE_KEY = "lc-form-v2";
  const saved = store.get(STATE_KEY), old = store.get("lc-form-v1");
  if (saved && byId[saved.from] && byId[saved.to]) Object.assign(S, saved);
  else if (old && byId[old.fromMarket] && byId[old.toMarket]) {
    Object.assign(S, { from: old.fromMarket, to: old.toMarket, area: old.area || "", rent: old.rent || "",
      areaUnit: old.fromUnit, rentCur: old.fromCur, rentUnit: old.fromRUnit, rentPeriod: old.fromPeriod,
      showCur: old.toCur, showUnit: old.toRUnit, showPeriod: old.toPeriod });
  } else {
    S.from = guessHome(); S.to = S.from === "jp" ? "sg" : "jp"; S.area = ""; S.rent = "";
    fromDefaults(); toDefaults();
  }
  const save = () => store.set(STATE_KEY, S);

  // ---------- convert: inputs ----------
  // Rent currency always follows the From market; one unit covers both area and rent.
  const lockFrom = () => { S.rentCur = byId[S.from].currency; S.rentUnit = S.areaUnit; S.basis = S.basis === "total" ? "total" : "unit"; S.total = S.total || ""; };
  lockFrom();

  const el = { area: $("area"), rent: $("rent") };
  const roundIn = (x) => String(Math.round(x * 100) / 100);
  el.area.value = S.area || "";
  // One Rent box: it holds the rent per unit, or the total for the whole space (chosen from its unit label).
  el.rent.value = (S.basis === "total" ? S.total : S.rent) || "";
  el.area.addEventListener("input", () => { S.area = el.area.value; render(); });
  el.rent.addEventListener("input", () => {
    if (S.basis === "total") S.total = el.rent.value; else S.rent = el.rent.value;
    render();
  });
  el.area.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.rent.focus(); } });
  el.rent.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); el.rent.blur(); } });

  // Switch between "per unit" and "total for the space", keeping the same rent where it can be worked out.
  function setBasis(b) {
    if (b === S.basis) return;
    const c = compute();
    if (b === "total" && c.totalLocal != null) S.total = roundIn(c.totalLocal);
    if (b === "unit" && c.unitLocal != null) S.rent = roundIn(c.unitLocal);
    S.basis = b;
    el.rent.value = (b === "total" ? S.total : S.rent) || "";
    render();
  }
  // The unit label in the Rent box is a menu: per unit, or total for the whole space
  const basisBtn = $("basis-btn"), basisMenu = $("basis-menu");
  function setBasisMenu(open) { basisMenu.hidden = !open; basisBtn.setAttribute("aria-expanded", String(open)); if (open) basisMenu.querySelector(`[data-b="${S.basis}"]`).focus(); }
  basisBtn.addEventListener("click", () => setBasisMenu(basisMenu.hidden));
  basisMenu.addEventListener("click", (e) => { const b = e.target.closest(".bm-it"); if (!b) return; setBasis(b.dataset.b); setBasisMenu(false); el.rent.focus(); });
  document.addEventListener("click", (e) => { if (!basisMenu.hidden && !e.target.closest("#basis-menu, #basis-btn")) setBasisMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !basisMenu.hidden) { setBasisMenu(false); basisBtn.focus(); } });

  $("quoted-btn").addEventListener("click", (e) => {
    const adv = $("from-adv"), open = adv.hidden;
    adv.hidden = !open; e.currentTarget.setAttribute("aria-expanded", String(open));
    e.currentTarget.textContent = open ? "Done" : "Change";
  });

  // ---------- convert: market pickers (button + bottom sheet) ----------
  const sheet = $("mkt-sheet"), sheetList = $("mkt-list");
  const shortQuote = (m) => m.quote.replace(/\s*\(.*\)\s*$/, "").split(". ")[0];
  let sheetFor = null, sheetReturn = null;
  function openSheet(which) {
    sheetFor = which; sheetReturn = $(`mkt-${which}`);
    const cur = S[which];
    $("sheet-h").textContent = which === "from" ? "Convert from" : "Convert to";
    sheetList.innerHTML = MARKETS.map((m) => `<button type="button" class="mopt" data-id="${m.id}" aria-current="${m.id === cur}">
      <span class="mo-t"><span class="mo-n">${m.name}</span><span class="mo-s">${shortQuote(m)}</span></span>
      ${m.id === cur ? '<span class="mo-chk" aria-hidden="true">✓</span>' : ""}</button>`).join("");
    sheet.hidden = false;
    document.documentElement.classList.add("sheet-open");
    const sel = sheetList.querySelector('[aria-current="true"]');
    sel.scrollIntoView({ block: "center" }); sel.focus({ preventScroll: true });
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true; document.documentElement.classList.remove("sheet-open");
    if (sheetReturn) sheetReturn.focus();
  }
  sheetList.addEventListener("click", (e) => {
    const b = e.target.closest(".mopt"); if (!b) return;
    const id = b.dataset.id;
    if (sheetFor === "from") { S.from = id; fromDefaults(); wheelFrom.select(id); }
    else { S.to = id; toDefaults(); wheelTo.select(id); }
    render(); closeSheet();
  });
  sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });
  document.addEventListener("keydown", (e) => {
    if (sheet.hidden) return;
    if (e.key === "Escape") { e.preventDefault(); closeSheet(); return; }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { // move between markets
      const items = [...sheetList.querySelectorAll(".mopt")], i = items.indexOf(document.activeElement);
      e.preventDefault(); items[Math.max(0, Math.min(items.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)))].focus();
    }
    if (e.key === "Tab") { // keep focus inside the sheet
      const items = [...sheetList.querySelectorAll(".mopt")], i = items.indexOf(document.activeElement);
      e.preventDefault(); items[(i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    }
  });
  function makePicker(which) {
    const btn = $(`mkt-${which}`);
    btn.addEventListener("click", () => openSheet(which));
    return {
      select(id) {
        btn.querySelector(".mkt-name").textContent = byId[id].name;
        btn.setAttribute("aria-label", `${which === "from" ? "From" : "To"} market: ${byId[id].name}. Change market`);
      },
      sync() {},
    };
  }
  // (kept the old names so the swap and Markets-page code still work)
  const wheelFrom = makePicker("from");
  const wheelTo = makePicker("to");
  wheelFrom.select(S.from); wheelTo.select(S.to);
  function syncWheels() {}

  // ---------- convert: compute & render ----------
  function compute() {
    const from = byId[S.from], to = byId[S.to], r = FX.rates;
    const area = parse(S.area), out = { from, to };
    const months = PERIODS[S.rentPeriod].months, cur = S.rentCur;
    if (area != null) out.sqm = area * UNITS[S.areaUnit].sqm;
    if (S.basis === "total") {
      const tot = parse(S.total);
      if (tot != null && out.sqm) out.usdSqmMo = tot / out.sqm / months / r[cur];
      else if (tot != null) out.needArea = true;
    } else {
      const rent = parse(S.rent);
      if (rent != null) out.usdSqmMo = rent / UNITS[S.areaUnit].sqm / months / r[cur];
    }
    if (out.usdSqmMo != null) {
      out.destRate = out.usdSqmMo * r[S.showCur] * UNITS[S.showUnit].sqm * PERIODS[S.showPeriod].months;
      out.unitLocal = out.usdSqmMo * r[cur] * UNITS[S.areaUnit].sqm * months; // rent per unit, in the From market's terms
    }
    if (out.sqm != null && out.usdSqmMo != null) {
      out.totalUsdMo = out.usdSqmMo * out.sqm;
      out.totalLocal = out.totalUsdMo * months * r[cur]; // total for the space per entered period, From currency
    }
    return out;
  }

  const ico = (id) => `<svg class="ic" aria-hidden="true"><use href="#${id}"/></svg>`;
  const unitLbl = (u) => UNITS[u].label;
  const perLbl = { day: "day", month: "mo", year: "yr" };

  function seg(id, options, current, onPick) {
    const box = $(id);
    box.innerHTML = options.map(([v, t, label]) => `<button type="button" data-v="${v}" aria-pressed="${v === current}"${label ? ` aria-label="${label}" title="${label}"` : ""}>${t}</button>`).join("");
    box.onclick = (e) => { const b = e.target.closest("button"); if (b) onPick(b.dataset.v); };
  }

  // Copied twice over: plain text with WhatsApp-style *bold* for chat apps, and HTML with <b>
  // for email, Notes and Slack. One fact per line.
  let copyText = "", copyHtml = "";
  function summary(c) {
    if (c.sqm == null && c.destRate == null) return "";
    const U = S.showUnit, P = S.showPeriod, C = S.showCur, from = c.from, to = c.to;
    const lines = [];
    const B = (t) => ({ t, b: true });
    lines.push(B(`${from.name} → ${to.name}`));
    if (c.sqm != null) {
      const a = parse(S.area), conv = c.sqm / UNITS[U].sqm;
      const extra = U === "sqm" || S.areaUnit === "sqm" ? "" : ` (${areaFmt(c.sqm)} m²)`;
      lines.push(`Area: ${areaFmt(a)} ${unitLbl(S.areaUnit)} = ${areaFmt(conv)} ${unitLbl(U)}${extra}`);
    }
    if (c.destRate != null) {
      const quotedTotal = S.basis === "total" ? ` (total ${money(parse(S.total), S.rentCur)} per ${PERIODS[S.rentPeriod].label})` : "";
      lines.push(`Rent: ${money(c.unitLocal, S.rentCur)} per ${unitLbl(S.rentUnit)} per ${PERIODS[S.rentPeriod].label}${quotedTotal} = ${money(c.destRate, C)} per ${unitLbl(U)} per ${PERIODS[P].label}`);
    }
    if (c.totalUsdMo != null) {
      const tot = (cur) => c.totalUsdMo * PERIODS[P].months * FX.rates[cur];
      lines.push(B(`Total rent: ${money(tot(C), C)} per ${PERIODS[P].label}${S.rentCur !== C ? ` (${money(tot(S.rentCur), S.rentCur)})` : ""}`));
    }
    if (c.destRate != null && S.rentCur !== C) {
      const rate = FX.rates[C] / FX.rates[S.rentCur];
      lines.push(`FX: ${SYM[S.rentCur].trim()}1 = ${SYM[C].trim()}${num(rate, rate < 10 ? 4 : 2)}${FX.live ? ` (${FX.date})` : " (approximate)"}`);
    }
    if (to.caution) lines.push(`Note: ${to.caution}`);
    lines.push("Indicative only. Please verify before relying on these figures.");
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    copyHtml = lines.map((l) => (typeof l === "object" ? `<b>${esc(l.t)}</b>` : esc(l))).join("<br>");
    return lines.map((l) => (typeof l === "object" ? `*${l.t}*` : l)).join("\n");
  }
  async function copyOut(text, html) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        "text/plain": new Blob([text], { type: "text/plain" }),
        "text/html": new Blob([html], { type: "text/html" }),
      })]);
      return true;
    } catch {}
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    // Fallback for pages without the Clipboard API (plain http, older iOS)
    const ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;font-size:16px";
    document.body.append(ta); ta.focus(); ta.setSelectionRange(0, text.length);
    let ok = false; try { ok = document.execCommand("copy"); } catch {}
    ta.remove(); return ok;
  }
  let copyT = 0;
  $("copy").addEventListener("click", async () => {
    if (!copyText) return;
    const ok = await copyOut(copyText, copyHtml), btn = $("copy");
    $("copy-lbl").textContent = ok ? "Copied" : "Copy failed";
    btn.classList.toggle("done", ok);
    $("copy-status").textContent = ok ? "Result copied" : "Couldn't copy the result";
    clearTimeout(copyT);
    copyT = setTimeout(() => { $("copy-lbl").textContent = "Copy"; btn.classList.remove("done"); $("copy-status").textContent = ""; }, 2000);
  });

  function render() {
    const c = compute(), to = c.to;
    const U = S.showUnit, P = S.showPeriod, C = S.showCur;

    // inputs
    lockFrom();
    const fm = c.from, sym = SYM[S.rentCur].trim(), uL = unitLbl(S.areaUnit), pL = perLbl[S.rentPeriod];
    const totalMode = S.basis === "total";
    $("area-u").textContent = uL;
    $("rent-cur").textContent = sym;
    const unitSuffix = `/ ${uL} / ${pL}`, totalSuffix = `total/${pL}`;
    document.documentElement.dataset.basis = S.basis; // lets CSS give long totals a little more room
    $("basis-btn-lbl").textContent = totalMode ? totalSuffix : unitSuffix;
    $("bm-unit").textContent = `Per ${uL}`;
    basisMenu.querySelectorAll(".bm-it").forEach((b) => b.setAttribute("aria-current", String(b.dataset.b === S.basis)));
    el.rent.setAttribute("aria-label", totalMode ? `Total rent for the space, ${sym} per ${PERIODS[S.rentPeriod].label}` : `Rent, ${sym} per ${uL} per ${PERIODS[S.rentPeriod].label}`);
    // Change panel: one unit for area and rent, and the period
    const fUnits = ["sqm", "sqft"]; if (PINGS.has(fm.unit)) fUnits.push(fm.unit);
    seg("seg-from-unit", fUnits.map((u) => [u, unitLbl(u)]), S.areaUnit, (v) => { S.areaUnit = S.rentUnit = v; render(); });
    seg("seg-from-period", ["day", "month", "year"].map((p) => [p, p[0].toUpperCase() + p.slice(1)]), S.rentPeriod, (v) => { S.rentPeriod = v; render(); });
    const fromStd = S.areaUnit === fm.unit && S.rentPeriod === fm.period && !totalMode;
    $("quoted-txt").textContent = totalMode
      ? `Entered as the total ${sym} rent per ${PERIODS[S.rentPeriod].label} for the whole space.`
      : fromStd ? `${fm.name} standard: ${sym} per ${uL} per ${PERIODS[S.rentPeriod].label}.`
      : `Entered as ${sym} per ${uL} per ${PERIODS[S.rentPeriod].label}.`;

    // result
    const rows = [];
    if (c.sqm != null) {
      rows.push(`<div class="row">${ico("i-area")}<div><div class="k">Area</div>
        <div class="v">${areaFmt(c.sqm / UNITS[U].sqm)} <small>${unitLbl(U)}</small></div></div></div>`);
    }
    if (c.destRate != null) {
      rows.push(`<div class="row">${ico("i-coin")}<div><div class="k">Rent</div>
        <div class="v">${money(c.destRate, C)} <small>/ ${unitLbl(U)} / ${perLbl[P]}</small></div></div></div>`);
    }
    if (c.totalUsdMo != null) {
      const tot = c.totalUsdMo * PERIODS[P].months * FX.rates[C];
      rows.push(`<div class="row">${ico("i-cal")}<div><div class="k">Total rent</div>
        <div class="v">${money(tot, C)} <small>/ ${perLbl[P]}</small></div></div></div>`);
    }
    $("out").innerHTML = rows.length ? rows.join("")
      : c.needArea ? `<p class="empty">Enter the area too: a total rent needs it to work out the rent per ${unitLbl(U)}.</p>`
      : `<p class="empty">Enter an area, a rent, or both to see how ${to.name} would quote it.</p>`;

    // "show as" controls
    const isStd = U === to.unit && P === to.period && C === to.currency;
    $("h-result").textContent = `In ${to.name}`;
    copyText = summary(c);
    $("copy").disabled = !copyText;
    seg("seg-period", ["day", "month", "year"].map((p) => [p, p[0].toUpperCase() + p.slice(1)]), P, (v) => { S.showPeriod = v; render(); });
    const units = ["sqm", "sqft"];
    const pf = PINGS.has(U) ? U : PINGS.has(to.unit) ? to.unit : null;
    if (pf) units.push(pf);
    seg("seg-unit", units.map((u) => [u, unitLbl(u)]), U, (v) => { S.showUnit = v; render(); });
    const curs = [...new Set([to.currency, S.rentCur, "USD"])];
    if (!curs.includes(C)) curs.push(C);
    seg("seg-cur", curs.map((k) => [k, k]), C, (v) => { S.showCur = v; render(); });
    const cautions = [];
    if (to.caution) cautions.push(to.caution);
    if (c.from.caution && c.from.id !== to.id) cautions.push(c.from.caution);
    const cau = $("caution");
    cau.hidden = !cautions.length;
    cau.innerHTML = cautions.length ? `${ico("i-info")}<span>${cautions.join(" ")} <a href="#/markets/${to.id}">${to.name} guide</a></span>` : "";
    $("fxnote").textContent = fxNote();
    save();
  }
  $("conv").addEventListener("submit", (e) => e.preventDefault());

  // Swap: the result becomes the new input, so nothing is lost.
  $("swap").addEventListener("click", () => {
    $("swap").classList.toggle("spun"); // arrows turn half a circle each tap: motion, not a colour state
    const c = compute();
    const p = { ...S }, r = FX.rates, newCur = byId[p.to].currency;
    Object.assign(S, {
      from: p.to, to: p.from,
      areaUnit: p.showUnit, rentUnit: p.showUnit, rentPeriod: p.showPeriod, rentCur: newCur,
      showUnit: p.areaUnit, showPeriod: p.rentPeriod, showCur: p.rentCur,
    });
    if (c.sqm != null) S.area = el.area.value = String(+(c.sqm / UNITS[S.areaUnit].sqm).toPrecision(7));
    if (c.usdSqmMo != null) {
      S.rent = roundIn(c.usdSqmMo * r[newCur] * UNITS[S.areaUnit].sqm * PERIODS[S.rentPeriod].months);
      if (c.totalUsdMo != null) S.total = roundIn(c.totalUsdMo * PERIODS[S.rentPeriod].months * r[newCur]);
    }
    el.rent.value = (S.basis === "total" ? S.total : S.rent) || "";
    wheelFrom.select(S.from, true); wheelTo.select(S.to, true);
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
    go.addEventListener("click", () => { S.to = m.id; toDefaults(); wheelTo.select(m.id); render(); });
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
    if (v === "convert") { render(); requestAnimationFrame(syncWheels); }
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
  const pills = document.querySelectorAll(".top .pill"); // nav + language button
  const darkCard = null; // app-cards: the result card is light now, so the nav never needs its on-dark colours
  function onScroll() {
    const p = pills[0].getBoundingClientRect(), mid = (p.top + p.bottom) / 2;
    const d = darkCard && darkCard.offsetParent ? darkCard.getBoundingClientRect() : null;
    pills.forEach((el) => {
      el.classList.toggle("sheer", window.scrollY > 8);
      // Flip nav text to light while the dark output panel passes underneath
      el.classList.toggle("on-dark", !!d && d.top < mid && d.bottom > mid);
    });
  }

  // App language menu. Only English exists for now; the other languages are disabled placeholders.
  const langBtn = $("lang-btn"), langMenu = $("lang-menu");
  function setLangMenu(open, refocus) {
    langMenu.hidden = !open;
    langBtn.setAttribute("aria-expanded", String(open));
    if (open) langMenu.querySelector('[aria-current="true"]').focus();
    else if (refocus) langBtn.focus();
  }
  langBtn.addEventListener("click", () => setLangMenu(langMenu.hidden));
  langMenu.addEventListener("click", (e) => { const b = e.target.closest(".lm-it"); if (b && !b.disabled) setLangMenu(false, true); });
  document.addEventListener("click", (e) => { if (!langMenu.hidden && !e.target.closest(".langwrap")) setLangMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !langMenu.hidden) setLangMenu(false, true); });
  window.addEventListener("hashchange", () => setLangMenu(false));
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  $("checked").textContent = CHECKED;
  route();
  loadFx().then(() => route.ran && (render(), !$("view-trends").hidden && renderTrends(), !$("view-market").hidden && renderMarket(location.hash.split("/")[2])));

  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
