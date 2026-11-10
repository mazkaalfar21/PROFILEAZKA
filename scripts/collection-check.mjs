import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
// Project carousel. Over the 3D hand it runs on its own (no thumbnails, arrows
// or swipe) and the CTA always follows the project in front. The static
// collection (reduced motion) keeps its manual controls.
const browser = await chromium.launch({ channel: "chrome", headless: true });
await mkdir("artifacts", { recursive: true });
const errors = [];

const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("pageerror", (e) => errors.push(e.message));
const selected = () => page.evaluate(() => window.__dukunDebug.state.selectedId);
await page.goto("http://localhost:5173");
await page.waitForTimeout(5500);
await page.evaluate(() => scrollTo(0, innerHeight * 2.2));
await page.waitForTimeout(3000);
assert.equal(await page.locator(".zoom-card").count(), 0, "no thumbnails over the 3D hand");
assert.equal(await page.getByRole("button", { name: "Project berikutnya" }).count(), 0, "no arrows over the 3D hand");
const first = await selected();
await page.screenshot({ path: "artifacts/collection-medallion.png" });
await page.waitForTimeout(3400);
const second = await selected();
assert.notEqual(second, first, "autoplay advanced within ~3s");
assert.equal(
  await page.getByRole("link", { name: /Lihat detailnya/ }).getAttribute("href"),
  "#/project/" + second,
  "CTA follows the project in front",
);
// Hovering no longer holds it.
await page.mouse.move(1100, 500);
await page.waitForTimeout(3400);
assert.notEqual(await selected(), second, "keeps going under the cursor");

const still = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
still.on("pageerror", (e) => errors.push(e.message));
await still.goto("http://localhost:5173");
await still.waitForTimeout(3000);
await still.getByRole("button", { name: "Complete Mulia", exact: true }).click();
await still.getByRole("button", { name: "Project berikutnya" }).click();
await still.waitForTimeout(300);
assert.equal(await still.evaluate(() => window.__dukunDebug.state.selectedId), "oceanmall");

assert.deepEqual(errors, []);
console.log("PASS auto-only 3D carousel, CTA follows, no hover hold, static controls, no errors");
await browser.close();
