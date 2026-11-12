import React, { useEffect, useRef } from "react";
import Trailer from "./Trailer";
import { autoplay } from "./autoplay";

// A project's moving picture: its motion-graphic trailer (src/Trailer.jsx),
// or, if `video` is set in props.json, that file instead (for example the
// trailer exported as MP4). Either way only one plays at a time, the one
// nearest the middle of the window (src/autoplay.js).
export default function ProjectMedia({ item, index = 0, cta }) {
  return <span className="pmedia">{item.video ? <Recording item={item} /> : <Trailer item={item} index={index} cta={cta} />}</span>;
}

function Recording({ item }) {
  const video = useRef();
  useEffect(() => {
    const v = video.current;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const turn = autoplay(v, (on) => {
      if (on) {
        if (v.preload !== "auto") v.preload = "auto";
        v.play().catch(() => {});
      } else v.pause();
    });
    // Each pass through the clip, a neighbour in the same grid row may take over.
    let last = 0;
    const looped = () => {
      if (v.currentTime < last) turn.done(); // time jumped back: it looped
      last = v.currentTime;
    };
    v.addEventListener("timeupdate", looped);
    return () => {
      v.removeEventListener("timeupdate", looped);
      turn.release();
    };
  }, []);
  const sources = Array.isArray(item.video) ? item.video : [item.video];
  return (
    <video ref={video} className="pmedia-video" muted loop playsInline preload="none" poster={item.image} aria-hidden="true">
      {sources.map((src) => (
        <source key={src} src={src} type={src.endsWith(".webm") ? "video/webm" : "video/mp4"} />
      ))}
    </video>
  );
}
