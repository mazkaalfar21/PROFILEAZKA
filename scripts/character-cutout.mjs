// Cut the character out of its studio photo into assets-src/character-cut.png.
//
// The source (assets-src/character-source.webp) is shot on a plain blue-grey
// backdrop with a soft vignette. The backdrop is region-grown from the image
// border: a pixel joins when it is grey (low saturation, blue >= red), inside
// the backdrop's brightness band, and only a small step away from the
// neighbour it was reached from, so the fill follows the vignette but stops at
// the hard edges of hair, skin, cloth and the broom. Whatever the fill cannot
// reach is the figure. The mask edge is feathered by a pixel and grey spill
// along it is darkened so it does not halo against the dark room.
//
// After running this, run `node scripts/remove-drawstrings.mjs` (writes
// public/character.png without the blue hoodie strings), then
// `node scripts/hero-maps.mjs` to rebuild the volume maps and
// `node scripts/outfits.mjs` for the colourways, and re-measure BODY / PALM in
// src/Hero3D.jsx (this script prints both).
import sharp from "sharp";

const SRC = "assets-src/character-source.webp";
const OUT = "assets-src/character-cut.png";
const SATURATION = 17; // max(r,g,b) - min(r,g,b) for a backdrop pixel
const LUMA = [92, 180]; // backdrop brightness band
const STEP = 11; // max channel change between neighbouring backdrop pixels

const { data, info } = await sharp(SRC)
  .removeAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const W = info.width,
  H = info.height;

const grey = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = data[i * 3],
    g = data[i * 3 + 1],
    b = data[i * 3 + 2];
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  grey[i] =
    Math.max(r, g, b) - Math.min(r, g, b) <= SATURATION &&
    b >= r - 2 &&
    luma >= LUMA[0] &&
    luma <= LUMA[1]
      ? 1
      : 0;
}
const step = (i, j) =>
  Math.max(
    Math.abs(data[i * 3] - data[j * 3]),
    Math.abs(data[i * 3 + 1] - data[j * 3 + 1]),
    Math.abs(data[i * 3 + 2] - data[j * 3 + 2]),
  );

// Region-grow the backdrop from the border.
const background = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
let head = 0,
  tail = 0;
const visit = (j, from) => {
  if (background[j] || !grey[j]) return;
  if (from >= 0 && step(from, j) > STEP) return;
  background[j] = 1;
  queue[tail++] = j;
};
for (let x = 0; x < W; x++) {
  visit(x, -1);
  visit((H - 1) * W + x, -1);
}
for (let y = 0; y < H; y++) {
  visit(y * W, -1);
  visit(y * W + W - 1, -1);
}
while (head < tail) {
  const i = queue[head++],
    x = i % W,
    y = (i / W) | 0;
  if (x > 0) visit(i - 1, i);
  if (x < W - 1) visit(i + 1, i);
  if (y > 0) visit(i - W, i);
  if (y < H - 1) visit(i + W, i);
}

// Enclosed backdrop: grey pockets the border fill cannot reach (between the
// broom bristles, between the staff and the body). A pocket counts as backdrop
// when it is big enough and evenly lit; silver rings and chains are grey too,
// but their highlights make them far less even.
const HOLE_MIN = 40,
  HOLE_EVEN = 16;
const label = new Int32Array(W * H).fill(-1);
const luma = (i) => 0.299 * data[i * 3] + 0.587 * data[i * 3 + 1] + 0.114 * data[i * 3 + 2];
let pockets = 0;
for (let start = 0; start < W * H; start++) {
  if (!grey[start] || background[start] || label[start] >= 0) continue;
  head = tail = 0;
  queue[tail++] = start;
  label[start] = start;
  let sum = 0,
    sum2 = 0;
  while (head < tail) {
    const i = queue[head++],
      x = i % W,
      y = (i / W) | 0;
    const l = luma(i);
    sum += l;
    sum2 += l * l;
    for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1])
      if (j >= 0 && grey[j] && !background[j] && label[j] < 0 && step(i, j) <= STEP) {
        label[j] = start;
        queue[tail++] = j;
      }
  }
  const n = tail,
    mean = sum / n,
    std = Math.sqrt(Math.max(0, sum2 / n - mean * mean));
  if (n >= HOLE_MIN && std <= HOLE_EVEN) {
    for (let k = 0; k < n; k++) background[queue[k]] = 1;
    pockets++;
  }
}
console.log("enclosed backdrop pockets removed:", pockets);

// Feathered alpha: the hard mask, softened by a small blur.
const hard = Buffer.alloc(W * H);
for (let i = 0; i < W * H; i++) hard[i] = background[i] ? 0 : 255;
// sharp hands a blurred one-channel image back with three channels; keep one.
const alpha = await sharp(hard, { raw: { width: W, height: H, channels: 1 } })
  .blur(0.7)
  .extractChannel(0)
  .raw()
  .toBuffer();

// Spill suppression: soft-edge pixels that are still backdrop grey are
// darkened so the cutout does not carry a grey halo into the dark room.
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0; i < W * H; i++) {
  const a = alpha[i] / 255;
  const spill = a < 1 && grey[i] ? 1 - a : 0;
  for (let c = 0; c < 3; c++) rgba[i * 4 + c] = Math.round(data[i * 3 + c] * (1 - spill * 0.7));
  rgba[i * 4 + 3] = alpha[i];
}
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(OUT);

// Report the figure's bounding box as fractions, for BODY in src/Hero3D.jsx.
let x0 = W,
  y0 = H,
  x1 = 0,
  y1 = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (alpha[y * W + x] > 127) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
const f = (v) => v.toFixed(4);
console.log(`${OUT} ${W}x${H}`);
console.log(`CHAR_ASPECT = ${W} / ${H}`);
console.log(`BODY = { x0: ${f(x0 / W)}, y0: ${f(y0 / H)}, x1: ${f((x1 + 1) / W)}, y1: ${f((y1 + 1) / H)} }`);
