// Public files are written as root paths ("/projects/gais.jpg") in the code
// and the JSON content. The site can be served from a sub-folder (GitHub Pages
// serves it under /PROFILEAZKA/), so every such path goes through here to pick
// up Vite's base. External URLs and anything not starting with "/" pass through.
// "/" locally, "/PROFILEAZKA/" on Pages; "/" when a Node script imports this.
const BASE = import.meta.env?.BASE_URL ?? "/";

export function asset(path) {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return path;
  return BASE + path.slice(1);
}

// Rewrites the asset paths inside the two content files once, on load, so the
// components can use them as they are.
export function withAssets(items, profile) {
  return {
    items: items.map((item) => ({
      ...item,
      image: asset(item.image),
      thumb: asset(item.thumb),
      logo: asset(item.logo),
      medallion: asset(item.medallion),
      pusaka: item.pusaka && { ...item.pusaka, image: asset(item.pusaka.image), cutout: asset(item.pusaka.cutout) },
      gallery: item.gallery?.map((shot) => ({ ...shot, src: asset(shot.src) })),
    })),
    profile: {
      ...profile,
      cv: asset(profile.cv),
      certificates: profile.certificates?.map((c) => ({ ...c, image: asset(c.image) })),
    },
  };
}
