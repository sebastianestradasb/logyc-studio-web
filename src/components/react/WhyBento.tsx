import { useRef, type ReactNode, type PointerEvent } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

type Item = { title: string; text: string };
export type WhyCopy = {
  speed: Item & { tradLabel: string; tradValue: string; logycValue: string };
  quality: Item & { steps: [string, string, string] };
  price: Item & { cut: string[]; result: string };
  consistency: Item & { post: string; web: string; legend: string };
};

const LIME = "#AFFC30";
const ease = [0.2, 0.7, 0.2, 1] as const;

// "Why LOGYC" as an animated bento: each reason is shown, not just stated.
export default function WhyBento({ copy }: { copy: WhyCopy }) {
  const still = !!useReducedMotion();
  return (
    <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-5">
      <Card index={0} still={still} className="md:col-span-4">
        <Head n="01" item={copy.speed} />
        <SpeedRace copy={copy.speed} still={still} />
      </Card>
      <Card index={1} still={still} className="md:col-span-2">
        <Head n="02" item={copy.quality} />
        <Pipeline steps={copy.quality.steps} still={still} />
      </Card>
      <Card index={2} still={still} className="md:col-span-2">
        <Head n="03" item={copy.price} />
        <StrikeList cut={copy.price.cut} result={copy.price.result} still={still} />
      </Card>
      <Card index={3} still={still} className="md:col-span-4">
        <Head n="04" item={copy.consistency} />
        <Consistency copy={copy.consistency} still={still} />
      </Card>
    </div>
  );
}

const cardIn: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.8, ease, delay: i * 0.08 } }),
};

function Card({ children, className = "", index, still }: { children: ReactNode; className?: string; index: number; still: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  // A soft lime spotlight follows the pointer across the card.
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      custom={index}
      variants={cardIn}
      initial={still ? false : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className={`group relative flex flex-col justify-between gap-10 overflow-hidden rounded-[20px] border border-[#2a2a2a] bg-[linear-gradient(160deg,#141414,#0c0c0c)] p-7 transition-colors duration-300 hover:border-[#3d3d3d] md:p-9 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(380px circle at var(--mx,50%) var(--my,50%), rgba(175,252,48,.10), transparent 65%)" }}
      />
      <div className="relative flex flex-col gap-10">{children}</div>
    </motion.div>
  );
}

function Head({ n, item }: { n: string; item: Item }) {
  return (
    <div>
      <div className="font-[family-name:var(--font-mono)] text-[12px] font-medium tracking-[.1em] text-[var(--lime)]">[ {n} ]</div>
      <h4 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(22px,2.2vw,28px)] font-bold leading-[1.1] tracking-[-.02em] text-[var(--paper)]">
        {item.title}
      </h4>
      <p className="mt-3 max-w-[520px] text-[15px] leading-[1.6] text-[var(--gray-3)]">{item.text}</p>
    </div>
  );
}

const inView = { once: true, amount: 0.6 } as const;

function SpeedRace({ copy, still }: { copy: WhyCopy["speed"]; still: boolean }) {
  const bars = [
    { label: copy.tradLabel, value: copy.tradValue, width: "100%", color: "#3a3a3a", duration: 2.8, delay: 0.2 },
    { label: "LOGYC", value: copy.logycValue, width: "24%", color: LIME, duration: 0.9, delay: 0.2 },
  ];
  return (
    <div className="flex flex-col gap-6">
      {bars.map((b) => (
        <div key={b.label}>
          <div className="mb-2.5 flex items-baseline justify-between gap-4 font-[family-name:var(--font-mono)] text-[12px] font-medium tracking-[.06em]">
            <span className={b.color === LIME ? "text-[var(--lime)]" : "text-[var(--gray-3)]"}>{b.label}</span>
            <motion.span
              className="text-[var(--paper)]"
              initial={still ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={inView}
              transition={{ delay: b.delay + b.duration, duration: 0.4 }}
            >
              {b.value}
            </motion.span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#1b1b1b]">
            <motion.div
              className="h-full rounded-full"
              style={{ background: b.color, boxShadow: b.color === LIME ? "0 0 18px rgba(175,252,48,.55)" : undefined }}
              initial={still ? { width: b.width } : { width: 0 }}
              whileInView={{ width: b.width }}
              viewport={inView}
              transition={{ duration: b.duration, delay: b.delay, ease: b.color === LIME ? ease : "linear" }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pipeline({ steps, still }: { steps: [string, string, string]; still: boolean }) {
  return (
    <div className="relative">
      {/* track + travelling dot behind the three nodes */}
      <div className="absolute left-4 right-4 top-1/2 h-px -translate-y-1/2 bg-[#2a2a2a]" />
      {!still && (
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
          style={{ background: LIME, boxShadow: "0 0 12px rgba(175,252,48,.9)" }}
          animate={{ left: ["4%", "94%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.4 }}
        />
      )}
      <div className="relative flex items-center justify-between gap-2">
        {steps.map((s, i) => (
          <motion.div
            key={s}
            initial={still ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={inView}
            transition={{ delay: 0.15 + i * 0.25, duration: 0.5, ease }}
            className={`rounded-[10px] border px-2.5 py-2 text-center font-[family-name:var(--font-mono)] text-[10.5px] font-semibold uppercase leading-[1.25] tracking-[.06em] ${
              i === 2 ? "border-[var(--lime)] bg-[#141a0a] text-[var(--lime)]" : "border-[#2e2e2e] bg-[#111] text-[#cfcfcf]"
            }`}
          >
            {s}
            {i === 2 && <span className="ml-1">✓</span>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StrikeList({ cut, result, still }: { cut: string[]; result: string; still: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {cut.map((c, i) => (
        <div key={c} className="flex items-center gap-3 text-[15px]">
          <span className="font-[family-name:var(--font-mono)] text-[13px] text-[#5a5a5a]">–</span>
          <span className="relative text-[#8a8a8a]">
            {c}
            <motion.span
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full"
              style={{ background: LIME }}
              initial={still ? { width: "100%" } : { width: 0 }}
              whileInView={{ width: "100%" }}
              viewport={inView}
              transition={{ delay: 0.3 + i * 0.35, duration: 0.45, ease }}
            />
          </span>
        </div>
      ))}
      <motion.div
        className="mt-2 font-[family-name:var(--font-display)] text-[17px] font-bold text-[var(--lime)]"
        initial={still ? false : { opacity: 0, x: -10 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={inView}
        transition={{ delay: 0.3 + cut.length * 0.35 + 0.1, duration: 0.5, ease }}
      >
        → {result}
      </motion.div>
    </div>
  );
}

function Consistency({ copy, still }: { copy: WhyCopy["consistency"]; still: boolean }) {
  const line = (w: string, delay: number, color = "#2c2c2c") => (
    <motion.div
      className="h-2 rounded-full"
      style={{ background: color }}
      initial={still ? { width: w } : { width: 0 }}
      whileInView={{ width: w }}
      viewport={inView}
      transition={{ delay, duration: 0.6, ease }}
    />
  );
  return (
    <div>
      <div className="grid grid-cols-[minmax(0,96px)_auto_minmax(0,1fr)] items-center gap-2 md:grid-cols-[minmax(0,180px)_auto_minmax(0,1fr)] md:gap-5">
        {/* social post */}
        <div className="rounded-[14px] border border-[#2a2a2a] bg-[#111] p-3">
          <div className="mb-2 font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[.12em] text-[var(--gray-3)]">{copy.post}</div>
          <motion.div
            className="aspect-square rounded-[10px]"
            style={{ background: "radial-gradient(circle at 30% 30%, rgba(175,252,48,.55), rgba(175,252,48,.08) 60%, #0d0d0d)" }}
            initial={still ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={inView}
            transition={{ delay: 0.2, duration: 0.7 }}
          />
          <div className="mt-3 flex flex-col gap-1.5">{line("80%", 0.5, "#3a3a3a")}{line("55%", 0.65)}</div>
        </div>
        {/* animated connector */}
        <svg viewBox="0 0 48 12" aria-hidden="true" className="h-3 w-6 overflow-visible md:w-12">
          <motion.path
            d="M2 6 H46"
            stroke={LIME}
            strokeWidth="1.6"
            strokeDasharray="4 5"
            fill="none"
            animate={still ? undefined : { strokeDashoffset: [0, -18] }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </svg>
        {/* website */}
        <div className="overflow-hidden rounded-[14px] border border-[#2a2a2a] bg-[#111]">
          <div className="flex items-center gap-1.5 border-b border-[#2a2a2a] px-3 py-2">
            <i className="h-1.5 w-1.5 rounded-full bg-[#333]" /><i className="h-1.5 w-1.5 rounded-full bg-[#333]" /><i className="h-1.5 w-1.5 rounded-full bg-[#333]" />
            <span className="ml-2 truncate font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[.12em] text-[var(--gray-3)]">{copy.web}</span>
          </div>
          <div className="flex flex-col gap-2 p-4">
            {line("70%", 0.5, "#3a3a3a")}
            {line("45%", 0.65)}
            <motion.div
              className="mt-2 h-6 w-24 rounded-md"
              style={{ background: LIME }}
              initial={still ? false : { opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={inView}
              transition={{ delay: 0.9, duration: 0.5, ease }}
            />
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3 font-[family-name:var(--font-mono)] text-[11.5px] font-medium tracking-[.06em] text-[var(--gray-3)]">
        {["#0A0A0A", "#FAFAFA", LIME].map((c, i) => (
          <motion.span
            key={c}
            className="h-4 w-4 rounded-full border border-[#3a3a3a]"
            style={{ background: c }}
            initial={still ? false : { scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={inView}
            transition={{ delay: 1 + i * 0.12, type: "spring", stiffness: 300, damping: 18 }}
          />
        ))}
        <span>{copy.legend}</span>
      </div>
    </div>
  );
}
