import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

type Step = { title: string; text: string; tag?: string };

const PEEK = 26; // how much of each earlier card stays visible above the next one

// Each step pins near the top and the next one slides over it, while the cards underneath
// shrink slightly, so the process reads as a stack building up.
// `top` is where the first card pins (any CSS length); pages with a pinned heading pass a larger offset.
//
// Plain spacers give the scroll room between cards, and each sticky box is sized from the card
// heights. A sticky card is released once the end of the stack reaches the bottom of its box, so
// every box is PEEK taller than the next one: all cards then let go together, exactly when the last
// card lands, and whatever follows the stack comes right after it with no empty scroll gap.
export default function StackedSteps({ steps, top = "96px" }: { steps: Step[]; top?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [boxes, setBoxes] = useState<number[]>();

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = [...el.querySelectorAll<HTMLElement>("[data-step-card]")];
    const measure = () => {
      const n = cards.length;
      const last = Math.max(...cards.map((c, i) => c.offsetHeight - (n - 1 - i) * PEEK));
      setBoxes(cards.map((_, i) => last + (n - 1 - i) * PEEK));
    };
    measure();
    const ro = new ResizeObserver(measure);
    cards.forEach((c) => ro.observe(c));
    return () => ro.disconnect();
  }, [steps.length]);

  return (
    <div ref={ref} className="relative mt-14">
      {steps.map((s, i) => (
        <Fragment key={i}>
          {i > 0 && <div aria-hidden="true" className="h-[30vh] md:h-[34vh]" />}
          <StepCard
            step={s}
            index={i}
            total={steps.length}
            progress={scrollYProgress}
            still={!!reduce}
            top={top}
            height={boxes?.[i]}
          />
        </Fragment>
      ))}
    </div>
  );
}

function StepCard({
  step,
  index,
  total,
  progress,
  still,
  top,
  height,
}: {
  step: Step;
  index: number;
  total: number;
  progress: MotionValue<number>;
  still: boolean;
  top: string;
  height?: number;
}) {
  const targetScale = 1 - (total - 1 - index) * 0.05;
  const scale = useTransform(progress, [index / total, 1], [1, still ? 1 : targetScale]);
  const num = String(index + 1).padStart(2, "0");

  return (
    <div className="sticky flex items-start" style={{ top: `calc(${top} + ${index * PEEK}px)`, height }}>
      <motion.div
        data-step-card
        style={{ scale, transformOrigin: "top center" }}
        className="grid w-full grid-cols-1 gap-6 rounded-[22px] border border-[#2a2a2a] bg-[linear-gradient(160deg,#151515,#0c0c0c)] p-8 shadow-[0_-20px_60px_rgba(0,0,0,.55)] md:grid-cols-[minmax(0,.9fr)_minmax(0,1.6fr)] md:gap-12 md:p-14"
      >
        <div className="font-[family-name:var(--font-display)] text-[clamp(64px,9vw,128px)] font-extrabold leading-[.85] tracking-[-.05em] text-transparent [-webkit-text-stroke:1.5px_var(--lime)]">
          {num}
        </div>
        <div className="self-end">
          {step.tag && (
            <span className="mb-4 inline-block rounded-full border border-[#2a2a2a] px-3 py-1 font-[family-name:var(--font-mono)] text-[10.5px] font-bold uppercase tracking-[.14em] text-[var(--gray-3)]">
              {step.tag}
            </span>
          )}
          <h4 className="font-[family-name:var(--font-display)] text-[clamp(26px,3.2vw,40px)] font-bold leading-[1.05] tracking-[-.03em] text-[var(--paper)]">
            {step.title}
          </h4>
          <p className="mt-4 max-w-[560px] text-[16.5px] leading-[1.6] text-[#bdbdbd]">{step.text}</p>
        </div>
      </motion.div>
    </div>
  );
}
