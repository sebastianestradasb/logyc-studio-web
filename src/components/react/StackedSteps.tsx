import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

type Step = { title: string; text: string; tag?: string };

// Each step pins near the top and the next one slides over it, while the cards underneath
// shrink slightly, so the process reads as a stack building up.
// `top` is where the first card pins (any CSS length); pages with a pinned heading pass a larger offset.
export default function StackedSteps({ steps, top = "96px" }: { steps: Step[]; top?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  return (
    <div ref={ref} className="relative mt-14">
      {steps.map((s, i) => (
        <StepCard
          key={i}
          step={s}
          index={i}
          total={steps.length}
          progress={scrollYProgress}
          still={!!reduce}
          top={top}
        />
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
}: {
  step: Step;
  index: number;
  total: number;
  progress: MotionValue<number>;
  still: boolean;
  top: string;
}) {
  const targetScale = 1 - (total - 1 - index) * 0.05;
  const scale = useTransform(progress, [index / total, 1], [1, still ? 1 : targetScale]);
  const num = String(index + 1).padStart(2, "0");

  return (
    <div className="sticky flex h-[58vh] items-start md:h-[62vh]" style={{ top: `calc(${top} + ${index * 26}px)` }}>
      <motion.div
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
