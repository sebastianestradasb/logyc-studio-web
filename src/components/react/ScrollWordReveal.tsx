import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";

type Part = { text: string; lime?: boolean };

// Words light up one by one as the text scrolls through the viewport.
export default function ScrollWordReveal({ parts }: { parts: Part[] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.45"] });
  const words = parts.flatMap((p) => p.text.split(/\s+/).filter(Boolean).map((w) => ({ w, lime: p.lime })));

  return (
    <span ref={ref}>
      {words.map((x, i) => (
        <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} lime={x.lime} still={!!reduce}>
          {x.w}
        </Word>
      ))}
    </span>
  );
}

function Word({
  children,
  progress,
  range,
  lime,
  still,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
  lime?: boolean;
  still: boolean;
}) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <>
      <motion.span className={lime ? "lime" : undefined} style={{ opacity: still ? 1 : opacity }}>
        {children}
      </motion.span>{" "}
    </>
  );
}
