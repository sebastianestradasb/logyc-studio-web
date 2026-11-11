// Horizontal scroll timeline, built on Hyperiux Vault's timeline (https://vault.hyperiux.com, via 21st.dev).
// The section pins while scrolling and the track slides sideways; each step draws its stem and dot
// and reveals its copy line by line as it reaches the centre.
// Adapted for LOGYC: steps come in as props (any count; they alternate above and below the line),
// brand colours and fonts, scroll positions computed from the number of steps, room for the site
// header, and a shorter scroll on phones.

import { type CSSProperties, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/* Inline stand-in for @gsap/react's useGSAP: one gsap.context lives for the component's lifetime,
   the callback is re-added when dependencies change, and the context is reverted on unmount.
   A callback may return its own cleanup, which runs before the next re-add and on unmount. */
function useGSAP(
  callback: () => void | (() => void),
  options?: { dependencies?: unknown[]; scope?: { current: Element | null } },
) {
  const deps = options?.dependencies ?? [];
  const scope = options?.scope;
  const ctxRef = useRef<gsap.Context | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    ctxRef.current = gsap.context(() => {}, scope?.current ?? undefined);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!ctxRef.current) return;
    cleanupRef.current?.();
    const ret = ctxRef.current.add(callback);
    cleanupRef.current = typeof ret === "function" ? ret : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false,
    () => false,
  );
}

export type TimelineStep = { tag: string; title: string; text: string };

export type TimelineProps = {
  steps: TimelineStep[];
  title: string;
  periodLabel: string;
  imageUrl: string;
  imageAlt: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  /** Reveal animation duration, in seconds. */
  duration?: number;
};

type SplitTextInstance = InstanceType<typeof SplitText>;

export default function Timeline({
  steps,
  title,
  periodLabel,
  imageUrl,
  imageAlt,
  textColor = "#FAFAFA",
  mutedTextColor = "#a3a3a3",
  activeColor = "#AFFC30",
  duration = 1.2,
}: TimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const normalizedDuration = Math.max(0.2, duration);
  // Steps alternate: first above the line, second below, and so on.
  const items = steps.map((s, i) => ({ ...s, id: `s${i}`, top: i % 2 === 0 }));
  const topItems = items.filter((s) => s.top);
  const bottomItems = items.filter((s) => !s.top);
  const activeStyle: CSSProperties = { backgroundColor: activeColor };
  const mutedTextStyle: CSSProperties = { color: mutedTextColor };
  const tagStyle: CSSProperties = { color: activeColor };

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;

    const isMobile = window.innerWidth < 600;
    // Slide just far enough for the last step to end inside the screen, and draw the line just past
    // the last step's stem, both measured from the layout (the original's fixed percentages left
    // the last step off screen, or short of the line, with longer copy).
    const slider = wholeSliderRef.current;
    const line = section.querySelector<HTMLElement>(".journey-line");
    const leftIn = (el: HTMLElement) => {
      let x = 0;
      for (let n: HTMLElement | null = el; n && n !== slider; n = n.offsetParent as HTMLElement | null) x += n.offsetLeft;
      return x;
    };
    const stepEdges = () => [...section.querySelectorAll<HTMLElement>("[data-step]")].map((el) => [leftIn(el), leftIn(el) + el.offsetWidth]);
    const slideBy = () => -Math.max(0, Math.max(...stepEdges().map((e) => e[1])) - window.innerWidth * 0.94);
    const lineWidth = () => {
      if (!line?.parentElement) return 0;
      return Math.max(...stepEdges().map((e) => e[0])) + window.innerWidth * 0.08 - leftIn(line.parentElement);
    };

    // The pinned stage is only as tall as its content, so the slide ends exactly when the stage is
    // released and the content after the section follows right away (no empty screen below it).
    const releasedAt = () => `bottom ${stageRef.current?.offsetHeight ?? window.innerHeight}px`;
    gsap.timeline({
      scrollTrigger: { trigger: section, start: "top top", end: releasedAt, scrub: true, invalidateOnRefresh: true },
      defaults: { ease: "none" },
    }).fromTo(slider, { x: 0 }, { x: slideBy });

    if (reducedMotion) {
      gsap.set(".journey-line", { width: lineWidth });
      return;
    }

    gsap.to(".journey-line", {
      width: lineWidth,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: isMobile ? "top 30%" : "top 25%",
        end: releasedAt,
        scrub: true,
        invalidateOnRefresh: true,
      },
    });
  }, { dependencies: [reducedMotion], scope: sectionRef });

  useGSAP(() => {
    const section = sectionRef.current;
    if (!section) return;
    const q = (sel: string) => section.querySelectorAll<HTMLElement>(sel);

    if (reducedMotion) {
      items.forEach((item) => {
        gsap.set(q(`.jl-${item.id}`), { scaleY: 1 });
        gsap.set(q(`.jd-${item.id}`), { scale: 1 });
      });
      return;
    }

    items.forEach((item) => {
      gsap.set(q(`.jl-${item.id}`), { scaleY: 0, transformOrigin: item.top ? "bottom" : "top" });
      gsap.set(q(`.jd-${item.id}`), { scale: 0 });
    });

    const splits: SplitTextInstance[] = [];
    const split = (sel: string) => {
      const s = new SplitText(q(sel), { type: "lines", mask: "lines" });
      splits.push(s);
      return s.lines;
    };

    // Each step reveals over a window of the section's scroll; windows are spread evenly
    // across the slide (the original's hand-tuned seven positions, generalised to any count).
    const isMobile = window.innerWidth < 600;
    const [first, last, span] = isMobile ? [22, 69, 10] : [6, 65, 20];
    const step = items.length > 1 ? (last - first) / (items.length - 1) : 0;

    items.forEach((item, index) => {
      const startPos = first + index * step;
      const textLines = [...split(`.tag-${item.id}`), ...split(`.title-${item.id}`)];
      const descriptionLines = split(`.description-${item.id}`);

      gsap.timeline({
        scrollTrigger: { trigger: section, start: `${startPos}% 30%`, end: `${startPos + span}% 50%`, scrub: true },
      })
        .to(q(`.jl-${item.id}`), { scaleY: 1, duration: normalizedDuration * 0.4 })
        .to(q(`.jd-${item.id}`), { scale: 1, duration: normalizedDuration * 0.4 }, "<")
        .fromTo(textLines, { yPercent: 110 }, {
          yPercent: 0, delay: -0.8 * normalizedDuration, duration: normalizedDuration, stagger: 0.02, ease: "power2.out",
        })
        .fromTo(descriptionLines, { yPercent: 110 }, {
          yPercent: 0, duration: normalizedDuration, stagger: 0.02, ease: "power2.out",
        }, "<");
    });

    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", handleResize);
    return () => {
      splits.forEach((s) => s.revert());
      window.removeEventListener("resize", handleResize);
    };
  }, { dependencies: [normalizedDuration, reducedMotion], scope: sectionRef });

  const stepCopy = (item: (typeof items)[number]) => (
    <>
      <p className={`tag-${item.id} font-[family-name:var(--font-mono)] text-[.8vw] font-bold uppercase tracking-[.16em] max-[600px]:text-[2.9vw]`} style={tagStyle}>
        {item.tag}
      </p>
      <h4 className={`title-${item.id} font-[family-name:var(--font-display)] text-[1.9vw] font-bold leading-[1.02] tracking-[-.03em] max-[600px]:text-[6.6vw]`}>
        {item.title}
      </h4>
      <p className={`description-${item.id} w-[92%] text-[1.02vw] leading-[1.45] max-[600px]:w-full max-[600px]:text-[3.9vw]`} style={mutedTextStyle}>
        {item.text}
      </p>
    </>
  );

  return (
    <section
      ref={sectionRef}
      className="relative h-[200vw] w-full max-[600px]:h-[340vh]"
      style={{ color: textColor }}
    >
      <div ref={stageRef} className="sticky top-0 w-full overflow-hidden pb-[3vw] pt-[max(9vw,110px)] max-[600px]:pb-[8vw] max-[600px]:pt-[96px]">
        <div
          ref={wholeSliderRef}
          className="relative mr-[2vw] flex h-[30vw] w-[240vw] items-center gap-[5vw] px-[5vw] max-[600px]:h-[78vh] max-[600px]:w-[800vw] max-[600px]:px-[7vw]"
        >
          <div className="h-full w-[30vw] shrink-0 overflow-hidden rounded-[1vw] border border-[#2a2a2a] max-[600px]:h-[65vw] max-[600px]:w-[85vw] max-[600px]:rounded-[5vw]">
            <img src={imageUrl} alt={imageAlt} draggable={false} className="h-full w-full object-cover object-top" />
          </div>

          <div className="relative h-full w-full">
            <div className="absolute left-0 top-[49%] flex h-fit w-full items-center">
              <div className="h-[.8vw] w-[.8vw] rounded-full max-[600px]:h-[2vw] max-[600px]:w-[2vw]" style={activeStyle} />
              <div className="journey-line h-px w-[0%] rounded-full shadow-[0_0_10px_rgba(175,252,48,.6)]" style={activeStyle} />
              <div className="h-[.8vw] w-[.8vw] rounded-full max-[600px]:h-[2vw] max-[600px]:w-[2vw]" style={activeStyle} />
            </div>

            <div className="flex h-1/2 w-full items-center justify-start gap-[.5vw]">
              <div className="h-full w-[20%] shrink-0 pt-[2vw] max-[600px]:h-fit max-[600px]:pt-[5vw]">
                <h2 className="w-[80%] font-[family-name:var(--font-display)] text-[2.8vw] font-extrabold leading-[0.95] tracking-[-.035em] max-[600px]:text-[8.5vw]">
                  {title}
                </h2>
              </div>

              <div className="flex h-full w-full gap-x-[15vw] max-[600px]:gap-x-[40vw]">
                {topItems.map((item) => (
                  <div key={item.id} data-step className="relative h-full w-[30vw] shrink-0 px-[3vw] max-[600px]:w-[70vw] max-[600px]:px-[7vw]">
                    <div className="absolute bottom-0 left-0 top-0 h-full w-full">
                      <div className={`jd-${item.id} relative aspect-square size-[1vw] translate-x-[-50%] rounded-full shadow-[0_0_12px_rgba(175,252,48,.7)] max-[600px]:size-[2.5vw]`} style={activeStyle} />
                      <div className={`jl-${item.id} h-[94%] w-px origin-bottom rounded-full`} style={activeStyle} />
                    </div>
                    <div className="mt-[-1vw] space-y-[.7vw] max-[600px]:mt-[-2vw] max-[600px]:space-y-[2.5vw]">{stepCopy(item)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex h-1/2 w-full items-center justify-start">
              <div className="h-full w-[34%] shrink-0 pt-[2vw] max-[600px]:w-[30%] max-[600px]:pt-[5vw]">
                <p className="font-[family-name:var(--font-mono)] text-[1.1vw] font-semibold uppercase tracking-[.12em] leading-none max-[600px]:text-[3.4vw]" style={tagStyle}>
                  {periodLabel}
                </p>
              </div>

              <div className="ml-[7vw] flex h-full w-full gap-x-[20vw] max-[600px]:ml-[7vw] max-[600px]:gap-x-[40vw]">
                {bottomItems.map((item) => (
                  <div key={item.id} data-step className="relative h-full w-[25vw] shrink-0 px-[3vw] max-[600px]:w-[70vw] max-[600px]:px-[7vw]">
                    <div className="absolute bottom-[-1%] left-0 h-full w-full">
                      <div className={`jl-${item.id} h-[94%] w-px origin-top rounded-full max-[600px]:h-full`} style={activeStyle} />
                      <div className={`jd-${item.id} relative aspect-square size-[1vw] translate-x-[-50%] rounded-full shadow-[0_0_12px_rgba(175,252,48,.7)] max-[600px]:size-[2.5vw]`} style={activeStyle} />
                    </div>
                    <div className="flex h-full w-full flex-col justify-end space-y-[.7vw] max-[600px]:space-y-[2.5vw]">{stepCopy(item)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
