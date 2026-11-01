import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";

export type View = { src: string; srcSet: string; thumb: string; full: string; label: string; alt: string; pos: string };
export type Shot = { src: string; full: string; alt: string; w: number; h: number };
export type ShowcaseCopy = {
  eyebrow: string;
  title: string;
  text: string;
  views: string;
  more: string;
  hint: string;
  close: string;
  prev: string;
  next: string;
  open: string;
};

const ease = [0.2, 0.7, 0.2, 1] as const;
const CYCLE = 3800;

// AI product photography portfolio: one product shown across scenes (auto-cycling viewer),
// the rest of the collection in two drifting rows, and a lightbox for any photo.
export default function AiShowcase({ views, gallery, copy }: { views: View[]; gallery: Shot[]; copy: ShowcaseCopy }) {
  const still = !!useReducedMotion();
  const [box, setBox] = useState<{ list: { full: string; alt: string }[]; i: number } | null>(null);
  const half = Math.ceil(gallery.length / 2);
  const rows = [gallery.slice(0, half), gallery.slice(half)];

  return (
    <div className="mt-24">
      <Viewer views={views} copy={copy} still={still} onOpen={(i) => setBox({ list: views, i })} />
      <div className="mt-20">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h4 className="font-[family-name:var(--font-display)] text-[22px] font-bold tracking-[-.02em] text-[var(--paper)]">{copy.more}</h4>
          <span className="font-[family-name:var(--font-mono)] text-[11.5px] font-medium tracking-[.06em] text-[var(--gray-3)]">{copy.hint}</span>
        </div>
        <div className="flex flex-col gap-4 [mask-image:linear-gradient(to_right,transparent,#000_6%,#000_94%,transparent)]">
          {rows.map((row, r) => (
            <Row key={r} shots={row} reverse={r === 1} still={still} openLabel={copy.open}
              onOpen={(i) => setBox({ list: gallery, i: r * half + i })} />
          ))}
        </div>
      </div>
      <Lightbox state={box} setState={setBox} copy={copy} />
    </div>
  );
}

function Viewer({ views, copy, still, onOpen }: { views: View[]; copy: ShowcaseCopy; still: boolean; onOpen: (i: number) => void }) {
  const [i, setI] = useState(0);
  const [hold, setHold] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.4 });
  const auto = !still && inView && !hold;

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setI((x) => (x + 1) % views.length), CYCLE);
    return () => clearTimeout(t);
  }, [auto, i, views.length]);

  const pick = (n: number) => { setI(n); setHold(true); };
  const v = views[i];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div ref={ref} className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-16">
      <button
        type="button"
        onClick={() => onOpen(i)}
        aria-label={`${copy.open}: ${v.alt}`}
        className="group relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-[22px] border border-[#2a2a2a] bg-[#0d0d0d] md:max-h-[680px]"
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={i}
            src={v.src}
            srcSet={v.srcSet}
            sizes="(max-width: 900px) 92vw, 46vw"
            alt={v.alt}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.03]"
            style={{ objectPosition: v.pos }}
            initial={still ? false : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease }}
          />
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/75 to-transparent" />
        <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-center justify-between gap-3">
          <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--paper)] backdrop-blur">
            {pad(i + 1)} / {pad(views.length)} · {v.label}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[.14em] text-[var(--lime)]">KALMA</span>
        </div>
        {/* autoplay progress */}
        {auto && (
          <motion.div
            key={`p${i}`}
            className="absolute left-0 top-0 h-[3px] bg-[var(--lime)]"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: CYCLE / 1000, ease: "linear" }}
          />
        )}
      </button>

      <div>
        <span className="eyebrow"><span className="bk">[</span> {copy.eyebrow} <span className="bk">]</span></span>
        <h3 className="mt-5 font-[family-name:var(--font-display)] text-[clamp(28px,3.4vw,44px)] font-bold leading-[1.04] tracking-[-.03em] text-[var(--paper)]">
          {copy.title}
        </h3>
        <p className="mt-5 max-w-[520px] text-[16px] leading-[1.65] text-[#c4c4c4]">{copy.text}</p>
        <div className="mt-8 font-[family-name:var(--font-mono)] text-[11px] font-semibold uppercase tracking-[.16em] text-[var(--gray-3)]">{copy.views}</div>
        <div className="mt-4 grid grid-cols-5 gap-2.5">
          {views.map((t, n) => (
            <button
              key={t.label}
              type="button"
              onClick={() => pick(n)}
              aria-pressed={n === i}
              aria-label={t.label}
              className={`group/t block self-start text-left transition-opacity ${n === i ? "opacity-100" : "opacity-55 hover:opacity-100"}`}
            >
              <span className={`relative mb-2 block aspect-[4/5] w-full overflow-hidden rounded-[10px] border-2 transition-colors ${n === i ? "border-[var(--lime)]" : "border-transparent"}`}>
                <img src={t.thumb} alt="" loading="lazy" draggable={false} className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover/t:scale-105" style={{ objectPosition: t.pos }} />
              </span>
              <span className={`block truncate font-[family-name:var(--font-mono)] text-[10.5px] font-semibold uppercase tracking-[.08em] ${n === i ? "text-[var(--lime)]" : "text-[var(--gray-3)]"}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ shots, reverse, still, onOpen, openLabel }: { shots: Shot[]; reverse: boolean; still: boolean; onOpen: (i: number) => void; openLabel: string }) {
  // The track holds the row twice so the -50% translate loops seamlessly.
  const track = still ? shots : [...shots, ...shots];
  return (
    <div className={`group ${still ? "overflow-x-auto" : "overflow-hidden"}`}>
      <div
        className="flex w-max gap-4 group-hover:[animation-play-state:paused]"
        style={still ? undefined : { animation: `scrollx ${shots.length * 9}s linear infinite${reverse ? " reverse" : ""}` }}
      >
        {track.map((s, n) => (
          <button
            key={n}
            type="button"
            onClick={() => onOpen(n % shots.length)}
            aria-label={`${openLabel}: ${s.alt}`}
            aria-hidden={n >= shots.length ? true : undefined}
            tabIndex={n >= shots.length ? -1 : undefined}
            className="relative h-[220px] shrink-0 cursor-zoom-in overflow-hidden rounded-[16px] border border-[#2a2a2a] md:h-[300px]"
            style={{ aspectRatio: `${s.w} / ${s.h}` }}
          >
            <img src={s.src} alt={n >= shots.length ? "" : s.alt} loading="lazy" draggable={false}
              className="h-full w-full object-cover transition-transform duration-700 ease-out hover:scale-[1.06]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function Lightbox({
  state,
  setState,
  copy,
}: {
  state: { list: { full: string; alt: string }[]; i: number } | null;
  setState: (s: { list: { full: string; alt: string }[]; i: number } | null) => void;
  copy: ShowcaseCopy;
}) {
  const go = useCallback(
    (d: number) => state && setState({ ...state, i: (state.i + d + state.list.length) % state.list.length }),
    [state, setState],
  );

  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setState(null);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [state, go, setState]);

  const navBtn = "absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 text-xl text-[var(--paper)] backdrop-blur transition-colors hover:border-[var(--lime)] hover:text-[var(--lime)]";
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm md:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setState(null)}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={state.i}
              src={state.list[state.i].full}
              alt={state.list[state.i].alt}
              className="max-h-[86vh] max-w-full rounded-[14px] object-contain shadow-2xl"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease }}
              onClick={(e) => e.stopPropagation()}
            />
          </AnimatePresence>
          <button type="button" aria-label={copy.prev} className={`${navBtn} left-3 md:left-8`} onClick={(e) => { e.stopPropagation(); go(-1); }}>←</button>
          <button type="button" aria-label={copy.next} className={`${navBtn} right-3 md:right-8`} onClick={(e) => { e.stopPropagation(); go(1); }}>→</button>
          <button type="button" aria-label={copy.close} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/50 text-lg text-[var(--paper)] hover:border-[var(--lime)] hover:text-[var(--lime)] md:right-8 md:top-8" onClick={() => setState(null)}>✕</button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[11px] font-semibold tracking-[.14em] text-[var(--gray-3)]">
            {state.i + 1} / {state.list.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
