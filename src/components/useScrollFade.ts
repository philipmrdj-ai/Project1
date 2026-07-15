import { useEffect, useRef } from "react";

/**
 * Fades an element out as its scroll container (.content) scrolls down,
 * and back in when scrolling up — used by workspace headers so the
 * description block stops competing with the notes below it.
 */
export function useScrollFade<T extends HTMLElement>(distance = 260) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const scroller = el.closest(".content");
    if (!scroller) return;
    const onScroll = () => {
      const o = Math.max(0, 1 - scroller.scrollTop / distance);
      el.style.opacity = o.toFixed(3);
      el.style.pointerEvents = o < 0.15 ? "none" : "";
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, [distance]);

  return ref;
}
