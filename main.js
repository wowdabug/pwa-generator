"use strict";

const g_title = document.getElementById("title");

const g_shortName = document.getElementById("short-name");
const g_name = document.getElementById("name");
const g_startUrl = document.getElementById("start-url");
const g_display = document.getElementById("display");
const g_themeColor = document.getElementById("theme-color");
const g_backgroundColor = document.getElementById("background-color");

const g_cacheName = document.getElementById("cache-name");

const g_defaultFiles = document.getElementById("default-files");
const g_favicon = document.getElementById("favicon");
const g_faviconSizes = document.getElementById("favicon-sizes");
const g_fileName = document.getElementById("file-name");

const g_submit = document.getElementById("submit");

let g_defaultFilesArr = null;
let g_faviconSizesArr = null;
let g_faviconFile = null;

g_favicon.addEventListener("change", (event) => {
    if (event.target.files.length === 1) {
        g_faviconFile = event.target.files[0];
    }
});

g_submit.addEventListener("click", () => {
    if (!g_favicon.value) {
        alert("Please upload favicon");
    } else {
        generateTemplate();
    }
});

function applyPlaceholderValues() {
        g_title.value = g_title.value || "Default";
        g_shortName.value = g_shortName.value || "Default";
        g_name.value = g_name.value || "Default";
        g_startUrl.value = g_startUrl.value || "./";
        g_display.value = g_display.value || "standalone";
        g_themeColor.value = g_themeColor.value || "#000000";
        g_backgroundColor.value = g_backgroundColor.value || "#ffffff";
        g_cacheName.value = g_cacheName.value || "default-v0";
        g_defaultFiles.value = g_defaultFiles.value || "main.js, style.css";
        g_favicon.value = g_favicon.value || "";
        g_faviconSizes.value = g_faviconSizes.value || "192, 512";
        g_fileName.value = g_fileName.value || "Default";
}

function parseLists() {
        g_defaultFilesArr = g_defaultFiles.value.split(",").map(el => el.trim()).filter(el => el !== "");
        g_faviconSizesArr = g_faviconSizes.value.split(",").map(el => el.trim()).filter(el => el !== "");
}

function reset() {
    g_title.value = "";
    g_shortName.value = "";
    g_name.value = "";
    g_startUrl.value = "";
    g_display.value = "";
    g_themeColor.value = "";
    g_backgroundColor.value = "";
    g_cacheName.value = "";
    g_defaultFiles.value = "";
    g_favicon.value = "";
    g_faviconSizes.value = "";
    g_fileName.value = "";

    g_defaultFilesArr = null;
    g_faviconSizesArr = null;
    g_faviconFile = null;
}

function generateIndex() {
    let index = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${g_title.value}</title>
        <link rel="manifest" href="manifest.json">
`;
if (g_defaultFiles.value.includes("style.css")) {
    index += `        <link rel="stylesheet" href="style.css">
`;
}
index += `    <body>
        <script>
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("${g_startUrl.value}sw.js", {
                    scope: "${g_startUrl.value}" 
                });
            }
        </script>
`;
if (g_defaultFiles.value.includes("main.js")) {
    index += `        <script src="main.js"></script>
`;
}
index += `    </body>
</html>`;
    return index;
}

function generateManifest() {
    let manifest = `{
	"short_name": "${g_shortName.value}",
	"name": "${g_name.value}",
	"icons": [`;
    let first = true;
    for (const faviconSize of g_faviconSizesArr) {
        if (first) {
            first = false;
        } else {
            manifest += `,`
        }

        manifest += `
        {
            "src": "${g_startUrl.value}favicon-${faviconSize}x${faviconSize}.png",
            "sizes": "${faviconSize}x${faviconSize}",
            "type": "image/png"
        }`
    }
    manifest += `
    ],
	"start_url": "${g_startUrl.value}",
	"display": "${g_display.value}",
	"theme_color": "${g_themeColor.value}",
	"background_color": "${g_backgroundColor.value}"
}`
    return manifest;
}

function generateSw() {
    let sw = `const CACHE_NAME = "${g_cacheName.value}";

const FILES = [
`;
    for (const faviconSize of g_faviconSizesArr) {
        sw += `    "${g_startUrl.value}favicon-${faviconSize}x${faviconSize}.png",
`;
    }
    for (const defaultFile of g_defaultFiles.value) {
        sw += `    "${g_startUrl.value}${defaultFile}",
`;
    }
    sw += `    "${g_startUrl.value}manifest.json",
    "${g_startUrl.value}sw.js",
    "${g_startUrl.value}index.html",
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
});`;
    return sw;
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
    });
}

async function generateTemplate() {
    applyPlaceholderValues();
    parseLists();

    const zip = new JSZip();
    for (const faviconSize of g_faviconSizesArr) {
        zip.file(`favicon-${faviconSize}x${faviconSize}.png`, await resizeImg(g_faviconFile, faviconSize, faviconSize));
    }

    zip.file("manifest.json", generateManifest());
    zip.file("sw.js", generateSw());
    zip.file("index.html", generateIndex());
    for (const defaultFile of g_defaultFilesArr) {
        zip.file(`${defaultFile}`, "");
    }

    const blob = await zip.generateAsync({
        type: "blob"
    });

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    const nameValue = g_name.value;
    link.download = `${nameValue}.zip`;

    document.body.appendChild(link)
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl)

    reset();
}
