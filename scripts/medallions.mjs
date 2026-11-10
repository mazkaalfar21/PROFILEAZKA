// Bake each project's logo into a round medallion face for the 3D carousel
// over the hand: public/logos/medallion/<id>.png, 512×512, the logo centred on
// its brand colour. The 3D disc samples the inscribed circle, so the corners of
// the square are never seen.
//
// - SVG app icons (GAIS, Modul, Helpdesk) fill the face with their own icon
//   colour and keep the white glyph.
// - Bitmap logos sit on the project's logoBg from props.json.
// - A project with logoText (Tixid) gets a set wordmark.
//
//   node scripts/medallions.mjs
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";

const SIZE = 512;
const OUT = "public/logos/medallion";
const items = JSON.parse(await readFile("public/props/props.json", "utf8"));
await mkdir(OUT, { recursive: true });

// Light from the upper left, falling off toward the rim, so the flat face
// reads as a slightly domed coin.
const shade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <defs><radialGradient id="g" cx="38%" cy="32%" r="72%">
    <stop offset="0" stop-color="#fff" stop-opacity=".07"/>
    <stop offset=".55" stop-color="#fff" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".16"/>
  </radialGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

for (const item of items) {
  let background = item.logoBg || "#1a0f0c";
  let mark;
  if (item.logo?.endsWith(".svg")) {
    const svg = await readFile("public" + item.logo, "utf8");
    background = svg.match(/<rect[^>]*fill="(#[0-9a-fA-F]{6})"/)?.[1] ?? background;
    const size = 430;
    mark = { input: await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer(), size: [size, size] };
  } else if (item.logo) {
    // A long wordmark is short enough to run nearly the full width of the
    // face without reaching the rim; anything squarer keeps clear of it.
    const source = await sharp("public" + item.logo).metadata();
    const wide = source.width / source.height > 3;
    const buffer = await sharp("public" + item.logo)
      .resize(wide ? 420 : 340, 300, { fit: "inside" })
      .png()
      .toBuffer();
    const meta = await sharp(buffer).metadata();
    mark = { input: buffer, size: [meta.width, meta.height] };
  } else if (item.logoText) {
    const ink = luminance(background) > 0.6 ? "#140a08" : "#f7f2ec";
    const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="140">
      <text x="200" y="98" text-anchor="middle" font-family="Arial Black, Segoe UI Black, Arial, sans-serif"
        font-weight="900" font-size="84" letter-spacing="6" fill="${ink}">${item.logoText}</text>
    </svg>`);
    mark = { input: await sharp(text).png().toBuffer(), size: [400, 140] };
  }
  const layers = [];
  if (mark)
    layers.push({
      input: mark.input,
      left: Math.round((SIZE - mark.size[0]) / 2),
      top: Math.round((SIZE - mark.size[1]) / 2),
    });
  layers.push({ input: shade });
  const file = `${OUT}/${item.id}.png`;
  await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background } })
    .composite(layers)
    .png({ compressionLevel: 9 })
    .toFile(file);
  console.log("wrote", file);
}
