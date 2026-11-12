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
const CERTIFICATES = JSON.parse(await readFile("public/profile.json", "utf8")).certificates?.length ?? 0;
// Most checks walk through GAIB (the 3D journey). A first visit opens in
// NYATA, so those pages start with GAIB chosen, unless a test switches.
const startInGaib = () => {
  if (!localStorage.getItem("dukun:dunia")) localStorage.setItem("dukun:dunia", "gaib");
};
try {
  // A first visit lands in NYATA: the light page, no 3D scene.
  const first = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await first.goto(base);
  await first.waitForTimeout(4500);
  assert.equal(await first.evaluate(() => document.documentElement.dataset.dunia), "nyata", "first visit opens in NYATA");
  assert.equal(await first.locator("canvas").count(), 0, "no 3D scene on a first visit");
  assert(await first.locator(".hero-nyata h1").isVisible(), "NYATA hero on a first visit");
  await first.close();

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(startInGaib);
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
  assert.equal(await page.locator(".project-row .pusaka-object").count(), PROJECTS, "every GAIB row shows its heirloom");
  assert.equal(await page.locator(".project-row .trailer").count(), PROJECTS, "every project has a trailer");
  assert(await page.locator(".trailer.is-playing").count() <= 1, "at most one trailer plays at a time");

  // Portfolio sections exist and the scene is faded out under them.
  for (const id of ["about", "certificates", "contact"]) assert(await page.locator("#" + id).count(), `#${id} section`);
  assert.equal(await page.locator(".cert-card").count(), CERTIFICATES, "every certificate has a card");
  await page.evaluate(() => scrollTo(0, document.querySelector("#contact").getBoundingClientRect().top + scrollY));
  await page.waitForTimeout(1500);
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.querySelector(".canvas-container")).opacity),
    "0",
    "scene faded out behind the sections",
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(1500);

  // The world switch: NYATA drops the 3D scene for the light page, GAIB
  // brings it back, and unmounting the scene is not taken as a WebGL failure.
  await page.getByRole("button", { name: "Nyata", exact: true }).click();
  await page.waitForTimeout(3000);
  assert.equal(await page.evaluate(() => document.documentElement.dataset.dunia), "nyata");
  assert.equal(await page.locator("canvas").count(), 0, "no 3D scene in NYATA");
  assert(await page.locator(".hero-nyata h1").isVisible(), "NYATA hero");
  assert.equal(await page.locator(".project-card").count(), PROJECTS, "NYATA lists every project as a card");
  assert.equal(await page.locator(".project-pusaka").count(), 0, "no heirlooms in NYATA");
  await page.screenshot({ path: "artifacts/nyata.png" });
  await page.getByRole("button", { name: "Gaib", exact: true }).click();
  await page.waitForTimeout(3500);
  assert.equal(await page.locator("canvas").count(), 1, "scene back in GAIB");
  assert.equal(await page.locator(".static-bubble").count(), 0, "leaving NYATA is not a context failure");

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
  await mobile.addInitScript(startInGaib);
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
  await noGL.addInitScript(startInGaib);
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
    "Passed: first visit in NYATA, hero render, zoom overlay, case study page, prev/next, live link, back to list, trailers, portfolio sections, scene fade, world switch, context loss, reduced motion, mobile overflow, no-WebGL.",
  );
} finally {
  await browser.close();
}
