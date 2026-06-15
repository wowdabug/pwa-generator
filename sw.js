const CACHE_NAME = "pwa-generator-v0";

const FILES = [
    "./",
    "./favicon-192x192.png",
    "./favicon-512x512.png",
    "./manifest.json",
    "./sw.js",
    "./index.html",
    "./style.css",
    "./main.js"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});