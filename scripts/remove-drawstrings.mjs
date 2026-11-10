// Take the blue hoodie drawstrings out of the character.
//
// Reads the untouched cutout (assets-src/character-cut.png) and writes
// public/character.png. The cords are braided blue and black, so colour alone
// only finds their blue strands. Instead the blue pixels in the chest box are
// split into the left and right cord, a line is fitted through each (dropping
// stray blue motifs on the vest), and the cord is traced row by row along that
// line: its local centre and width from the blue strands nearby, carried a few
// pixels past the last blue to take the black tip. That band is then filled
// row by row by mirroring the cloth either side into the gap, so black hood
// stays black and the woven pattern carries on through instead of smearing.
//
// Afterwards run `node scripts/hero-maps.mjs` and `node scripts/outfits.mjs`.
import sharp from "sharp";

const SRC = "assets-src/character-cut.png";
const OUT = "public/character.png";
const BOX = { x0: 420, x1: 700, y0: 400, y1: 750 }; // chest area the cords hang in
const SPLIT = 560; // x between the left and right cord
const CORRIDOR = 14; // max distance of a cord pixel from its fitted line
const WINDOW = 10; // rows either side used for the local centre and width
const TAIL = 22; // rows past the last blue pixel (the black tip)
const GROW = 3; // extra pixels either side, for edges and shadow

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width,
  H = info.height;
const at = (x, y) => (y * W + x) * 4;

// 1. Blue pixels inside the chest box, per cord.
const cords = [[], []];
for (let y = BOX.y0; y < BOX.y1; y++)
  for (let x = BOX.x0; x < BOX.x1; x++) {
    const i = at(x, y);
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    if (data[i + 3] > 10 && b === max && b - r > 18 && (max - min) / max > 0.22)
      cords[x < SPLIT ? 0 : 1].push([x, y]);
  }

// x = a + b * y, least squares.
function fit(points) {
  const n = points.length;
  let sy = 0,
    sx = 0,
    syy = 0,
    sxy = 0;
  for (const [x, y] of points) {
    sy += y;
    sx += x;
    syy += y * y;
    sxy += x * y;
  }
  const b = (n * sxy - sx * sy) / (n * syy - sy * sy || 1);
  return [(sx - b * sy) / n, b];
}

// 2. Trace each cord and paint its band into the mask.
const mask = new Uint8Array(W * H);
for (let points of cords) {
  if (points.length < 50) continue;
  for (let pass = 0; pass < 2; pass++) {
    const [a, b] = fit(points);
    points = points.filter(([x, y]) => Math.abs(x - (a + b * y)) < CORRIDOR);
  }
  const [a, b] = fit(points);
  const byRow = new Map();
  for (const [x, y] of points) {
    if (!byRow.has(y)) byRow.set(y, []);
    byRow.get(y).push(x);
  }
  const ys = [...byRow.keys()];
  const top = Math.min(...ys),
    bottom = Math.max(...ys);
  console.log(`cord: ${points.length} px, rows ${top}-${bottom}`);
  for (let y = top - 2; y <= bottom + TAIL; y++) {
    const xs = [];
    for (let d = -WINDOW; d <= WINDOW; d++) xs.push(...(byRow.get(Math.min(y, bottom) + d) || []));
    let centre = a + b * y,
      half = 5;
    if (xs.length) {
      xs.sort((p, q) => p - q);
      centre = xs[xs.length >> 1];
      half = Math.max(4, (xs[Math.floor(xs.length * 0.95)] - xs[Math.floor(xs.length * 0.05)]) / 2);
    }
    for (let x = Math.round(centre - half - GROW); x <= Math.round(centre + half + GROW); x++) mask[y * W + x] = 1;
  }
}

// 3. Fill each row's masked runs by mirroring the cloth either side into
//    it: the left half reflects what is just left of the run, the right half
//    what is just right of it, so both edges continue seamlessly and the
//    weave stays sharp. The two reflections meet in a short cross-fade.
const out = Buffer.from(data);
const pixel = (x, y) => at(Math.min(W - 1, Math.max(0, x)), y);
const Y0 = BOX.y0 - GROW,
  Y1 = BOX.y1 + TAIL + GROW,
  X0 = BOX.x0 - 20,
  X1 = BOX.x1 + 20;
for (let y = Y0; y < Y1; y++) {
  let x = X0;
  while (x < X1) {
    if (!mask[y * W + x]) {
      x++;
      continue;
    }
    const a = x;
    while (mask[y * W + x]) x++;
    const b = x,
      mid = (a + b) / 2;
    for (let px = a; px < b; px++) {
      const L = pixel(a - 1 - (px - a), y),
        R = pixel(b + (b - 1 - px), y);
      const t = Math.min(1, Math.max(0, (px - mid) / 3 + 0.5));
      const o = at(px, y);
      for (let k = 0; k < 3; k++) out[o + k] = Math.round(data[L + k] * (1 - t) + data[R + k] * t);
    }
  }
}

// 4. A very light vertical soften on the filled pixels, so row-to-row seams
//    do not flicker into stripes.
const soft = Buffer.from(out);
for (let y = Y0; y < Y1; y++)
  for (let x = X0; x < X1; x++) {
    if (!mask[y * W + x]) continue;
    for (let k = 0; k < 3; k++)
      soft[at(x, y) + k] = Math.round((out[at(x, y - 1) + k] + 2 * out[at(x, y) + k] + out[at(x, y + 1) + k]) / 4);
  }

await sharp(soft, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(OUT);
console.log("wrote", OUT);
