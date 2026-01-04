/* QC Counter (CHOI) - Service Worker (GitHub Pages friendly) */

/**
 * 업데이트가 바로 반영되지 않으면 CACHE_VERSION을 올리세요.
 * 예: v1.0.1 -> v1.0.2
 */
const CACHE_VERSION = "v1.0.3";
const CACHE_NAME = `qccounter-${CACHE_VERSION}`;

/**
 * 오프라인에서도 반드시 필요한 정적 파일 목록
 * (레포 루트에 동일한 파일명이 실제로 존재해야 설치(install)가 성공합니다.)
 */
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./service-worker.js",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("qccounter-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const isNav = req.mode === "navigate";

  event.respondWith(
    (async () => {
      try {
        // 네트워크 우선(최신 반영 목적)
        const fresh = await fetch(req);

        // 정상 응답만 캐시 업데이트
        if (fresh && fresh.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone());
        }

        return fresh;
      } catch (e) {
        // 오프라인/에러 시 캐시 폴백
        const cached = await caches.match(req, { ignoreSearch: true });
        if (cached) return cached;

        // 페이지 이동(navigate)인 경우 index.html로 폴백
        if (isNav) {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }

        return Response.error();
      }
    })()
  );
});