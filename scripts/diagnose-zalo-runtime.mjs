import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/nguyendinhkhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const browser = await chromium.launch({
  headless: true,
  executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true });
const consoleMessages = [];
const responses = [];

page.on("console", (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
page.on("pageerror", (err) => consoleMessages.push({ type: "pageerror", text: err.message }));
page.on("response", (response) => {
  const url = response.url();
  if (url.includes("localhost") || url.includes("127.0.0.1") || url.includes("/src/") || url.includes("/@")) {
    responses.push({ url, status: response.status() });
  }
});

await page.goto(process.env.BATS_ZALO_URL || "http://127.0.0.1:3500", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  title: document.title,
  bodyText: document.body.innerText.slice(0, 1000),
  bodyHtml: document.body.innerHTML.slice(0, 2000),
  rootHtml: document.getElementById("root")?.innerHTML.slice(0, 2000) ?? null,
  mobileFrameHtml: document.getElementById("mobile-frame")?.innerHTML.slice(0, 2000) ?? null,
  scripts: [...document.scripts].map((s) => s.src || "inline").slice(0, 20)
}));

console.log(JSON.stringify({ consoleMessages, responses, state }, null, 2));
await browser.close();
