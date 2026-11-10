import { useEffect, useState } from "react";

// Hash routing keeps the site a plain static build: `#/project/<id>` is a case
// study, anything else (including section anchors like `#projects`) is home.
export function parseRoute(hash = location.hash) {
  const match = hash.match(/^#\/project\/([\w-]+)/);
  return match ? { page: "project", id: match[1] } : { page: "home" };
}

export function useRoute() {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    const onChange = () => setRoute(parseRoute());
    addEventListener("hashchange", onChange);
    return () => removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export const projectHref = (id) => `#/project/${id}`;

// Home is rebuilt when you come back from a case study (the 3D scene and the
// pinned journey do not survive the page swap), so remember where the reader
// was and put them back there.
const KEY = "dukun:home-scroll";
export function rememberScroll() {
  try {
    sessionStorage.setItem(KEY, String(scrollY));
  } catch {}
}
export function takeScroll() {
  try {
    const value = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return value === null ? null : Number(value);
  } catch {
    return null;
  }
}
