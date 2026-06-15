"use strict";

const inputNames = [
    "short-name",
    "name",
    "favicon",
    "start-url",
    "display",
    "theme-color",
    "background-color",
    "cache-name"
];

const els = new Map();
const submitBtn = document.getElementById("submit");
const status = document.getElementById("status");

let favicon = null;

for (let i = 0; i < inputNames.length; ++i) {
    els.set(inputNames[i], document.getElementById(inputNames[i]));
}

els.get("favicon").addEventListener("change", (event) => {
    if (event.target.files.length === 1) {
        favicon = event.target.files[0];
    }
});

submitBtn.addEventListener("click", () => {
    const favicon = els.get("favicon").value;
    const display = els.get("display").value;
    if (!favicon || !display) {
        if (!favicon) {
            if (!display) {
                setStatus("Please upload favicon and choose display mode");
            } else {
                setStatus("Please upload favicon");
            }
        } else {
            setStatus("Please choose display mode");
        }
    } else {
        generateTemplate();
    }
});

function setStatus(text) {
    status.textContent = text;
}

function generateManifest() {
    return `{
	"short_name": "${els.get("short-name")}",
	"name": "${els.get("name")}",
	"icons": [
	{
		"src": "/favicon-192x192.png",
		"sizes": "192x192",
		"type": "image/png"
	},
	{
		"src": "/favicon-512x512.png",
		"sizes": "512x512",
		"type": "image/png"
	}
	],
	"start_url": "${els.get("start-url")}",
	"display": "${els.get("display")}",
	"theme_color": "${els.get("theme-color")}",
	"background_color": "${els.get("background-color")}"
}`
}

function generateIndex() {
    const startUrl = els.get("start-url");
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${els.get("name")}</title>
    <link rel="manifest" href="manifest.json">
</head>
<body>
    <script>
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("${startUrl}sw.js", {
                scope: "${startUrl}" 
            });
        }
    </script>
</body>
</html>`
}

function generateSw() {
    const startUrl = els.get("start-url");
    return `const CACHE_NAME = "${els.get("cache-name")}";

const FILES = [
    "${startUrl}",
    "${startUrl}favicon-192x192.png",
    "${startUrl}favicon-512x512.png",
    "${startUrl}manifest.json",
    "${startUrl}sw.js",
    "${startUrl}index.html",
    "${startUrl}style.css",
    "${startUrl}main.js"
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
});`
}

function resizeImg(imgBlob, width, height) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(imgBlob);
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height)
            canvas.toBlob((blob) => {
                URL.revokeObjectURL(img.src);
                resolve(blob);
            }, "image/png");
        }
    })
}

async function generateTemplate() {
    status.textContent = "Loading...";

    const zip = new JSZip();
    zip.file("favicon-192x192.png", await resizeImg(favicon, 192, 192));
    zip.file("favicon-512x512.png", await resizeImg(favicon, 512, 512));
    zip.file("manifest.json", generateManifest());
    zip.file("sw.js", generateSw());
    zip.file("index.html", generateIndex());
    zip.file("main.js", "");
    zip.file("style.css", "");

    const blob = await zip.generateAsync({
        type: "blob"
    });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${els.get("name")}.zip`;

    document.body.appendChild(link)
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl)

    favicon = null;

    for (let i = 0; i < inputNames.length; ++i) {
        els.get(inputNames[i]).value = "";
    }
    
    status.textContent = "";
}
