import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

// The opening ritual shown once per page load, before the site appears: the
// Dukun star draws itself, the wordmark rises, a counter follows the real
// asset loading (data first, then the scene's textures), and a curtain lifts
// onto the page. It never finishes before MIN_MS so the sequence can play,
// and never hangs past MAX_MS if a loader stalls.
const PHRASES = ["Menyalakan dupa", "Membaca mantra", "Memanggil project", "Membuka gerbang"];
const MIN_MS = 2600;
const MAX_MS = 9000;
const EXIT_MS = 1100;
const SPOKES = [0, 45, 90, 135];

export default function Intro({ ready, name, role, onDone }) {
  const reduced = useRef(matchMedia("(prefers-reduced-motion: reduce)").matches).current;
  const { active, progress } = useProgress();
  const live = useRef({ active, progress, ready });
  live.current = { active, progress, ready };
  const root = useRef();
  const [shown, setShown] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [phrase, setPhrase] = useState(0);

  // Hold the page still underneath while the intro is up.
  useEffect(() => {
    const el = root.current;
    const stop = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    el.addEventListener("wheel", stop, { passive: false });
    el.addEventListener("touchmove", stop, { passive: false });
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      el.removeEventListener("wheel", stop);
      el.removeEventListener("touchmove", stop);
      html.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setPhrase((p) => (p + 1) % PHRASES.length), 950);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const start = performance.now();
    const min = reduced ? 500 : MIN_MS;
    let readyAt = null,
      value = 0,
      raf = 0,
      exitTimer = 0;
    const tick = (now) => {
      const t = now - start;
      const { active, progress, ready } = live.current;
      if (ready && readyAt === null) readyAt = now;
      // Give the scene a moment to start its loaders once the data is in.
      const settled = readyAt !== null && now - readyAt > 400 && !active;
      const done = (settled && t >= min) || t > MAX_MS;
      const byTime = Math.min(1, t / min) * 96;
      const byLoad = !ready ? 55 : active ? 55 + progress * 0.41 : 96;
      const target = done ? 100 : Math.min(byTime, byLoad);
      value += (target - value) * (done ? 0.16 : 0.07);
      if (done && value > 99.4) value = 100;
      setShown(Math.round(value));
      if (value >= 100) {
        setLeaving(true);
        exitTimer = setTimeout(onDone, reduced ? 300 : EXIT_MS);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      ref={root}
      className={"intro" + (leaving ? " is-leaving" : "")}
      role="status"
      aria-live="polite"
      aria-label={`Memuat situs, ${shown} persen`}
    >
      <div className="intro-glow" aria-hidden="true" />
      <div className="intro-center" aria-hidden="true">
        <svg className="intro-star" viewBox="-50 -50 100 100">
          {SPOKES.map((angle, i) => (
            <line
              key={angle}
              x1="0"
              y1="-44"
              x2="0"
              y2="44"
              pathLength="1"
              transform={`rotate(${angle})`}
              style={{ animationDelay: `${0.1 + i * 0.14}s` }}
            />
          ))}
        </svg>
        <p className="intro-word">
          {"Dukun".split("").map((letter, i) => (
            <span key={i} style={{ animationDelay: `${0.35 + i * 0.07}s` }}>
              {letter}
            </span>
          ))}
        </p>
        {name && (
          <p className="intro-name">
            {name}
            {role && <> · {role}</>}
          </p>
        )}
      </div>
      <div className="intro-bottom" aria-hidden="true">
        <p className="intro-phrase" key={phrase}>
          {PHRASES[phrase]}…
        </p>
        <p className="intro-count">
          {String(shown).padStart(3, "0")}
          <span>%</span>
        </p>
      </div>
      <div className="intro-rule" aria-hidden="true">
        <i style={{ transform: `scaleX(${shown / 100})` }} />
      </div>
    </div>
  );
}
