import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
});
const base = process.env.TEST_URL || "http://localhost:5173";
await mkdir("artifacts", { recursive: true });
const PIN_END = 2.2; // JOURNEY.scrollVh / 100
const PROJECTS = JSON.parse(await readFile("public/props/props.json", "utf8")).length;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base);
  await page.waitForTimeout(6000);
  assert.equal(await page.locator("canvas").count(), 1, "hero canvas renders");
  await page.screenshot({ path: "artifacts/hero.png" });

  // Scroll through the pinned zoom; the product overlay resolves around the hand.
  await page.evaluate((f) => window.scrollTo(0, innerHeight * f), PIN_END);
  await page.waitForTimeout(2600);
  assert(await page.locator(".zoom-panel.is-live").count(), "overlay live at zoom end");
  await page.screenshot({ path: "artifacts/zoom.png" });

  // The CTA opens the case study of whichever project is in front.
  await page.getByRole("link", { name: /Lihat detailnya/ }).click();
  await page.waitForURL(/#\/project\/[a-z]+$/);
  await page.goto(base + "/#/project/tixid");
  assert.match(await page.locator("h1").innerText(), /Tixid/);
  assert.equal(await page.locator("canvas").count(), 0, "no 3D scene on a case study");
  assert.equal(await page.getByRole("link", { name: /Kunjungi situs/ }).count(), 0, "no live link without a URL");
  await page.screenshot({ path: "artifacts/case.png" });

  // Next project, then a project with a live site.
  await page.getByRole("link", { name: /Berikutnya/ }).click();
  await page.waitForURL(/#\/project\/helpdesk$/);
  await page.goto(base + "/#/project/gais");
  assert.equal(
    await page.getByRole("link", { name: /Kunjungi situs/ }).getAttribute("href"),
    "https://gais.oceanspace.co.id",
  );

  // "Semua project" goes home and lands on the project list.
  await page.getByRole("link", { name: /Semua project/ }).click();
  await page.waitForTimeout(3500);
  const listTop = await page.evaluate(() => document.querySelector("#projects").getBoundingClientRect().top);
  assert(Math.abs(listTop) < 80, `back lands on the project list (top ${listTop})`);
  assert.equal(await page.locator(".project-row").count(), PROJECTS, "every project has a row");

  // Portfolio sections exist and the scene is faded out under them.
  for (const id of ["about", "certificates", "contact"]) assert(await page.locator("#" + id).count(), `#${id} section`);
  assert.equal(await page.locator(".cert-card").count(), 2, "two certificates");
  await page.evaluate(() => scrollTo(0, document.querySelector("#contact").getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(1500);
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.querySelector(".canvas-container")).opacity),
    "0",
    "scene faded out behind the sections",
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1500);

  // WebGL context loss swaps in the static hero; the brand still renders.
  await page.evaluate(() =>
    document.querySelector("canvas")?.dispatchEvent(new Event("webglcontextlost")),
  );
  await page.waitForTimeout(400);
  assert(await page.locator(".wordmark").first().isVisible(), "hero survives context loss");
  assert.deepEqual(errors, []);

  // Reduced motion: no pin, no horizontal overflow.
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  await mobile.goto(base);
  await mobile.waitForTimeout(2500);
  assert.equal(await mobile.locator(".pin-spacer").count(), 0, "no pin under reduced motion");
  assert(
    await mobile.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    "no horizontal overflow on mobile",
  );
  await mobile.screenshot({ path: "artifacts/mobile-reduced.png" });

  // No WebGL: the canvas is never created; the static hero stands in.
  const noGL = await browser.newPage();
  await noGL.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return String(type).startsWith("webgl") ? null : get.call(this, type, ...args);
    };
  });
  await noGL.goto(base);
  await noGL.waitForTimeout(1200);
  assert.equal(await noGL.locator("canvas").count(), 0, "no canvas without WebGL");
  assert(await noGL.locator(".wordmark").first().isVisible(), "static hero without WebGL");
  assert.equal(await noGL.locator(".project-row").count(), PROJECTS, "project list without WebGL");

  console.log(
    "Passed: hero render, zoom overlay, case study page, prev/next, live link, back to list, portfolio sections, scene fade, context loss, reduced motion, mobile overflow, no-WebGL.",
  );
} finally {
  await browser.close();
}
