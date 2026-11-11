import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// The crystal ball that ties the page together. Every big heading ends in a
// full stop marked `.orb-dock`; the ball flies to whichever of those is in
// view and becomes that full stop, and with none in view it rests beside the
// world switch. Clear glass in NYATA, coral smoke in GAIB. Holding it down
// crosses to the other world.
//
// In GAIB the 3D hero has its own bubble, so the ball stays away until the
// portfolio sections take over the screen.
const HOLD_MS = 900;
const LABEL = { nyata: "Tahan untuk menerawang", gaib: "Tahan untuk kembali sadar" };

export function Dot() {
  return <span className="orb-dock">.</span>;
}

export default function Orb({ nyata, onCross }) {
  const ball = useRef();
  const label = useRef();
  const ring = useRef();
  const [hover, setHover] = useState(false);
  const world = nyata ? "nyata" : "gaib";
  const cross = () => onCross(nyata ? "gaib" : "nyata");
  const crossRef = useRef(cross);
  crossRef.current = cross;

  // Frame loop: pick a dock, ease the ball toward it.
  useEffect(() => {
    const el = ball.current;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur = { x: innerWidth - 60, y: innerHeight - 45, s: 0, o: 0 };
    let docked = null;
    let first = true;
    const tick = (time, dt) => {
      const vw = innerWidth,
        vh = innerHeight;
      const mobile = vw <= 700;
      // Resting place: the same row as the world switch, at the right edge.
      const restSize = mobile ? 38 : 46;
      let tx = vw - (mobile ? 16 : 34) - restSize / 2;
      let ty = vh - (mobile ? 16 : 22) - 23;
      let ts = restSize;
      let target = null;
      let best = Infinity;
      for (const d of document.querySelectorAll(".orb-dock")) {
        const r = d.getBoundingClientRect();
        if (!r.width) continue;
        const cy = r.top + r.height * 0.5;
        if (cy < vh * 0.1 || cy > vh * 0.86) continue;
        const score = Math.abs(cy - vh * 0.45);
        if (score < best) {
          best = score;
          target = d;
        }
      }
      if (target) {
        const r = target.getBoundingClientRect();
        const fs = parseFloat(getComputedStyle(target).fontSize);
        ts = Math.max(14, fs * 0.3);
        // The full stop sits on the baseline, toward the bottom of the line
        // box, and just after the last letter.
        tx = r.left + fs * 0.05 + ts * 0.5;
        ty = r.top + r.height * 0.5 + fs * 0.27 - ts * 0.5;
      }
      // In GAIB the ball waits until the sections cover the 3D hero.
      let to = 1;
      if (!nyata) {
        const list = document.getElementById("projects");
        to = list && list.getBoundingClientRect().top < vh * 0.55 ? 1 : 0;
      }
      const k = reduced || first ? 1 : 1 - Math.exp(-(dt / 1000) * 5.5);
      first = false;
      cur.x += (tx - cur.x) * k;
      cur.y += (ty - cur.y) * k;
      cur.s += (ts - cur.s) * k;
      cur.o += (to - cur.o) * (reduced ? 1 : 1 - Math.exp(-(dt / 1000) * 6));
      const bob = target || reduced ? 0 : Math.sin(time * 1.6) * 3;
      el.style.transform = `translate3d(${cur.x - 50}px, ${cur.y - 50 + bob}px, 0) scale(${cur.s / 100})`;
      el.style.opacity = cur.o.toFixed(3);
      el.style.visibility = cur.o < 0.02 ? "hidden" : "visible";
      // Hide the typed full stop once the ball is sitting on it.
      const near = target && Math.hypot(tx - cur.x, ty - cur.y) < Math.max(4, ts * 0.4) && cur.o > 0.5;
      const now = near ? target : null;
      if (now !== docked) {
        docked?.classList.remove("is-docked");
        now?.classList.add("is-docked");
        docked = now;
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      docked?.classList.remove("is-docked");
    };
  }, [nyata]);

  // Hold to cross. A ring fills around the ball; letting go early drains it.
  const hold = useRef(null);
  const start = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    try {
      ball.current.setPointerCapture(e.pointerId);
    } catch {}
    hold.current?.kill();
    ball.current.classList.add("is-holding");
    hold.current = gsap.to(ring.current, {
      "--p": 1,
      duration: (HOLD_MS / 1000) * (1 - (parseFloat(getComputedStyle(ring.current).getPropertyValue("--p")) || 0)),
      ease: "power1.in",
      onComplete: () => {
        ball.current?.classList.remove("is-holding");
        gsap.set(ring.current, { "--p": 0 });
        crossRef.current();
      },
    });
  };
  const stop = () => {
    if (!hold.current) return;
    hold.current.kill();
    hold.current = null;
    ball.current?.classList.remove("is-holding");
    gsap.to(ring.current, { "--p": 0, duration: 0.35, ease: "power2.out" });
  };
  useEffect(() => () => hold.current?.kill(), []);

  // The label rides next to the cursor while it is over the ball.
  const move = (e) => {
    if (e.pointerType !== "mouse") return;
    // Below-right of the cursor, flipped when that would leave the window
    // (the ball rests in the bottom-right corner).
    const { offsetWidth: w, offsetHeight: h } = label.current;
    const x = e.clientX + 22 + w > innerWidth - 12 ? e.clientX - 22 - w : e.clientX + 22;
    const y = e.clientY + 14 + h > innerHeight - 8 ? e.clientY - 14 - h : e.clientY + 14;
    label.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  return (
    <>
      <button
        ref={ball}
        type="button"
        className={"orb is-" + world}
        aria-label={nyata ? "Masuk ke dunia gaib" : "Kembali ke dunia nyata"}
        onPointerDown={start}
        onPointerUp={stop}
        onPointerCancel={stop}
        onLostPointerCapture={stop}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse") {
            move(e);
            setHover(true);
          }
        }}
        onPointerMove={move}
        onPointerLeave={() => setHover(false)}
        onContextMenu={(e) => e.preventDefault()}
        // Keyboard: no holding a key, just cross.
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            cross();
          }
        }}
      >
        <span className="orb-glass" />
        <span className="orb-smoke" />
        <span className="orb-shine" />
        <span className="orb-ring" ref={ring} />
      </button>
      <p className={"orb-label" + (hover ? " is-on" : "")} ref={label} aria-hidden="true">
        {LABEL[world]}
      </p>
    </>
  );
}
