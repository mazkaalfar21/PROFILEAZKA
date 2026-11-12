// One moving picture at a time. Every trailer (or recording) registers here;
// on each scroll, resize or tab change the one whose middle is nearest the
// middle of the window, and that is at least half on screen, gets the turn
// and the rest stop. With the tab hidden, none plays.
//
// Players in the same row of a grid are equally near, so they share the turn:
// the one playing keeps it until it finishes a loop and calls done(), then it
// passes to the next of them.
const TIE_PX = 48;
const players = new Set();
let current = null;
let frame = 0;

// The players that could have the turn now, nearest first, cut to the ones
// tied with the nearest.
function contenders() {
  if (document.visibilityState !== "visible") return [];
  const mid = innerHeight / 2;
  const list = [];
  for (const p of players) {
    const r = p.el.getBoundingClientRect();
    if (!r.height || !r.width) continue;
    const shown = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
    if (shown < r.height * 0.5) continue;
    list.push({ p, distance: Math.abs((r.top + r.bottom) / 2 - mid), x: r.left });
  }
  list.sort((a, b) => a.distance - b.distance || a.x - b.x);
  return list.filter((c) => c.distance - list[0].distance < TIE_PX).map((c) => c.p);
}

function give(next) {
  if (next === current) return;
  current?.setActive(false);
  current = next;
  next?.setActive(true);
}

function pick() {
  frame = 0;
  const group = contenders();
  // Keep the turn where it is while that player is still among the nearest.
  give(group.includes(current) ? current : group[0] ?? null);
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(pick);
}

let listening = false;
function listen() {
  if (listening) return;
  listening = true;
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  document.addEventListener("visibilitychange", schedule);
}

// Register an element; setActive(true|false) is called as it gains or loses
// the turn. Returns { release, done }: release when unmounting, done after
// each full loop so a tied neighbour can take its turn.
export function autoplay(el, setActive) {
  listen();
  const player = { el, setActive };
  players.add(player);
  schedule();
  // Layout can still be settling (fonts, images, reveals); look again shortly.
  const late = setTimeout(schedule, 600);
  return {
    release() {
      clearTimeout(late);
      players.delete(player);
      if (current === player) {
        current = null;
        setActive(false);
      }
      schedule();
    },
    done() {
      if (current !== player) return;
      const group = contenders();
      if (group.length < 2) return;
      give(group[(group.indexOf(player) + 1) % group.length]);
    },
  };
}
