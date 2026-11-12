# Dukun — portofolio

A personal web-developer portfolio wearing the Dukun Gen Z persona. A 3D opener (the hero, the zoom into the open hand, the project carousel) is followed by ordinary scrolling sections: all projects, about, experience and contact. Each project has its own case-study page.

A fictional Indonesian ritual studio built with Vite, React, React Three Fiber, Three.js, Drei, GSAP ScrollTrigger, and Lenis.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` produces the static site in `dist/`; `npm run preview` previews it. All booking and newsletter actions are local demonstrations. No data is stored or transmitted.

The hero uses a cinematic candlelit room with coral backlighting, dark foreground falloff, and a matching dark booking widget. It reuses the generated room artwork; the scroll-driven bubble transition remains intact.

## Editing

- `public/profile.json` holds everything personal: name, role, city, bio, contacts (email, WhatsApp, LinkedIn, GitHub; `linkedinName` and `githubName` set the name shown on the contact card instead of the URL), the CV path (put the PDF at `public/cv.pdf` and set `"cv": "/cv.pdf"`) and the experience list. Fields marked `[ISI: …]` are placeholders; empty contacts are hidden. Also put your name in `og:title` in `index.html`.
- `profile.certificates` lists certificates (title, issuer, date, `validUntil`, `credentialId`, verification `url`, and an `image` in `public/certificates/`). The section and its nav link appear only when the list is not empty.
- `public/props/props.json` drives the projects: carousel copy (`name`, `nameEn`, `blurb`), list copy (`summary`, `year`, `stack`), the case study (`role`, `problem`, `solution`, `features`, `gallery`, `links.live` / `links.repo`, or `links.repos: [{ label, href }]` for a project split across repositories), and the images in `public/projects/` (`image`, `thumb`, `<id>-2.jpg`…). Empty `role` and missing links are simply not shown. Each row in the project list opens with the project logo (`logo` in `public/logos/`, or `logoText` for a typeset wordmark) on its `logoBg` colour before the screenshot is revealed; the motion is pure CSS in `src/style.css` and is skipped under reduced motion.
- `src/scrollState.js` is the scroll/interaction singleton. GSAP writes scroll progress; the R3F frame loop owns the camera, the bubble anchor, and model movement.
- `src/Hero3D.jsx` is the hero stage: the cinematic chamber, the figure as a 2.5D plate, and the bubble.
- `src/Scene.jsx` wires the canvas together — the interior environments, model loading, bounded prop movement, pointer raycasting, and frame-rate-independent damping.
- `src/main.jsx` loads both JSON files and routes: `#/project/<id>` renders `src/ProjectPage.jsx` (no 3D), anything else renders Home (the 3D opener plus the sections). Section anchors such as `#projects` or `#contact` work as deep links.
- The carousel over the hand runs on its own every `AUTO_MS` (3 s, `src/main.jsx`), sliding round logo medallions sideways (`ringOffset` in `src/Scene.jsx`). Over the 3D hand there are no thumbnails, arrows, swipe or hover hold. A thin bar under the counter shows the countdown. The static collection (reduced motion or no WebGL) keeps its manual controls, and there autoplay is off under reduced motion. Medallion faces are baked by `node scripts/medallions.mjs` into `public/logos/medallion/<id>.png`; an item can override its face with a `medallion` field.
- `src/Intro.jsx` is the opening loader shown once per page load. The screen is split down the middle, NYATA chalk on the left and GAIB charcoal on the right, with the wordmark rising letter by letter across the seam (each side draws the same content, clipped at `--seam`, so letters change colour where they cross). The left side runs plain loading phrases, the right side ritual ones and the counter, which follows the real loading (data, then scene textures). When it is done, the visitor's world sweeps across the other half and the curtain lifts onto the page. Timings (`MIN_MS`, `MAX_MS`, `EXIT_MS`) and both phrase lists are at the top of the file; reduced motion shortens it to a quick fade.
- `src/sections.jsx` holds the scrolling sections (`ProjectList`, `About`, `Experience`, `Contact`, `SiteFooter`) and `useReveal`, the scroll-in fade.
- `src/router.js` is the tiny hash router; it also remembers the home scroll position so Back from a case study returns to the same spot.
- `src/style.css` contains the six brand tokens and desktop/mobile layouts.
- `src/journey.js` is the shared source for scroll duration, story beats, and contained object anchors.
- `scripts/hero-maps.mjs` rebuilds the hero relief and the character volume maps.
- `scripts/character-cutout.mjs` cuts the character out of its studio photo (`assets-src/character-source.webp`) into `assets-src/character-cut.png` and prints the `BODY` box for `src/Hero3D.jsx`. `scripts/remove-drawstrings.mjs` then takes the blue hoodie drawstrings out and writes `public/character.png`. Run `hero-maps.mjs` and `outfits.mjs` after that. The first character is kept in `_arsip-karakter-lama/`, and the long-shaggy-hair version (before the baby mullet) in `_arsip-karakter-rambut-lama/`.

- **Project trailers.** Every project plays a 15-second motion-graphic trailer built from its own content (`src/Trailer.jsx`, GSAP): an opening on its brand colour (`logoBg`) with its logo and tagline, the main screenshot in a laptop beside its first features, the gallery shots fanned in 3D with their captions, the stack as chips, and an end card. It is sized in container units, so the same trailer fills a NYATA card, the vision behind a GAIB heirloom and the top of a case study. Trailers start on their own, one at a time (`src/autoplay.js`): the one nearest the middle of the window plays and the rest hold on their opening frame; cards in the same grid row take turns after each loop. Nothing plays in a hidden tab, and under reduced motion each shows one still frame. A project with `video` in `props.json` (for example its trailer exported as MP4) plays that file instead, under the same rule (`src/ProjectMedia.jsx`).
- **Two worlds: NYATA and GAIB.** A pill at the bottom centre of every page switches between GAIB (the candlelit 3D persona described here) and NYATA (a light, plain version with the real photo for readers who want the facts fast). `src/dunia.jsx` holds the switch, the smoke veil and the NYATA hero. The choice is written to `<html data-dunia>` before first paint and remembered in `localStorage` (`dukun:dunia`); a first visit opens in NYATA (`DEFAULT_DUNIA`). NYATA does not mount the WebGL scene or the pinned journey; the sections below the hero are shared and recoloured by the `[data-dunia="nyata"]` rules at the end of `src/style.css`, which swap the brand tokens and darken turmeric/smoke to reach 4.5:1 on chalk. Switching covers the page with the veil, rebuilds Home, reopens on the same section at the same offset, then lifts the veil. Case-study pages follow the same theme. The facts are shared, the telling is not: `src/copy.js` holds each world's words (nav labels, kickers, headings, leads), plain in NYATA and ritual in GAIB. NYATA lists the projects as a two-column card grid; GAIB keeps the large rows, each showing the project's heirloom (`pusaka: { name, meaning, image }` in `props.json`) instead of the logo intro. With a mouse, a lens follows the cursor over the heirloom and shows the real screenshot through it; on touch screens the heirloom holds a beat and then the screenshot opens from the centre. A project without `pusaka.image` falls back to the logo intro. The carousel over the character's hand shows the heirlooms too: `pusaka.cutout` is a transparent cut-out (`ProjectPusaka` in `src/Scene.jsx`) that floats over the palm at `PUSAKA_SHOWCASE`, turning only a third as far as a medallion so the flat photo never shows its edge; a project without a cutout keeps its logo medallion. The heirloom photos were generated from the prompts in `assets-src/pusaka/PROMPTS.md`; `node scripts/pusaka.mjs` turns the sources in that folder (any file whose name contains the project id) into `public/pusaka/<id>.webp`.
- **The crystal ball.** `src/Orb.jsx` draws one CSS crystal ball (clear glass in NYATA, coral smoke in GAIB) that ties the page together: every big heading ends in `<Dot />`, and the ball flies to whichever of those full stops is in view and takes its place; with none in view it rests beside the world switch. In GAIB it stays hidden over the 3D hero, which has its own bubble. Holding it for 0.9 s (a ring fills) crosses to the other world; Enter/Space crosses at once. Sections are numbered in order, (01) Karya and so on, from the same list as the nav, and the footer offers the other world too.
- **Outfit switcher.** The hero has a "Ganti outfit" row of swatches (right side on desktop, under the nav on phones). The colourways are listed in `src/outfits.js`. Each one has a gradient map for the vest and one for the sarong, running dark to light. `node scripts/outfits.mjs` re-dyes `public/character.png` into `public/outfits/<id>.webp`; add `--preview` to also get a side-by-side sheet. The silhouette and alpha never change, so the depth/normal maps and `BODY`/`PALM` stay valid. In 3D the new dye sweeps up the figure behind a thin flame line (`uSwap` in `src/Hero3D.jsx`). The visitor's pick is remembered in `localStorage` (`dukun:outfit`). `node scripts/outfit-check.mjs` checks switching, persistence and that the switcher hides during the zoom.

## The scroll story

`src/journey.js` defines a reversible 360vh sequence with 1.8-second scrub smoothing:

1. The title begins at 32% opacity and rises 34px into place over the opening scroll.
2. The composition holds before the character and opening copy gently leave.
3. “Tidak semua bisa dijelaskan” introduces the threshold as the bubble expands.
4. The film passes the camera; only then do the objects spread into the gallery.
5. A spacious “Ilmu lama. Dunia baru.” interlude connects the collection to services.

The gallery, interlude, and service rows use slow, scroll-linked reveals. Reduced motion removes pinning and makes content immediately visible.

- **The chamber** uses the existing candlelit room artwork, depth-dependent displacement, a damped pointer light, and two slowly drifting fog layers. The supplied Yakudoo Halloween shader informed these techniques. No full-screen lightning or flashing is used. The reference and MIT notice are retained in `references/halloween/`; the deployed notice is in `public/licenses/`.
- **The figure** is a 2.5D alpha plate with analytic volume/normal maps, restrained light response, and soft alpha edges. The camera framing and bubble position derive from the same measured hand anchor.
- **The bubble** uses thin-film interference, softened studio reflections, and restrained Fresnel edges. Its environment is captured once, avoiding repeated six-pass scene captures and reflected duplicates of the objects. Hover and click responses are damped; there is no elastic scaling or outward impulse.
- **The project cards remain inside the film**. Each project is a thin 16:10 slab (`ProjectCard` in `src/Scene.jsx`) with its screenshot inset on the front, normalized to the same 1.6-unit box the old models used. Each has a small local float offset, a conservative model bounding sphere, and a clamped distance from the shared bubble center. Props read that center after the bubble updates, avoiding independent smoothing lag on reverse scroll or resize. They spread toward gallery anchors only after the camera enters the film.

The hero sits above the canvas in the stacking order — ScrollTrigger's pin makes
it its own context — so its type crosses the render. That means the hero, and
the pin spacer GSAP wraps it in, both give pointer events back to the canvas.

Original supplied assets remain untouched in `Dukun.png` and `Probs/`. The deployed models use DRACO geometry and KTX2 textures, with local decoders in `public/draco` and `public/basis`. KTX2 preload waits for the renderer because GPU format support must be detected first. Failed models use `placeholder.glb`. The original five ritual objects (models, portraits and the scripts that made them) are kept in `_arsip-produk-lama/`, outside the build.

## Artwork

The character was supplied with the project. Project screenshots were captured from each project running locally (GAIS uses its own guide screenshot with sample data). The room was generated using the built-in image generation tool and copied to `public/textures/scene-source.png`; optimized web versions are `scene.jpg` and `scene-mobile.jpg`. The hero chamber (`hero-field*.jpg`) and the character volume maps (`character-depth.jpg`, `character-normal.jpg`) are generated procedurally by `scripts/hero-maps.mjs`.

Generation prompt: “A very dark Indonesian heritage room with warm black #140A08 dominant, a worn wooden floor, batik cloth barely visible in the shadows on the far walls, faint low candlelight at the extreme edges and beautiful thin incense smoke in muted coral #E05A4E. Room is empty of foreground objects, no people, no text, no symbols, no ritual instructions. Main central 80 percent must remain very dark and quiet for floating product models to overlay. Cinematic photorealism, restrained light, deep atmospheric spatial perspective.”

## Implementation notes

- Seven portfolio projects are shown as logo medallions (round face, bronze rim) rather than 3D models; screenshots live in the project list and case studies.
- The room depth and normal maps are analytic approximations of its floor and walls, not Depth Anything inference. `scripts/room-maps.mjs` rebuilds them. The character maps are the same kind of approximation. Lightning is omitted.
- Both hero plates skip tone mapping. They are pre-authored artwork, and ACES desaturates the batik and greys the skin.
- The hero light is read against how a flat facing surface would respond, so moving the cursor sculpts the relief instead of dimming and brightening the whole plate.
- Desktop gallery dragging uses tightly constrained OrbitControls on a virtual camera; the render camera still has one owner in the frame loop. OrbitControls is never created on touch devices.
- Desktop and mobile use the same low-vertex fullscreen shader; there is no separate 0.6-resolution mobile FBO. DPR adapts downward through PerformanceMonitor.
- Reduced motion removes the pinned zoom and entrance timeline and freezes ambient motion. Gallery content remains usable.
- The DOM gallery buttons are intentionally visible as an additional discovery and keyboard path. Dialogs lock scrolling, trap focus, close with Escape, and restore focus.
- WebGL failure/context loss swaps in the static bubble and a content-complete gallery grid.
- Google Fonts serves Archivo at width 125 / weight 800, Inter, and Bitter. System fallbacks apply offline.

## Validation

With the dev server running, `npm test` runs the smoke suite using installed Chrome (`PLAYWRIGHT_CHANNEL` overrides the browser channel). Production build and automated Chromium checks cover desktop and mobile rendering, booking simulation, prop panels, Escape dismissal, mobile horizontal overflow, focus trapping/restoration, scroll locking, context loss, no-WebGL content, and the absence of pinning under reduced motion. Screenshots are stored in the ignored `artifacts/` folder. Frame-rate targets still need profiling on physical mobile hardware.

`node scripts/journey-check.mjs` checks progressive text reveal, object containment, fast reverse scrolling, responsive resize, and browser errors against the running dev server. It saves story-beat screenshots in `artifacts/`.

### Editorial story and living film
The hero uses slow scroll-scrubbed type reveals, a breathing thin-film shell and restrained moving spectral haze. Each prop tumbles independently inside a conservative sphere bound; containment is preserved through fast reverse scrolling. The interactive collection leads into two asymmetric editorial chapters: the keris on warm black, then tarot on chalk. Their staggered timelines follow scroll and respect reduced motion. Both featured objects open the existing accessible detail panel.

`node scripts/journey-check.mjs` verifies reveal timing, containment and reverse scrolling; `node scripts/chapter-check.mjs` verifies editorial panels and mobile width.

## Deploy

The site is published to GitHub Pages at https://mazkaalfar21.github.io/PROFILEAZKA/ by `.github/workflows/deploy.yml` on every push to `main`. Pages serves it under `/PROFILEAZKA/`, so the workflow builds with `BASE_PATH=/PROFILEAZKA/` (read by `vite.config.js`). Every public file path in the code and in the JSON content goes through `asset()` in `src/asset.js` to pick up that base. Locally the base stays `/`. Routing is hash-based (`#/project/<id>`), so Pages needs no 404 fallback.

To try the Pages build locally from Git Bash (stop Git Bash rewriting the path):

    MSYS2_ENV_CONV_EXCL='*' BASE_PATH=/PROFILEAZKA/ npm run build
    MSYS2_ENV_CONV_EXCL='*' BASE_PATH=/PROFILEAZKA/ npx vite preview

The `_arsip-*` folders are local backups of earlier artwork and are not committed.
