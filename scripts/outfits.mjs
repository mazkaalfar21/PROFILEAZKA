// Re-dye the character's outfit into the colourways the hero's outfit switcher
// offers. Every variant keeps the same silhouette and alpha as
// public/character.png, so the depth/normal maps and the BODY/PALM
// measurements in src/Hero3D.jsx stay valid for all of them.
//
// Two garments are re-dyed, each inside a hand-placed region and only where the
// pixel actually looks like that cloth:
// - the woven vest (red, maroon and cream) — black hoodie, silver chains, the
//   blue drawstrings and skin are left alone;
// - the batik sarong (brown and gold) — the broom staff that crosses it is
//   masked out.
// Colour is replaced with a gradient map on luminance, so the weave and the
// batik motifs keep their contrast and only the dye changes.
//
//   node scripts/outfits.mjs            writes public/outfits/*.webp
//   node scripts/outfits.mjs --preview  also writes a side-by-side sheet
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { OUTFITS } from "../src/outfits.js";

const SRC = "public/character.png";
const OUT = "public/outfits";

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width,
  H = info.height;

// Regions in the 1086×1448 cutout. The vest panels run right up to the
// zipper, so the polygon spans the open V too (black hood, chains and zipper
// score zero as cloth anyway); only the warm-toned cross pendant and the white
// tee behind it are cut out explicitly.
const VEST = [
  [338, 548], [425, 500], [700, 465], [840, 490], [845, 540], [770, 630], [762, 1050], [338, 1050],
];
const VEST_HOLES = [
  [526, 552, 566, 634], // pendant: x0, y0, x1, y1
  [492, 476, 602, 534], // tee
];
const SARONG_TOP = 1100;
const SARONG_LEFT = 250;
// The staff runs down across the left of the sarong.
const staffCentre = (y) => 284 + (y - 1100) * 0.178;
const STAFF_HALF = 20;

function inside(poly, x, y) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i],
      [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
const smooth = (a, b, v) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
function hsv(r, g, b) {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min;
  let h = 0;
  if (d) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, max ? d / max : 0, max / 255];
}
// How much a pixel looks like dyed cloth: saturated warm colour, or the pale
// cream of the motifs. Greys/blacks (hoodie, chains) and blues score zero.
function clothWeight(r, g, b) {
  const [h, s, v] = hsv(r, g, b);
  const warm = h < 70 || h > 320 ? 1 : 0;
  const dyed = smooth(0.14, 0.3, s) * smooth(0.05, 0.12, v);
  const cream = smooth(0.5, 0.65, v) * smooth(0.06, 0.12, s) * (h > 12 && h < 65 ? 1 : 0);
  return Math.max(dyed, cream) * warm;
}

const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
function ramp(stops) {
  const rgb = stops.map(([at, c]) => [at, hex(c)]);
  return (l) => {
    let i = 1;
    while (i < rgb.length - 1 && l > rgb[i][0]) i++;
    const [a0, c0] = rgb[i - 1],
      [a1, c1] = rgb[i];
    const t = Math.min(1, Math.max(0, (l - a0) / (a1 - a0)));
    return c0.map((v, k) => v + (c1[k] - v) * t);
  };
}

function dye(outfit) {
  const out = Buffer.from(data);
  const vest = ramp(outfit.vest),
    sarong = ramp(outfit.sarong);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 4) continue;
      let map = null;
      let fade = 1;
      if (y >= SARONG_TOP && x > SARONG_LEFT) {
        fade = smooth(STAFF_HALF, STAFF_HALF + 3, Math.abs(x - staffCentre(y)));
        if (fade) map = sarong;
      }
      else if (inside(VEST, x, y) && !VEST_HOLES.some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1)) map = vest;
      if (!map) continue;
      const r = data[i],
        g = data[i + 1],
        b = data[i + 2];
      const w = clothWeight(r, g, b) * fade;
      if (!w) continue;
      const l = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      const c = map(l);
      for (let k = 0; k < 3; k++) out[i + k] = Math.round(data[i + k] + (c[k] - data[i + k]) * w);
    }
  }
  return out;
}

await mkdir(OUT, { recursive: true });
const sheet = [];
for (const outfit of OUTFITS) {
  if (!outfit.vest) continue;
  const raw = dye(outfit);
  const file = `${OUT}/${outfit.id}.webp`;
  await sharp(raw, { raw: { width: W, height: H, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100, effort: 6 })
    .toFile(file);
  console.log("wrote", file);
  sheet.push(raw);
}

if (process.argv.includes("--preview")) {
  const scale = 0.5,
    w = Math.round(W * scale),
    h = Math.round(H * scale);
  const tiles = [await sharp(SRC).resize(w, h).png().toBuffer()];
  for (const raw of sheet)
    tiles.push(await sharp(raw, { raw: { width: W, height: H, channels: 4 } }).resize(w, h).png().toBuffer());
  await sharp({ create: { width: w * tiles.length, height: h, channels: 4, background: "#1d1412" } })
    .composite(tiles.map((input, i) => ({ input, left: i * w, top: 0 })))
    .jpeg({ quality: 82 })
    .toFile(process.env.PREVIEW || "outfits-preview.jpg");
  console.log("preview written");
}
