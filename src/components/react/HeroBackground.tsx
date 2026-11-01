import { useEffect, useState } from "react";
import { ShaderBackground } from "../ui/hero-background";

// Animated WebGL backdrop for the hero. Dimmed and faded at the bottom so the headline stays
// readable; skipped entirely for visitors who ask for reduced motion (the CSS glow remains).
export default function HeroBackground() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (!enabled) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] opacity-0 animate-[heroBgIn_1.6s_ease-out_.2s_forwards]"
      style={{
        maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
      }}
    >
      <ShaderBackground className="h-full w-full" />
      {/* Darken behind the headline (left) and under the navigation (top) to keep both readable. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_30%_50%,rgba(10,10,10,.85),rgba(10,10,10,.45)_70%)]" />
      <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-[#0a0a0a] to-transparent" />
    </div>
  );
}
