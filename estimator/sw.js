// Service worker：讓估算器可安裝成 App，並在離線時仍能開啟與計算。
// 每次修改網站檔案後，請把 CACHE_VERSION 加一，使用者才會拿到新版。
const CACHE_VERSION = "v1";
const CACHE_NAME = "sucoot-estimator-" + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./calc.js",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "../config.js"
];

// 外部檔案下載失敗時不影響安裝，離線時改用 email 送出詢價。
const OPTIONAL_ASSETS = [
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0/dist/umd/supabase.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await Promise.all(OPTIONAL_ASSETS.map((url) => cache.add(url).catch(() => undefined)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith("sucoot-estimator-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

// 只處理 GET；Supabase API（送出詢價）一律直接走網路，不快取。
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  const isOwnSite = url.origin === self.location.origin;
  const isOptional = OPTIONAL_ASSETS.includes(request.url);
  if (!isOwnSite && !isOptional) {
    return;
  }

  // 先用快取立即顯示，同時在背景更新快取（stale-while-revalidate）。
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
      const network = fetch(request).then((response) => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      }).catch(() => undefined);
      if (cached) {
        event.waitUntil(network);
        return cached;
      }
      const response = await network;
      if (response) {
        return response;
      }
      if (request.mode === "navigate") {
        return cache.match("./index.html");
      }
      return Response.error();
    })
  );
});
