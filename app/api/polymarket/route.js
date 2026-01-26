import { NextResponse } from "next/server";

const GAMMA_MARKETS_URL = "https://gamma-api.polymarket.com/markets";
const GAMMA_EVENTS_URL = "https://gamma-api.polymarket.com/events";
const GAMMA_MARKETS_SLUG = "https://gamma-api.polymarket.com/markets/slug"; // append /{slug}
const CLOB_PRICE_URL = "https://clob.polymarket.com/price";

const DEFAULT_CRYPTO_TAG_ID = "21";
const POLY_CACHE_SECONDS = 15;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const limit = clampInt(searchParams.get("limit"), 24, 1, 50);
    const q = (searchParams.get("q") || "").trim();
    const sort = (searchParams.get("sort") || "trending").trim().toLowerCase(); // trending | new | volume
    const tagId = (searchParams.get("tag_id") || DEFAULT_CRYPTO_TAG_ID).trim();
    const slug = (searchParams.get("slug") || "").trim();

    // Increase fetch pool to reduce section overlap; but keep a safety cap
    const fetchCount = Math.min(500, Math.max(120, limit * 8));

    let markets = [];

    if (slug) {
      markets = await fetchMarketBySlug(slug);
    } else if (tagId) {
      markets = await fetchMarketsByTag({ tagId, q, limit: fetchCount });
    } else {
      markets = await fetchMarketsViaEvents({ q, limit: fetchCount });
    }

    // Fallback if tag gave nothing
    if (!markets.length && tagId) {
      markets = await fetchMarketsByTag({ tagId: "", q, limit: fetchCount });
    }

    if (tagId && !q) {
      markets = markets.filter((m) => looksCrypto(m.title));
    }

    const mainSorted = sortMarkets(markets, sort).slice(0, limit);

    // Prepare sorted lists for sections
    const trendingSortedFull = sortMarkets(markets, "trending");
    const volumeSortedFull = sortMarkets(markets, "volume");
    const latestSortedFull = sortMarkets(markets, "new");

    // Unique-selection helpers:
    const taken = new Set();

    function pickUniqueWithOffset(sorted, n, offset = 0) {
      const out = [];
      if (!Array.isArray(sorted) || sorted.length === 0) return out;
      const len = sorted.length;
      // start at offset, then walk forward wrapping once
      let idx = ((offset % len) + len) % len;
      let walked = 0;
      while (out.length < n && walked < len) {
        const m = sorted[idx];
        if (!taken.has(String(m.id))) {
          out.push(m);
          taken.add(String(m.id));
        }
        idx = (idx + 1) % len;
        walked++;
      }
      return out;
    }

    // Pick trending from beginning
    const trendingSelected = pickUniqueWithOffset(trendingSortedFull, limit, 0);

    // For volume: restrict candidate set to crypto-like markets only
    const volumeCryptoCandidates = (volumeSortedFull || []).filter((m) => looksCrypto(m.title));

    // For volume, start a little further down the crypto list so top shared items are skipped.
    const volumeOffset = Math.max(8, trendingSelected.length);
    const volumeSelected = pickUniqueWithOffset(volumeCryptoCandidates, limit, volumeOffset);

    // For latest, further offset by trending+volume lengths
    const latestOffset = Math.max(12, trendingSelected.length + volumeSelected.length);
    const latestSelected = pickUniqueWithOffset(latestSortedFull, limit, latestOffset);

    // If any section is short, fill from remaining markets (untaken) from the global pool.
    // For volume, the fill pool is restricted to crypto-only so volume remains crypto-focused.
    function fillFromPool(arr, n, pool) {
      if (arr.length >= n) return arr.slice(0, n);
      const out = [...arr];
      for (const m of pool) {
        if (out.length >= n) break;
        if (taken.has(String(m.id))) continue;
        out.push(m);
        taken.add(String(m.id));
      }
      return out;
    }

    const poolOrder = sortMarkets(markets, "trending"); // use a stable pool order
    const poolOrderCrypto = poolOrder.filter((m) => looksCrypto(m.title)); // crypto-only pool for volume fills

    const trendingFinal = fillFromPool(trendingSelected, limit, poolOrder);
    const volumeFinal = fillFromPool(volumeSelected, limit, poolOrderCrypto); // crypto-only fill
    const latestFinal = fillFromPool(latestSelected, limit, poolOrder);

    // Build map of all markets we will enrich (main + sections) and dedupe token fetches
    const idToMarket = new Map();
    const addListToMap = (list) => list.forEach((m) => idToMarket.set(String(m.id), m));
    addListToMap(mainSorted);
    addListToMap(trendingFinal);
    addListToMap(volumeFinal);
    addListToMap(latestFinal);

    const tokenIds = [];
    for (const m of idToMarket.values()) {
      const ids = Array.isArray(m.clobTokenIds) ? m.clobTokenIds : [];
      for (const t of ids) tokenIds.push(String(t));
    }

    const priceCache = await fetchPricesForTokenIds(tokenIds);

    const enrich = (m) => {
      const ids = Array.isArray(m.clobTokenIds) ? m.clobTokenIds : [];
      const updated = [...(m.outcomes || [])];
      if (ids.length >= 2) {
        const yes = priceCache[String(ids[0])];
        const no = priceCache[String(ids[1])];
        if (updated[0]) updated[0] = { ...updated[0], price: yes ?? updated[0].price };
        if (updated[1]) updated[1] = { ...updated[1], price: no ?? updated[1].price };
      }
      return { ...m, outcomes: updated };
    };

    const marketsWithPrices = mainSorted.map(enrich);
    const trendingWithPrices = trendingFinal.map(enrich);
    const volumeWithPrices = volumeFinal.map(enrich);
    const latestWithPrices = latestFinal.map(enrich);

    const out = NextResponse.json({
      markets: marketsWithPrices,
      sections: {
        trending: trendingWithPrices,
        volume: volumeWithPrices,
        latest: latestWithPrices,
      },
    });
    out.headers.set("Cache-Control", `public, max-age=0, s-maxage=${POLY_CACHE_SECONDS}`);
    return out;
  } catch (e) {
    console.error("polymarket route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/* ---------------- Fetch strategies ---------------- */

async function fetchMarketBySlug(slug) {
  try {
    const url = `${GAMMA_MARKETS_SLUG}/${encodeURIComponent(slug)}`;
    const res = await fetch(url, { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) return [];
    const m = await res.json();
    const list = Array.isArray(m) ? m : [m];
    return normalizeList(list);
  } catch {
    return [];
  }
}

async function fetchMarketsByTag({ tagId, q, limit }) {
  const url = new URL(GAMMA_MARKETS_URL);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  if (tagId) url.searchParams.set("tag_id", tagId);
  if (q) url.searchParams.set("search", q);

  const res = await fetch(url.toString(), { headers: { accept: "application/json" }, cache: "no-store" });
  if (!res.ok) throw new Error(`Gamma markets failed ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.markets || [];
  return normalizeList(list);
}

async function fetchMarketsViaEvents({ q, limit }) {
  const outMarkets = [];
  const perPage = 50;
  let offset = 0;
  const maxPages = Math.ceil(Math.min(2000, limit * 20) / perPage);

  for (let page = 0; page < maxPages && outMarkets.length < limit; page++) {
    const url = new URL(GAMMA_EVENTS_URL);
    url.searchParams.set("order", "id");
    url.searchParams.set("ascending", "false");
    url.searchParams.set("closed", "false");
    url.searchParams.set("limit", String(perPage));
    url.searchParams.set("offset", String(offset));
    if (q) url.searchParams.set("search", q);

    const res = await fetch(url.toString(), { headers: { accept: "application/json" }, cache: "no-store" });
    if (!res.ok) break;

    const data = await res.json();
    const events = Array.isArray(data) ? data : data?.events || [];
    if (!events.length) break;

    for (const ev of events) {
      const possibleMarkets = ev?.markets || ev?.market || ev?.markets_list || [];
      if (Array.isArray(possibleMarkets) && possibleMarkets.length) {
        for (const m of possibleMarkets) {
          outMarkets.push(m);
        }
      } else {
        if (ev?.id || ev?.slug || ev?.question) outMarkets.push(ev);
      }
      if (outMarkets.length >= limit) break;
    }

    offset += perPage;
    if (events.length < perPage) break;
  }

  return normalizeList(outMarkets);
}

/* ---------------- Normalization ---------------- */

function normalizeList(list) {
  const normalized = (list || []).map((m) => {
    const title = m?.question || m?.title || "Untitled market";
    const id = String(m?.id ?? m?.conditionId ?? m?.slug ?? title);

    let outcomes = [];
    const parsedOutcomes = parseStringArray(m?.outcomes);
    const parsedPrices = parseStringArray(m?.outcomePrices);

    if (parsedOutcomes.length >= 2 && parsedPrices.length >= 2 && parsedOutcomes.length === parsedPrices.length) {
      outcomes = parsedOutcomes.map((name, i) => ({ name: String(name), price: num(parsedPrices[i]) }));
    } else {
      outcomes = fallbackYesNo(m);
    }

    outcomes = normalizeYesNo(outcomes);

    const createdAt =
      toMs(m?.createdAt) ??
      toMs(m?.startTime) ??
      toMs(m?.updatedAt) ??
      null;

    const volume =
      num(m?.volumeNum) ??
      num(m?.volume) ??
      num(m?.volume24h) ??
      num(m?.volumeUSD) ??
      num(m?.volume_usd) ??
      null;

    const liquidity =
      num(m?.liquidityNum) ??
      num(m?.liquidity) ??
      num(m?.liquidityUSD) ??
      num(m?.liquidity_usd) ??
      num(m?.openInterest) ??
      null;

    return {
      id,
      title,
      outcomes,
      clobTokenIds: Array.isArray(m?.clobTokenIds) ? m.clobTokenIds : [],
      volume,
      liquidity,
      createdAt,
      url: m?.url || m?.marketUrl || (m?.slug ? `https://polymarket.com/market/${m.slug}` : null),
    };
  });

  return normalized;
}

/* ---------------- helpers ---------------- */

function looksCrypto(title) {
  const t = String(title || "").toLowerCase();
  const has = (re) => re.test(t);
  return (
    has(/\bbitcoin\b/) ||
    has(/\bbtc\b/) ||
    has(/\beth\b/) ||
    has(/\bethereum\b/) ||
    has(/\bsolana\b/) ||
    has(/\bsol\b/) ||
    has(/\btoken\b/) ||
    has(/\bairdrop\b/) ||
    has(/\bcoinbase\b/) ||
    has(/\bbinance\b/) ||
    has(/\bkraken\b/) ||
    has(/\bmetamask\b/) ||
    has(/\bcrypto\b/) ||
    has(/\bmemecoin\b/) ||
    has(/\bstablecoin\b/)
  );
}

function sortMarkets(markets, sort) {
  const s = String(sort || "").toLowerCase();

  const score = (m) => {
    const v = m.volume ?? 0;
    const l = m.liquidity ?? 0;
    const c = m.createdAt ?? 0;
    return { v, l, c };
  };

  if (s === "new" || s === "newest") {
    return [...markets]
      .map((m, idx) => ({ m, idx, ...score(m) }))
      .sort((a, b) => {
        const dc = b.c - a.c;
        if (dc !== 0) return dc;
        const dl = b.l - a.l;
        if (dl !== 0) return dl;
        const dv = b.v - a.v;
        if (dv !== 0) return dv;
        return a.idx - b.idx;
      })
      .map((x) => x.m);
  }

  if (s === "volume") {
    return [...markets]
      .map((m, idx) => ({ m, idx, ...score(m) }))
      .sort((a, b) => {
        const dv = b.v - a.v;
        if (dv !== 0) return dv;
        const dl = b.l - a.l;
        if (dl !== 0) return dl;
        const dc = b.c - a.c;
        if (dc !== 0) return dc;
        return a.idx - b.idx;
      })
      .map((x) => x.m);
  }

  return [...markets]
    .map((m, idx) => ({ m, idx, ...score(m) }))
    .sort((a, b) => {
      const dv = b.v - a.v;
      if (dv !== 0) return dv;
      const dl = b.l - a.l;
      if (dl !== 0) return dl;
      const dc = b.c - a.c;
      if (dc !== 0) return dc;
      return a.idx - b.idx;
    })
    .map((x) => x.m);
}

function clampInt(v, fallback, min, max) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toMs(v) {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
}

function parseStringArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v !== "string") return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function fallbackYesNo(m) {
  if (m?.probabilityYes != null || m?.probabilityNo != null) {
    return [
      { name: "Yes", price: num(m.probabilityYes) },
      { name: "No", price: num(m.probabilityNo) },
    ];
  }
  if (Array.isArray(m?.outcomePrices) && m.outcomePrices.length >= 2) {
    return [
      { name: "Yes", price: num(m.outcomePrices[0]) },
      { name: "No", price: num(m.outcomePrices[1]) },
    ];
  }
  return [
    { name: "Yes", price: null },
    { name: "No", price: null },
  ];
}

function normalizeYesNo(outcomes) {
  if (!Array.isArray(outcomes) || outcomes.length < 2) return outcomes;
  return [
    { ...outcomes[0], name: "Yes" },
    { ...outcomes[1], name: "No" },
  ];
}

/* ---------------- live prices (CLOB) ---------------- */

async function fetchPricesForTokenIds(tokenIds) {
  const unique = Array.from(new Set((tokenIds || []).map(String).filter(Boolean)));
  const CONCURRENCY = 6;
  const queue = [...unique];
  const cache = {};

  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      if (!id) continue;
      try {
        const p = await fetchBestPrice(id);
        cache[id] = p;
      } catch {
        cache[id] = null;
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  return cache;
}

async function fetchBestPrice(tokenId) {
  const buy = await fetchClobPrice(tokenId, "buy");
  if (buy != null) return buy;
  return await fetchClobPrice(tokenId, "sell");
}

async function fetchClobPrice(tokenId, side) {
  try {
    const url = new URL(CLOB_PRICE_URL);
    url.searchParams.set("token_id", String(tokenId));
    url.searchParams.set("side", side);

    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = await res.json();
    return num(data?.price);
  } catch {
    return null;
  }
}