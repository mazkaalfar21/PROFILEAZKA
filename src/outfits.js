import { asset } from "./asset.js";
// The hero's outfit switcher. "asli" is the photo as cut; the others are
// re-dyed by scripts/outfits.mjs (vest and sarong gradient maps, by luminance:
// dark → light) and served from public/outfits/<id>.webp.
export const OUTFITS = [
  {
    id: "asli",
    name: "Tenun Merah",
    swatch: ["#8f1d1d", "#6b3d17"],
    image: asset("/character.png"),
  },
  {
    id: "zamrud",
    name: "Zamrud",
    swatch: ["#13644a", "#1d2f63"],
    vest: [[0, "#03140f"], [0.16, "#0a3a2c"], [0.36, "#17775a"], [0.62, "#c9c08f"], [1, "#fbf5dc"]],
    sarong: [[0, "#03050c"], [0.14, "#0e1a3a"], [0.38, "#3c5c9c"], [0.7, "#b9c6e2"], [1, "#eef2fa"]],
  },
  {
    id: "ungu",
    name: "Ungu Malam",
    swatch: ["#6b1f78", "#55555c"],
    vest: [[0, "#0d0312"], [0.16, "#33103f"], [0.36, "#7a2a88"], [0.62, "#d9b7d9"], [1, "#fbeefa"]],
    sarong: [[0, "#050506"], [0.14, "#1d1d22"], [0.38, "#6c6c76"], [0.7, "#c9c9d0"], [1, "#f4f4f6"]],
  },
  {
    id: "emas",
    name: "Hitam Emas",
    swatch: ["#1b1612", "#9c2230"],
    vest: [[0, "#040303"], [0.18, "#120f0c"], [0.36, "#2c241a"], [0.6, "#c99a45"], [1, "#fff0c2"]],
    sarong: [[0, "#0a0102"], [0.14, "#36080e"], [0.38, "#9c2230"], [0.7, "#eba997"], [1, "#fde8e0"]],
  },
].map((o) => ({ ...o, image: o.image ?? asset(`/outfits/${o.id}.webp`) }));
