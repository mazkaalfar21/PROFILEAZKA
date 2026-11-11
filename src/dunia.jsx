import React from "react";
import gsap from "gsap";
import { asset } from "./asset";
import { Dot } from "./Orb";

// Two worlds over the same portfolio. GAIB is the candlelit 3D ritual (the
// Dukun Gen Z persona); NYATA is the plain, light, read-it-in-a-minute version
// with the real person. The choice lives on <html data-dunia>, so CSS swaps the
// palette, and in localStorage so a returning visitor lands where they left.
export const DUNIA_KEY = "dukun:dunia";
export const WORLDS = [
  ["nyata", "Nyata"],
  ["gaib", "Gaib"],
];
const BG = { nyata: "#f7f2ec", gaib: "#140a08" };
const ARRIVE = { nyata: "Kembali ke dunia nyata", gaib: "Masuk ke dunia gaib" };

// A first visit opens in NYATA, the plain version; the visitor can cross to
// GAIB from there, and that choice is remembered.
export const DEFAULT_DUNIA = "nyata";
export function savedDunia() {
  try {
    const v = localStorage.getItem(DUNIA_KEY);
    return v === "nyata" || v === "gaib" ? v : DEFAULT_DUNIA;
  } catch {
    return DEFAULT_DUNIA;
  }
}

export function storeDunia(value) {
  try {
    localStorage.setItem(DUNIA_KEY, value);
  } catch {}
}

export function applyDunia(value) {
  document.documentElement.dataset.dunia = value;
}

// The section the reader is looking at, and how far into it they are, so the
// other world can open on the same spot. The two worlds share every section
// below the hero, so the offset carries over exactly.
export function captureAnchor() {
  for (const s of document.querySelectorAll("main section[id]")) {
    const r = s.getBoundingClientRect();
    if (r.bottom > innerHeight * 0.15) return s.id === "home" ? { id: "home", offset: 0 } : { id: s.id, offset: r.top };
  }
  return { id: "home", offset: 0 };
}

export function DuniaSwitch({ value, onChange }) {
  return (
    <div className="dunia-switch" role="group" aria-label="Pilih dunia" data-on={value}>
      <span className="dunia-thumb" aria-hidden="true" />
      {WORLDS.map(([id, label]) => (
        <button key={id} type="button" className="dunia-opt" aria-pressed={value === id} onClick={() => onChange(id)}>
          <i className={"dunia-dot is-" + id} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}

// The smoke curtain between the worlds: a tall sheet in the destination's
// colour, soft at both ends, that rises over the page, holds while the page
// underneath changes, then carries on up and away.
export function DuniaVeil({ veilRef }) {
  return (
    <div className="dunia-veil" ref={veilRef} aria-hidden="true">
      <div className="dunia-veil-sheet" />
      <p className="dunia-veil-label" />
    </div>
  );
}

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function coverVeil(el, to) {
  const sheet = el.querySelector(".dunia-veil-sheet");
  const label = el.querySelector(".dunia-veil-label");
  el.style.setProperty("--veil", BG[to]);
  el.dataset.to = to;
  label.textContent = ARRIVE[to];
  el.classList.add("is-on");
  const tl = gsap.timeline();
  if (reducedMotion()) {
    gsap.set(sheet, { y: -0.45 * innerHeight });
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  } else {
    gsap.set(el, { opacity: 1 });
    tl.fromTo(sheet, { y: innerHeight }, { y: -0.45 * innerHeight, duration: 0.85, ease: "power3.inOut" }).fromTo(
      label,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
      "-=0.2",
    );
  }
  return tl.then();
}

export function uncoverVeil(el) {
  const sheet = el.querySelector(".dunia-veil-sheet");
  const label = el.querySelector(".dunia-veil-label");
  const tl = gsap.timeline({ onComplete: () => el.classList.remove("is-on") });
  if (reducedMotion()) {
    tl.to(el, { opacity: 0, duration: 0.3 });
  } else {
    tl.to(label, { opacity: 0, y: -14, duration: 0.25, ease: "power2.in" }).to(
      sheet,
      { y: -1.8 * innerHeight, duration: 1, ease: "power3.inOut" },
      "-=0.05",
    );
  }
  return tl.then();
}

// The NYATA hero: who, what and where in one screen, on a light ground, with
// the real photo instead of the character.
export function NyataHero({ items, profile, goTo }) {
  const sentences = (profile.bio || "").split(/(?<=\.)\s+/);
  const lead = sentences.slice(0, 2).join(" ");
  const short = profile.name.split(" ").slice(-2).join(" ");
  const place = profile.experience?.[0]?.place?.split(" · ")[0];
  const facts = [
    ["Project", String(items.length).padStart(2, "0")],
    profile.location && ["Kota", profile.location],
    place && ["Sekarang di", place],
  ].filter(Boolean);
  return (
    <div className="nh">
      <a className="wordmark nh-wordmark nh-in" href="#home" aria-label={`${profile.name}, beranda`}>
        {short}
      </a>
      <div className="nh-grid">
        <div className="nh-copy">
          <p className="section-kicker nh-in">Dunia nyata · {profile.role}</p>
          <h1 className="nh-title">
            <span className="nh-in">Web yang</span> <span className="nh-in hollow">dipakai</span>{" "}
            <span className="nh-in">
              setiap hari
              <Dot />
            </span>
          </h1>
          <p className="nh-lead nh-in">{lead}</p>
          <div className="nh-actions nh-in">
            <a className="nh-button" href="#projects" onClick={(e) => goTo(e, "projects")}>
              Lihat {items.length} project <span aria-hidden="true">↓</span>
            </a>
            <a className="text-link" href="#contact" onClick={(e) => goTo(e, "contact")}>
              Hubungi saya <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        <figure className="nh-card nh-in">
          <img src={asset("/about.jpg")} alt={`Foto ${profile.name}`} fetchPriority="high" />
          <figcaption>
            <strong>{profile.name}</strong>
            <span>Aslinya, tanpa sapu.</span>
          </figcaption>
        </figure>
      </div>
      <dl className="nh-facts nh-in">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
