import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("/Users/nguyendinhkhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");

const baseUrl = process.env.BATS_ZALO_URL || "http://127.0.0.1:3500";
const outDir = path.resolve("tmp/zalo-ui-audit");

const tabs = [
  { name: "home", label: "Tổng Quan" },
  { name: "harvest", label: "Chốt Lô" },
  { name: "queue", label: "Hàng Chờ" },
  { name: "history", label: "Lịch Sử" },
  { name: "profile", label: "Hồ Sơ" }
];

const viewports = [
  { name: "standard", width: 390, height: 844 },
  { name: "small", width: 360, height: 740 }
];

await fs.mkdir(outDir, { recursive: true });

const chromeExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const browser = await chromium.launch({ headless: true, executablePath: chromeExecutable });
const results = [];

for (const viewport of viewports) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const consoleMessages = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => {
    consoleMessages.push({ type: "pageerror", text: err.message });
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  for (const tab of tabs) {
    if (tab.name !== "home") {
      const button = page.getByRole("button", { name: new RegExp(tab.label, "i") }).last();
      await button.click();
      await page.waitForTimeout(350);
    }

    const screenshotPath = path.join(outDir, `${viewport.name}-${tab.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const metrics = await page.evaluate(() => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const all = [...document.querySelectorAll("*")];
      const visible = all
        .map((el) => {
          const rect = el.getBoundingClientRect();
          const style = getComputedStyle(el);
          return {
            tag: el.tagName,
            text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 90),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            overflowX: rect.right - vw,
            overflowY: rect.bottom - vh,
            fontSize: style.fontSize,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity
          };
        })
        .filter((r) => r.width > 0 && r.height > 0 && r.visibility !== "hidden" && r.opacity !== "0");

      const horizontalOverflow = visible
        .filter((r) => r.x < -1 || r.x + r.width > vw + 1)
        .map((r) => ({ tag: r.tag, text: r.text, x: Math.round(r.x), width: Math.round(r.width), overflowX: Math.round(r.overflowX) }))
        .slice(0, 20);

      const tappables = [...document.querySelectorAll("button,a,input,select,textarea")]
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName,
            text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || "").trim().replace(/\s+/g, " ").slice(0, 60),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            x: Math.round(rect.x),
            y: Math.round(rect.y)
          };
        })
        .filter((r) => r.width > 0 && r.height > 0);

      const smallTappables = tappables.filter((r) => r.height < 40 || r.width < 40).slice(0, 20);
      const fixedBottom = visible.filter((r) => r.y > vh - 90).map((r) => ({ tag: r.tag, text: r.text, y: Math.round(r.y), height: Math.round(r.height) })).slice(0, 12);
      const bodyText = visible.filter((r) => r.text.length > 0 && ["P", "SPAN", "DIV", "H1", "H2", "H3", "H4", "BUTTON", "LABEL"].includes(r.tag)).length;

      return {
        viewport: { width: vw, height: vh },
        document: {
          scrollWidth: document.documentElement.scrollWidth,
          scrollHeight: document.documentElement.scrollHeight,
          bodyScrollHeight: document.body.scrollHeight
        },
        horizontalOverflow,
        smallTappables,
        fixedBottom,
        bodyTextCount: bodyText
      };
    });

    results.push({
      viewport,
      tab: tab.name,
      screenshot: screenshotPath,
      metrics,
      consoleMessages: [...consoleMessages]
    });
  }

  await page.close();
}

await browser.close();

await fs.writeFile(path.join(outDir, "audit-results.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify({ outDir, resultCount: results.length, screenshots: results.map((r) => r.screenshot) }, null, 2));
