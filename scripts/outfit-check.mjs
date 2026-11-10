import { chromium } from "playwright";
const S = "C:/Users/user/AppData/Local/Temp/claude/d747b72b5e00a418/e301a8a5-996d-42b1-8185-1f4255d02360/scratchpad/";
const browser = await chromium.launch({ headless: true, channel: "chrome" });
const errors = [];
for (const [name, vp] of [["d", { width: 1440, height: 1000 }], ["m", { width: 375, height: 812 }]]) {
  const page = await browser.newPage({ viewport: vp });
  page.on("pageerror", (e) => errors.push(name + ": " + e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(name + " console: " + m.text()));
  await page.goto("http://localhost:5173");
  await page.waitForTimeout(6500);
  await page.screenshot({ path: S + `outfit-${name}-0.png` });
  await page.getByRole("button", { name: "Zamrud" }).click();
  await page.waitForTimeout(650);
  await page.screenshot({ path: S + `outfit-${name}-mid.png` });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: S + `outfit-${name}-1.png` });
  await page.getByRole("button", { name: "Hitam Emas" }).click();
  await page.waitForTimeout(2200);
  await page.screenshot({ path: S + `outfit-${name}-2.png` });
  console.log(name, "pressed:", await page.locator('.outfit-switch [aria-pressed="true"]').getAttribute("aria-label"),
    "saved:", await page.evaluate(() => localStorage.getItem("dukun:outfit")),
    "overflow:", await page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  // persisted across reload
  await page.reload();
  await page.waitForTimeout(6000);
  console.log(name, "after reload outfit state:", await page.evaluate(() => window.__dukunDebug.state.outfit));
  // hidden during zoom
  await page.evaluate(() => scrollTo(0, innerHeight * 2.2));
  await page.waitForTimeout(2500);
  console.log(name, "zoom visibility:", await page.evaluate(() => document.querySelector(".outfit-switch").style.visibility));
  await page.evaluate(() => localStorage.removeItem("dukun:outfit"));
  await page.close();
}
console.log("errors", errors);
await browser.close();
