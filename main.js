"use strict";

const nameEl = document.getElementById("name");
const shortNameEl = document.getElementById("short-name");
const versionEl = document.getElementById("version");
const baseUrlEl = document.getElementById("base-url");
const iconEl = document.getElementById("icon");

const generateTemplateEl = document.getElementById("generate-template");
const status = document.getElementById("status");

let name = null;
let shortName = null;
let version = null;
let baseUrl = null;
let icon = null;

const inputNames = [
    "name",
    "short name",
    "version",
    "base url",
    "icon"
];

iconEl.addEventListener("change", (event) => {
    const files = event.target.files;

    if (files.length === 1) {
        const file = files[0];
        icon = file;
    }
});

generateTemplateEl.addEventListener("click", () => {
    name = nameEl.value;
    shortName = shortNameEl.value;
    version = versionEl.value;
    baseUrl = baseUrlEl.value;

    const generate = false;

    if (generate) {
        name = name || "default";
        shortName = shortName || name.slice(0, 10);
        version = version || Math.floor(Math.random() * 100);
        baseUrl = baseUrl || "/";

        generateTemplate();
    } else {
        const missingInput = [];
        if (!name) {
            missingInput.push(0);
        }

        if (!shortName) {
            missingInput.push(1);
        }

        if (!version) {
            missingInput.push(2);
        }

        if (!baseUrl) {
            missingInput.push(3);
        }

        if (!icon) {
            missingInput.push(4);
        }

        if (missingInput.length === 0) {
            generateTemplate();
        } else {
            status.textContent = "Please enter ";
            for (let i = 0; i < missingInput.length - 1; ++i) {
                status.textContent += inputNames[missingInput[i]];
                status.textContent += ", "
            }

            if (missingInput.length > 1) {
                status.textContent += "and ";
            }

            status.textContent += inputNames[missingInput[missingInput.length - 1]] + ".";
        }
    }
});

function generateManifest() {
    return `{
    "name": "${name}",
    "short_name": "${shortName}",
    "start_url": "${baseUrl}",
    "display": "standalone",
    "background_color": "#000000",
    "theme_color": "#000000",
    "icons": [
        {
            "src": "icon-192x192.png",
            "sizes": "192x192",
            "type": "image/png"
        },
        {
            "src": "icon-512x512.png",
            "sizes": "512x512",
            "type": "image/png"
        }
    ]
}`
}

function generateIndex() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <link rel="manifest" href="manifest.json">
</head>
<body>
    <script>
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("${baseUrl}sw.js", {
                scope: "${baseUrl}" 
            });
        }
    </script>
</body>
</html>`
}

function generateSw() {
    return `const CACHE_NAME = "${shortName}-${version}";

const FILES = [
    "${baseUrl}",
    "${baseUrl}icon-192x192.png",
    "${baseUrl}icon-512x512.png",
    "${baseUrl}manifest.json",
    "${baseUrl}sw.js",
    "${baseUrl}index.html",
    "${baseUrl}style.css",
    "${baseUrl}main.js"
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
    status.textContent = "loading";

    const zip = new JSZip();
    zip.file("icon-192x192.png", await resizeImg(icon, 192, 192));
    zip.file("icon-512x512.png", await resizeImg(icon, 512, 512));
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
    link.download = `${shortName}.zip`;

    document.body.appendChild(link)
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl)

    name = null;
    shortName = null;
    version = null;
    baseUrl = null;
    icon = null;

    nameEl.value = "";
    shortNameEl.value = "";
    versionEl.value = "";
    baseUrlEl.value = "";
    iconEl.value = "";
    
    status.textContent = "";
}
