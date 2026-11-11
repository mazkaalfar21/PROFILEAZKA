import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { JOURNEY } from "./journey";
import Lenis from "@studio-freight/lenis";
import Scene from "./Scene";
import Intro from "./Intro";
import { scrollState as state } from "./scrollState";
import { projectHref, rememberScroll, takeScroll, useRoute } from "./router";
import { About, Certificates, Contact, Experience, ProjectList, SECTIONS, SiteFooter, useReveal } from "./sections";
import ProjectPage from "./ProjectPage";
import { OUTFITS } from "./outfits";
import { asset, withAssets } from "./asset";
import "./style.css";
gsap.registerPlugin(ScrollTrigger, useGSAP);
const AUTO_MS = 3000; // how long each project stays over the hand before sliding on
const OUTFIT_KEY = "dukun:outfit";

// The outfit a visitor picked last time, if this browser kept it.
function savedOutfit() {
  try {
    const i = OUTFITS.findIndex((o) => o.id === localStorage.getItem(OUTFIT_KEY));
    return i < 0 ? 0 : i;
  } catch {
    return 0;
  }
}

function OutfitSwitch({ value, onChange }) {
  // Warm the browser cache so the swap does not wait on the network.
  const warm = () => OUTFITS.forEach((o) => (new Image().src = o.image));
  return (
    <div className="outfit-switch" role="group" aria-label="Ganti outfit karakter" onPointerEnter={warm} onFocus={warm}>
      <p className="outfit-label">Ganti outfit</p>
      <div className="outfit-swatches">
        {OUTFITS.map((o, i) => (
          <button
            key={o.id}
            type="button"
            className="outfit-swatch"
            aria-pressed={i === value}
            aria-label={o.name}
            title={o.name}
            style={{ "--a": o.swatch[0], "--b": o.swatch[1] }}
            onClick={() => onChange(i)}
          />
        ))}
      </div>
      <p className="outfit-name" aria-live="polite">
        {OUTFITS[value].name}
      </p>
    </div>
  );
}

// Loads the two content files and picks the page. Home is only mounted once
// the data is in, so the pinned journey measures the full page on first run.
function App() {
  const route = useRoute();
  const [data, setData] = useState(null);
  useEffect(() => {
    Promise.all([
      fetch(asset("/props/props.json")).then((r) => r.json()),
      fetch(asset("/profile.json")).then((r) => r.json()),
    ]).then(([items, profile]) => setData(withAssets(items, profile)));
  }, []);
  // The intro plays once per page load, over whichever page is underneath;
  // moving between home and a case study afterwards does not replay it.
  const [introDone, setIntroDone] = useState(false);
  return (
    <>
      {data &&
        (route.page === "project" ? (
          <ProjectPage items={data.items} profile={data.profile} id={route.id} />
        ) : (
          <Home items={data.items} profile={data.profile} />
        ))}
      {!introDone && (
        <Intro
          ready={!!data}
          name={data?.profile.name}
          role={data?.profile.role}
          onDone={() => setIntroDone(true)}
        />
      )}
    </>
  );
}

function Home({ items, profile }) {
  const root = useRef(),
    lenis = useRef(),
    label = useRef(),
    sceneAway = useRef(false),
    panelLiveRef = useRef(false);
  const swipeStart = useRef(null);
  const [selectedId, setSelectedId] = useState(() => {
    const id = items.some((i) => i.id === state.selectedId) ? state.selectedId : items[0]?.id;
    state.selectedId = id;
    state.selectedIndex = Math.max(0, items.findIndex((i) => i.id === id));
    return id;
  });
  const selectItem = (id) => {
    state.selectedId = id;
    state.selectedIndex = Math.max(0, items.findIndex((i) => i.id === id));
    setSelectedId(id);
  };
  const stepItem = (direction) => {
    if (!items.length) return;
    const index = items.findIndex(i => i.id === state.selectedId);
    selectItem(items[(index + direction + items.length) % items.length].id);
  };
  const [outfit, setOutfit] = useState(() => (state.outfit = savedOutfit()));
  const pickOutfit = (i) => {
    state.outfit = i;
    setOutfit(i);
    try {
      localStorage.setItem(OUTFIT_KEY, OUTFITS[i].id);
    } catch {}
  };
  const [paused, setPaused] = useState(false),
    [panelLive, setPanelLive] = useState(false),
    [holding, setHolding] = useState(false),
    [fallback, setFallback] = useState(false),
    [reduced, setReduced] = useState(
      matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  useEffect(() => {
    document.title = `${profile.name} — ${profile.role}`;
    const q = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(q.matches);
    q.addEventListener("change", change);
    try {
      const c = document.createElement("canvas");
      if (!c.getContext("webgl2")) setFallback(true);
    } catch {
      setFallback(true);
    }
    return () => q.removeEventListener("change", change);
  }, []);
  useReveal();
  // The carousel over the hand slides to the next project on its own every
  // AUTO_MS while it is on screen; there are no manual controls there. The
  // static collection (reduced motion, no WebGL) has no 3D stage to watch, so
  // it keeps its thumbnails, arrows and swipe, and hovering it holds autoplay.
  const manual = reduced || fallback;
  const autoplay = (panelLive || fallback) && !reduced && !holding && items.length > 1;
  useEffect(() => {
    if (!autoplay) return;
    const timer = setTimeout(() => {
      if (document.visibilityState === "visible") stepItem(1);
    }, AUTO_MS);
    return () => clearTimeout(timer);
  }, [autoplay, selectedId]);
  // Clicking the bubble is the same journey as scrolling, just taken in one go:
  // the film ripples where it was touched and the page carries you inside.
  const enterBubble = () => {
    // Touching the film runs the same zoom a scroll would, in one motion — let
    // the ripple read first, then carry the page down through the pinned zoom.
    setTimeout(
      () =>
        lenis.current?.scrollTo((innerHeight * JOURNEY.scrollVh) / 100, {
          duration: 3.2,
        }),
      260,
    );
  };
  const goTo = (e, id) => {
    e.preventDefault();
    lenis.current?.scrollTo("#" + id, { duration: 1.8 });
  };
  useGSAP(
    () => {
      state.reduced = reduced;
      state.progress = 0;
      state.outro = 0;
      state.entrance = 1;
      const smooth = new Lenis({ smoothWheel: !reduced, duration: 1.5 });
      lenis.current = smooth;
      smooth.on("scroll", ScrollTrigger.update);
      const tick = (t) => smooth.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      if (!reduced && !fallback) {
        gsap.from(".hero-top,.hero-bottom,.outfit-switch", {
          opacity: 0,
          y: 8,
          duration: 1.8,
          stagger: 0.12,
          ease: "power2.out",
        });
        const panel = root.current.querySelector(".zoom-panel");
        const outfitSwitch = root.current.querySelector(".outfit-switch");
        const tl = gsap.timeline({
          onUpdate() {
            const pr = this.progress();
            state.progress = pr;
            // Once it has faded out it must not sit invisibly over the cards.
            if (outfitSwitch) outfitSwitch.style.visibility = pr > JOURNEY.zoomStart + 0.12 ? "hidden" : "";
            // The overlay only takes pointer events once it has faded in over
            // the hand.
            if (panel) {
              const live = pr > JOURNEY.panelStart;
              panel.classList.toggle("is-live", live);
              panel.inert = !live;
              if (live !== panelLiveRef.current) {
                panelLiveRef.current = live;
                setPanelLive(live);
              }
            }
          },
          scrollTrigger: {
            id: "dukun-journey",
            trigger: ".hero",
            start: "top top",
            end: () => "+=" + (innerHeight * JOURNEY.scrollVh) / 100,
            pin: true,
            scrub: JOURNEY.scrub,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
          defaults: { ease: "none" },
        });
        tl.fromTo(
          ".lockup-left > span,.lockup-right > span",
          { opacity: 0.32, y: 34 },
          { opacity: 1, y: 0, duration: 0.12, stagger: 0.03 },
          0,
        )
          // The eyebrow carries your name and role, so it stays fully legible
          // from the first frame; only the tagline rises in with the scroll.
          .fromTo(
            ".tagline",
            { opacity: 0.22, y: 22 },
            { opacity: 1, y: 0, duration: 0.13, stagger: 0.03 },
            0.02,
          )
          // The intro copy clears out of the way as the camera starts to move.
          // The product overlay reveals itself off the `.is-live` class (CSS
          // transitions) so it is immune to the async item load reordering the
          // scrubbed tweens — see the onUpdate toggle above.
          .to(
            ".hero-copy,.hero-top,.hero-bottom,.outfit-switch",
            { opacity: 0, y: -30, duration: 0.14 },
            JOURNEY.zoomStart,
          )
          .to({}, { duration: 0.01 }, 1);
      }
      if (!fallback) {
        // As the portfolio sections slide over the scene, fade the canvas out
        // and stop rendering it once it is fully covered.
        ScrollTrigger.create({
          trigger: "#projects",
          start: "top bottom",
          end: "top 25%",
          onUpdate(self) {
            state.outro = self.progress;
            // Fade the container here too: once the render loop is paused it
            // can no longer update the canvas opacity itself.
            const container = document.querySelector(".canvas-container");
            if (container) container.style.opacity = String(1 - self.progress);
            const away = self.progress > 0.999;
            if (away !== sceneAway.current) {
              sceneAway.current = away;
              setPaused(away);
            }
          },
        });
      }
      // A thin line along the top of the window tracks how far down you are.
      gsap.to(".scroll-progress i", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { start: 0, end: "max", scrub: reduced ? true : 0.4 },
      });
      if (!reduced) {
        // Scroll-linked depth in the portfolio sections: images drift a little
        // slower than the page, the outlined heading words slide sideways and
        // the experience rail draws itself down. All scrubbed, so they follow
        // Lenis's smoothed scroll exactly.
        const ride = (trigger) => ({ trigger, start: "top bottom", end: "bottom top", scrub: true });
        gsap.utils.toArray(".project-parallax").forEach((el) =>
          gsap.fromTo(el, { yPercent: -5, scale: 1.12 }, { yPercent: 5, scale: 1.12, ease: "none", scrollTrigger: ride(el.parentElement) }),
        );
        const portrait = root.current.querySelector(".about-figure img");
        if (portrait)
          gsap.fromTo(portrait, { yPercent: -6, scale: 1.14 }, { yPercent: 6, scale: 1.14, ease: "none", scrollTrigger: ride(portrait.parentElement) });
        gsap.utils.toArray(".portfolio-section h2 .hollow").forEach((el) =>
          gsap.fromTo(el, { x: 48 }, { x: -24, ease: "none", scrollTrigger: ride(el.closest("h2")) }),
        );
        const rail = root.current.querySelector(".timeline");
        if (rail)
          gsap.fromTo(rail, { "--line": 0 }, {
            "--line": 1,
            ease: "none",
            scrollTrigger: { trigger: rail, start: "top 75%", end: "bottom 65%", scrub: true },
          });
      }
      // Arriving with a section anchor (#projects, #contact…) or coming back
      // from a case study: put the reader where they meant to be. Wait for the
      // web fonts first; the big headings re-wrap when they swap in and push
      // every later section down.
      const fontsReady = document.fonts?.ready ?? Promise.resolve();
      fontsReady.then(() => requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        // Lenis clamps to the page height it measured before the pin spacer
        // existed; re-measure or deep targets get cut short.
        smooth.resize();
        const hash = location.hash;
        const target =
          hash.length > 1 && !hash.startsWith("#/") ? document.querySelector(hash) : null;
        const saved = takeScroll();
        // The browser may already have jumped to the anchor before Lenis
        // existed, so Lenis's own idea of the scroll is stale: pass an
        // absolute position rather than the element.
        if (target && hash !== "#home")
          smooth.scrollTo(target.getBoundingClientRect().top + scrollY, { immediate: true, force: true });
        else if (saved !== null) smooth.scrollTo(saved, { immediate: true, force: true });
      }));
      return () => {
        smooth.destroy();
        gsap.ticker.remove(tick);
      };
    },
    { scope: root, dependencies: [reduced, fallback], revertOnUpdate: true },
  );
  return (
    <div ref={root}>
      {!fallback && items.length > 0 && (
        <Scene
          items={items}
          onEnterBubble={enterBubble}
          labelRef={label}
          onFail={() => setFallback(true)}
          reduced={reduced}
          paused={paused}
        />
      )}
      <div className="ambient-base" />
      <div className="scroll-progress" aria-hidden="true">
        <i />
      </div>
      <nav className="site-nav" aria-label="Navigasi utama">
        {SECTIONS.filter(([id]) =>
          id === "experience" ? profile.experience?.length :
          id === "certificates" ? profile.certificates?.length : true,
        ).map(([id, text]) => (
          <a key={id} href={"#" + id} className={"site-nav-link nav-" + id} onClick={(e) => goTo(e, id)}>
            {text}
          </a>
        ))}
      </nav>
      <main>
        <section className="hero" id="home">
          {fallback && (
            <div className="hero-atmosphere" aria-hidden="true">
              <picture>
                <source
                  media="(max-width: 700px)"
                  srcSet={asset("/textures/scene-mobile.jpg")}
                />
                <img src={asset("/textures/scene.jpg")} alt="" fetchPriority="high" />
              </picture>
              <div className="hero-light" />
            </div>
          )}
          <div className="hero-top hero-fade">
            <a className="wordmark" href="#home" aria-label="Dukun, beranda">
              Dukun
            </a>
          </div>
          {/* With WebGL the figure is a 2.5D plate inside the canvas so the
              bubble can reflect it and the props can pass behind it. */}
          {fallback && (
            <div className="character-wrap">
              <img
                className="character"
                src={OUTFITS[outfit].image}
                alt={`Dukun Gen Z memakai outfit ${OUTFITS[outfit].name}: rompi tenun, hoodie hitam, sarung batik, dan sapu bertengkorak`}
                fetchPriority="high"
              />
            </div>
          )}
          <div className="hero-copy hero-fade">
            <p className="eyebrow">
              <span className="eyebrow-rule" />
              {profile.name} · {profile.role}
            </p>
            <h1 className="lockup">
              <span className="lockup-left">
                <span className="line-solid">GEN Z</span>
                <span className="line-solid">Witch</span>
              </span>
              <span className="lockup-right">
                <span className="line-hollow">Dukun</span>
                <span className="line-hollow">Gen Z</span>
              </span>
            </h1>
            <p className="tagline">
              Ada yang tak terlihat.
              <br />
              Tapi selalu terasa.
            </p>
          </div>
          {fallback && (
            <img
              className="static-bubble"
              src={asset("/bubble.png")}
              alt=""
              aria-hidden="true"
            />
          )}
          <OutfitSwitch value={outfit} onChange={pickOutfit} />
          <div className="hero-bottom hero-fade">
            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                lenis.current?.scrollTo((innerHeight * JOURNEY.scrollVh) / 100, {
                  duration: 3,
                });
              }}
            >
              <span className="scroll-icon">↓</span> Scroll pelan. Masuk ke
              dalam.
            </a>
            {!fallback && (
              <span className="bubble-hint">
                <span className="hint-dot" /> Gelembungnya bisa disentuh
              </span>
            )}
            <span>Est. di alam ini, 2026</span>
          </div>
          <div className={"zoom-panel" + (reduced || fallback ? " is-live static-collection" : "")} inert={!reduced && !fallback} aria-label="Karya pilihan" role="region" aria-roledescription="carousel"
            {...(manual && {
              onPointerDown: e => { if(e.button === 0) swipeStart.current = [e.clientX,e.clientY]; },
              onPointerCancel: () => { swipeStart.current = null; },
              onPointerUp: e => { const start=swipeStart.current; swipeStart.current=null; if(start && Math.abs(e.clientX-start[0])>55 && Math.abs(e.clientX-start[0])>Math.abs(e.clientY-start[1])*1.4) stepItem(e.clientX<start[0]?1:-1); },
              onKeyDown: e => { if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();stepItem(e.key==='ArrowRight'?1:-1);} },
              onPointerEnter: e => { if (e.pointerType === 'mouse') setHolding(true); },
              onPointerLeave: e => { if (e.pointerType === 'mouse') setHolding(false); },
              onFocus: () => setHolding(true),
              onBlur: e => { if (!e.currentTarget.contains(e.relatedTarget)) setHolding(false); },
            })}>
            {manual && <div className="collection-swipe-surface" aria-hidden="true" />}
            {manual && <div className="zoom-cards">
              {items.map((item) => (
                <button
                  key={item.id}
                  className={"zoom-card" + (selectedId === item.id ? " is-selected" : "")}
                  aria-pressed={selectedId === item.id}
                  onClick={() => selectItem(item.id)}
                  aria-label={item.name}
                >
                  <img className="zoom-card-thumb" src={item.thumb} alt="" />
                </button>
              ))}
            </div>}
            <div className="zoom-text" aria-live="polite">
              {items.filter(item => item.id === selectedId).map(item => <div className="collection-copy" data-item={item.id} key={item.id}>
                <p className="collection-caption">Karya lintas dimensi</p>
                <h2>{item.name.split(' ').map((word,i) => <React.Fragment key={i}>{i>0 && <br />}{word}{i===item.name.split(' ').length-1?'.':''}</React.Fragment>)}</h2>
                <p className="zoom-lead">{item.blurb}</p>
                <a className="zoom-cta" href={projectHref(item.id)} onClick={rememberScroll}>Lihat detailnya <span aria-hidden="true">↗</span></a>
              </div>)}
              <div className="collection-controls">{manual && <button onClick={() => stepItem(-1)} aria-label="Project sebelumnya">←</button>}<span>{String(items.findIndex(i=>i.id===selectedId)+1).padStart(2,'0')} / {String(items.length).padStart(2,'0')}</span>{manual && <button onClick={() => stepItem(1)} aria-label="Project berikutnya">→</button>}</div>
              <div className={"collection-timer" + (autoplay ? " is-running" : "")} aria-hidden="true">
                <i key={selectedId + (autoplay ? "-run" : "-hold")} style={{ animationDuration: AUTO_MS + "ms" }} />
              </div>
              <p className="swipe-hint">{holding ? "Berhenti sebentar · lepas kursor untuk lanjut" : "Berganti otomatis · scroll untuk semua project"}</p>
            </div>
          </div>
        </section>
        <ProjectList items={items} />
        <About profile={profile} />
        <Experience experience={profile.experience} />
        <Certificates certificates={profile.certificates} />
        <Contact profile={profile} />
      </main>
      <SiteFooter profile={profile} />
      <div ref={label} className="prop-label" aria-live="polite">
        <strong />
        <span />
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
