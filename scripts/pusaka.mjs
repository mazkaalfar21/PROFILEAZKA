// Turns the generated heirloom photos in assets-src/pusaka/ into the two web
// images the GAIB world uses:
//
// - public/pusaka/<id>.webp      900px square photo, for the project rows.
// - public/pusaka/<id>-cut.webp  512px with transparency, for the 3D carousel
//   over the character's hand. The near-black studio ground is keyed out by
//   brightness and the frame fades out in a circle, so the object floats with
//   a little of its incense smoke and the corner candles drop away.
//
// A source file belongs to a project when its name contains the project id
// (letters and digits only, any case), so "Kunci serenceng (GAIS).png" maps to
// gais and "Lontar (Modul Web).webp" to modul. Run: node scripts/pusaka.mjs
import sharp from "sharp";
import { mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const SRC = "assets-src/pusaka";
const OUT = "public/pusaka";
const SIZE = 900;
const CUT = 512;
// Bits of a photo the circle does not reach but that must not float over the
// hand: [x, y, radius] in 0–1 of the frame.
const ERASE = {
  modul: [
    [0.165, 0.6, 0.075], // the candle flame beside the lontar
    [0.17, 0.7, 0.065], // and its body
  ],
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function cutout(file, out, erase = []) {
  const { data } = await sharp(file).resize(CUT, CUT, { fit: "cover" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = Buffer.alloc(CUT * CUT * 4);
  for (let y = 0; y < CUT; y++)
    for (let x = 0; x < CUT; x++) {
      const i = y * CUT + x;
      const u = x / CUT,
        v = y / CUT;
      // Brightest channel, so warm brass and gold count as much as white.
      const bright = Math.max(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]) / 255;
      let alpha = smooth(0.07, 0.2, bright) * (1 - smooth(0.62, 0.92, Math.hypot(u - 0.5, v - 0.5) / 0.5));
      for (const [ex, ey, er] of erase) alpha *= smooth(er * 0.6, er, Math.hypot(u - ex, v - ey));
      rgba.set([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], Math.round(alpha * 255)], i * 4);
    }
  return sharp(rgba, { raw: { width: CUT, height: CUT, channels: 4 } })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 })
    .toFile(out);
}

const items = JSON.parse(await readFile("public/props/props.json", "utf8"));
const files = (await readdir(SRC)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));
const key = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
await mkdir(OUT, { recursive: true });

let missing = 0;
for (const item of items) {
  const matches = files.filter((f) => key(f).includes(key(item.id)));
  if (matches.length !== 1) {
    console.warn(`${item.id}: ${matches.length ? "more than one source: " + matches.join(", ") : "no source image"}`);
    missing++;
    continue;
  }
  const src = path.join(SRC, matches[0]);
  const photo = await sharp(src)
    .resize(SIZE, SIZE, { fit: "cover" })
    .webp({ quality: 80, effort: 6 })
    .toFile(path.join(OUT, item.id + ".webp"));
  const cut = await cutout(src, path.join(OUT, item.id + "-cut.webp"), ERASE[item.id]);
  console.log(`${item.id} <- ${matches[0]}  (${Math.round(photo.size / 1024)} KB + cutout ${Math.round(cut.size / 1024)} KB)`);
}
if (missing) process.exitCode = 1;
