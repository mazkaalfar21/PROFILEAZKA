import React, { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { autoplay } from "./autoplay";

// A 15-second motion-graphic trailer for one project, built from its own
// content: brand colour and logo, the main screenshot in a laptop with its
// first features, the gallery shots in a 3D fan, the stack as chips, and an
// end card. It loops while it has the turn (src/autoplay.js: only the one
// nearest the middle of the window plays) and holds on its opening frame
// until then. Under reduced motion it shows one still frame and never plays.
//
// Everything is sized in container units (cqw/cqh), so the same trailer reads
// in a 350px card, behind a GAIB heirloom and across a case study page.
const LENGTH = 15.2;
const POSTER_AT = 2.2; // the opening, fully composed
const STILL_AT = 6.6; // laptop and features, for reduced motion

const pad = (n) => String(n).padStart(2, "0");

const light = (hex = "#1a0f0c") => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.6;
};

// A wordmark is long and reads at a low height; a square badge needs more.
function shapeLogo(e) {
  const img = e.currentTarget;
  img.dataset.shape = img.naturalWidth / img.naturalHeight > 2.4 ? "wide" : "square";
}

export default function Trailer({ item, index, cta }) {
  const root = useRef();
  const brand = item.logoBg || "#1a0f0c";
  // App icons (SVG) need the name beside them; wordmarks already say it.
  const showName = !item.logoText && (!item.logo || item.logo.endsWith(".svg"));
  const features = (item.features || []).slice(0, 3);
  const stack = (item.stack || "").split("·").map((s) => s.trim()).filter(Boolean);
  const shots = useMemo(() => {
    const gallery = (item.gallery || []).filter((g) => g.src);
    const list = gallery.length >= 2 ? gallery : [{ src: item.image, caption: "Tampilan utama" }, ...gallery];
    return list.slice(0, 3);
  }, [item]);

  useEffect(() => {
    const el = root.current;
    const q = gsap.utils.selector(el);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tl = gsap.timeline({ paused: true, repeat: -1, defaults: { ease: "power3.out" } });
    const scenes = q(".tr-stage, .tr-deck, .tr-stack, .tr-end");
    const fan = shots.length === 3 ? [16, 0, -16] : [12, -12];

    tl.set(scenes, { autoAlpha: 0 }, 0)
      .set(q(".tr-open"), { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)" }, 0)
      // 1. Opening on the brand colour.
      .fromTo(q(".tr-logo"), { autoAlpha: 0, scale: 0.6, filter: "blur(8px)" }, { autoAlpha: 1, scale: 1, filter: "blur(0px)", duration: 0.9 }, 0.15)
      .fromTo(q(".tr-kicker"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6 }, 0.55)
      .fromTo(q(".tr-name"), { autoAlpha: 0, yPercent: 40 }, { autoAlpha: 1, yPercent: 0, duration: 0.9 }, 0.65)
      .fromTo(q(".tr-tag"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.7 }, 1.05)
      .set(q(".tr-stage"), { autoAlpha: 1 }, 2.6)
      .to(q(".tr-open"), { clipPath: "inset(0% 0% 100% 0%)", duration: 0.8, ease: "power3.inOut" }, 2.6)
      // 2. The app in a laptop, features beside it.
      .fromTo(q(".tr-laptop"), { autoAlpha: 0, yPercent: 16, rotateX: 22 }, { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 1.2 }, 2.8)
      .fromTo(q(".tr-screen img"), { scale: 1, yPercent: 0 }, { scale: 1.12, yPercent: -4, duration: 4.6, ease: "none" }, 2.9)
      .fromTo(q(".tr-features li"), { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.55 }, 3.7)
      .to(q(".tr-stage"), { autoAlpha: 0, duration: 0.5 }, 7.1)
      // 3. The other screens fan in, in depth.
      .set(q(".tr-deck"), { autoAlpha: 1 }, 7.4)
      .fromTo(
        q(".tr-card"),
        { autoAlpha: 0, rotateY: -60, xPercent: 40, z: -200 },
        { autoAlpha: 1, rotateY: (i) => fan[i] ?? 0, xPercent: 0, z: 0, duration: 1.1, stagger: 0.3 },
        7.45,
      )
      .fromTo(q(".tr-card figcaption"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5, stagger: 0.3 }, 8.2)
      .to(q(".tr-deck"), { autoAlpha: 0, duration: 0.5 }, 11)
      // 4. The stack drops in as chips.
      .set(q(".tr-stack"), { autoAlpha: 1 }, 11.4)
      .fromTo(q(".tr-stack-label"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, 11.4)
      .fromTo(
        q(".tr-chip"),
        { autoAlpha: 0, yPercent: -140, rotate: (i) => (i % 2 ? 9 : -9) },
        { autoAlpha: 1, yPercent: 0, rotate: 0, duration: 0.7, ease: "back.out(1.7)", stagger: 0.12 },
        11.6,
      )
      .fromTo(q(".tr-role"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 12.5)
      .to(q(".tr-stack"), { autoAlpha: 0, duration: 0.4 }, 13.6)
      // 5. End card.
      .set(q(".tr-end"), { autoAlpha: 1 }, 13.9)
      .fromTo(q(".tr-end > *"), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.15 }, 13.9)
      .to(q(".tr-end"), { autoAlpha: 0, duration: 0.4 }, 14.8)
      .fromTo(q(".tr-progress i"), { scaleX: 0 }, { scaleX: 1, duration: LENGTH, ease: "none" }, 0);

    if (reduced) {
      tl.seek(STILL_AT);
      return () => tl.kill();
    }
    tl.seek(POSTER_AT);
    const turn = autoplay(el, (on) => {
      el.classList.toggle("is-playing", on);
      if (on) tl.restart();
      else tl.pause();
    });
    // After each full loop, a neighbour in the same grid row may take over.
    tl.eventCallback("onRepeat", turn.done);
    return () => {
      turn.release();
      tl.kill();
    };
  }, [item, shots]);

  return (
    <div
      className="trailer"
      ref={root}
      // A pale brand colour only tints the dark scenes; a deep one carries them.
      style={{ "--brand": brand, "--brand-ink": light(brand) ? "#140a08" : "#f7f2ec", "--brand-mix": light(brand) ? "18%" : "60%" }}
      aria-hidden="true"
    >
      <div className="tr-stage">
        <div className="tr-laptop">
          <div className="tr-screen">
            <img src={item.image} alt="" loading="lazy" decoding="async" />
          </div>
          <div className="tr-base" />
        </div>
        <ol className="tr-features">
          {features.map((f, i) => (
            <li key={i}>
              <span className="tr-f-index">{pad(i + 1)}</span>
              <span className="tr-f-text">{f}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="tr-deck" data-count={shots.length}>
        {shots.map((s) => (
          <figure className="tr-card" key={s.src}>
            <img src={s.src} alt="" loading="lazy" decoding="async" />
            {s.caption && <figcaption>{s.caption}</figcaption>}
          </figure>
        ))}
      </div>

      <div className="tr-stack">
        <p className="tr-stack-label">Dibangun dengan</p>
        <div className="tr-chips">
          {stack.map((s) => (
            <span className="tr-chip" key={s}>
              {s}
            </span>
          ))}
        </div>
        {(item.role || item.year) && <p className="tr-role">{[item.role, item.year].filter(Boolean).join(" · ")}</p>}
      </div>

      <div className="tr-end">
        <p className="tr-end-name">{item.name}</p>
        {cta && (
          <p className="tr-end-cta">
            {cta} <span>→</span>
          </p>
        )}
      </div>

      <div className="tr-open">
        <div className="tr-logo">
          {item.logo ? <img src={item.logo} alt="" onLoad={shapeLogo} /> : <span className="tr-logo-text">{item.logoText || item.name}</span>}
        </div>
        <p className="tr-kicker">
          Project {pad(index + 1)}
          {item.year && <> · {item.year}</>}
        </p>
        {showName && <h3 className="tr-name">{item.name}</h3>}
        {item.nameEn && <p className="tr-tag">{item.nameEn}</p>}
      </div>

      <div className="tr-progress">
        <i />
      </div>
    </div>
  );
}
