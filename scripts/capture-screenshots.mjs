/**
 * Captures UI screenshots for README documentation.
 * Prerequisites: npm run dev (http://localhost:3000) and npx playwright install chromium
 *
 * Usage: node scripts/capture-screenshots.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "docs", "screenshots");
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";

async function waitForServer(url, attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(
    `Dev server not reachable at ${url}. Start with: npm run dev`,
  );
}

async function main() {
  const { chromium } = await import("playwright");
  await waitForServer(BASE_URL);
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.goto(BASE_URL, { waitUntil: "networkidle" });

  const shots = [
    { file: "01-dashboard-overview.png", fullPage: true },
    { file: "02-prd-input.png", clip: { x: 0, y: 0, width: 520, height: 700 } },
  ];

  await page.screenshot({
    path: path.join(OUT_DIR, shots[0].file),
    fullPage: shots[0].fullPage,
  });

  await page.screenshot({
    path: path.join(OUT_DIR, shots[1].file),
    clip: shots[1].clip,
  });

  await page.getByRole("button", { name: /generate dashboard/i }).click();
  await page.waitForTimeout(2500);

  await page.screenshot({
    path: path.join(OUT_DIR, "03-agent-activity.png"),
    clip: { x: 0, y: 200, width: 520, height: 500 },
  });

  await page.waitForTimeout(4000);

  await page.screenshot({
    path: path.join(OUT_DIR, "04-tool-activity.png"),
    clip: { x: 0, y: 400, width: 520, height: 400 },
  });

  await page.screenshot({
    path: path.join(OUT_DIR, "05-requirement-analysis.png"),
    clip: { x: 520, y: 120, width: 900, height: 420 },
  });

  await page.screenshot({
    path: path.join(OUT_DIR, "06-architecture.png"),
    clip: { x: 900, y: 120, width: 520, height: 420 },
  });

  await page.screenshot({
    path: path.join(OUT_DIR, "07-component-tree.png"),
    clip: { x: 520, y: 520, width: 450, height: 450 },
  });

  await page.screenshot({
    path: path.join(OUT_DIR, "08-generated-code.png"),
    clip: { x: 970, y: 520, width: 450, height: 450 },
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(OUT_DIR, "09-memory-history.png"),
    clip: { x: 520, y: 400, width: 900, height: 400 },
  });

  await browser.close();
  console.log(`Screenshots saved to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
