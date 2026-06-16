"use strict";

const g_manifestIds = [
    "background_color",
    "categories",
    "description",
    "display",
    "display_override",
    "file_handlers",
    "icons",
    "id",
    "launch_handler",
    "name",
    "note_taking",
    "orientation",
    "prefer_related_applications",
    "protocol_handlers",
    "related_applications",
    "scope",
    "scope_extensions",
    "screenshots",
    "serviceworker",
    "share_target",
    "short_name",
    "shortcuts",
    "start_url",
    "theme_color"
]

const g_manifestNames = [
    "Background Color",
    "Categories",
    "Description",
    "Display",
    "Display Override",
    "File Handlers",
    "Icons",
    "ID",
    "Launch Handler",
    "Name",
    "Note Taking",
    "Orientation",
    "Prefer Related Applications",
    "Protocol Handlers",
    "Related Applications",
    "Scope",
    "Scope Extensions",
    "Screenshots",
    "Service Worker",
    "Share Target",
    "Short Name",
    "Shortcuts",
    "Start URL",
    "theme_color"
]

const g_manifestPlaceholderValues = [
    "Default",
    "Default",
    "./",
    "standalone",
    "#000000",
    "#ffffff",
    "default-v0",
    "Default",
    ""
]

const g_manifestInfo = [
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/short_name",
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/name",
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url",
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display",
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/theme_color",
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/background_color",
    "https://developer.mozilla.org/en-US/docs/Web/API/Cache",
    "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/title",
    "https://developer.mozilla.org/en-US/docs/Glossary/Favicon"
];

for (let i = 0; i < g_manifestIds.length; ++i) {
    const document.createElement()
}

const g_files = ["main.js", "style.css"];
const g_faviconSizes = [192, 512];

const g_shortName = document.getElementById("short-name");
const g_name = document.getElementById("name");
const g_favicon = document.getElementById("favicon");
const g_startUrl = document.getElementById("start-url");
const g_display = document.getElementById("display");
const g_themeColor = document.getElementById("theme-color");
const g_backgroundColor = document.getElementById("background-color");
const g_cacheName = document.getElementById("cache-name");

let g_faviconFile = null;

const g_submit = document.getElementById("submit");
const g_status = document.getElementById("status");

const g_manifest = new Map();
const g_sw = new Map();
const g_index = new Map();

g_favicon.addEventListener("change", (event) => {
    if (event.target.files.length === 1) {
        g_faviconFile = event.target.files[0];
    }
});

g_submit.addEventListener("click", () => {
    const faviconValue = g_favicon.value;
    const displayValue = g_display.value;
    if (!faviconValue || !displayValue) {
        setStatus("Please upload favicon");
    } else {
        g_shortName.value = g_shortName.value || "Default";
        g_name.value = g_name.value || "Default";
        g_startUrl.value = g_startUrl.value || "./";
        g_themeColor.value = g_themeColor.value || "#000000";
        g_backgroundColor.value = g_backgroundColor.value || "#ffffff";
        g_cacheName.value = g_cacheName.value || "default-v0";
        generateTemplate();
    }
});

function setStatus(text) {
    g_status.textContent = text;
}

function reset() {
    g_shortName.value = "";
    g_name.value = "";
    g_favicon.value = "";
    g_startUrl.value = "";
    g_display.value = "";
    g_themeColor.value = "";
    g_backgroundColor.value = "";
    g_cacheName.value = "";

    g_faviconFile = null;
    
    setStatus("");
}

function generateManifest() {
    const shortNameValue = g_shortName.value;
    const nameValue = g_name.value;
    const startUrlValue = g_startUrl.value;
    const displayValue = g_display.value;
    const themeColorValue = g_themeColor.value;
    const backgroundColorValue = g_backgroundColor.value;
    let manifest = `{
	"short_name": "${shortNameValue}",
	"name": "${nameValue}",
	"icons": [`;
    let first = true;
    for (const faviconSize of g_faviconSizes) {
        if (first) {
            first = false;
        } else {
            manifest += `,`
        }

        manifest += `
        {
            "src": "${startUrlValue}favicon-${faviconSize}x${faviconSize}.png",
            "sizes": "${faviconSize}x${faviconSize}",
            "type": "image/png"
        }`
    }
    manifest += `
    ],
	"start_url": "${startUrlValue}",
	"display": "${displayValue}",
	"theme_color": "${themeColorValue}",
	"background_color": "${backgroundColorValue}"
}`
    return manifest;
}

function generateIndex() {
    const nameValue = g_name.value;
    const startUrlValue = g_startUrl.value;
    return `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${nameValue}</title>
        <link rel="manifest" href="manifest.json">
    </head>
    <body>
        <script>
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.register("${startUrlValue}sw.js", {
                    scope: "${startUrlValue}" 
                });
            }
        </script>
    </body>
</html>`
}

function generateSw() {
    const startUrlValue = g_startUrl.value;
    const cacheNameValue = g_cacheName.value;
    let sw = `const CACHE_NAME = "${cacheNameValue}";

const FILES = [
`;
    for (const faviconSize of g_faviconSizes) {
        sw += `    "${startUrlValue}favicon-${faviconSize}x${faviconSize}.png",
`;
    }
    for (const file of g_files) {
        sw += `    "${startUrlValue}${file}",
`;
    }
    sw += `    "${startUrlValue}manifest.json",
    "${startUrlValue}sw.js",
    "${startUrlValue}index.html",
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
    setStatus("Loading...");

    const zip = new JSZip();
    for (const faviconSize of g_faviconSizes) {
        zip.file(`favicon-${faviconSize}x${faviconSize}.png`, await resizeImg(g_faviconFile, faviconSize, faviconSize));
    }
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
    const nameValue = g_name.value;
    link.download = `${nameValue}.zip`;

    document.body.appendChild(link)
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl)

    reset();
}
