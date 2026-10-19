"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

type Position = { top: number; left: number; width: number; maxHeight: number; height: number };

/** Mantiene el resumen en su posición inicial, sin el desplazamiento de sticky. */
export function FixedPaymentSummary({ children }: { children: ReactNode }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const [position, setPosition] = useState<Position | null>(null);

  useLayoutEffect(() => {
    const slot = slotRef.current;
    const card = cardRef.current;
    const main = slot?.closest("main");
    if (!slot || !card || !main) return;
    const desktop = window.matchMedia("(min-width: 1280px)");
    function measure() {
      if (!slot || !card || !main) return;
      if (!desktop.matches) { setPosition(null); return; }
      const bounds = slot.getBoundingClientRect();
      const viewport = main.getBoundingClientRect();
      const top = Math.min(bounds.top + main.scrollTop, viewport.bottom - 120);
      const maxHeight = Math.max(100, viewport.bottom - top - 16);
      const next = { top, left: bounds.left, width: bounds.width, maxHeight, height: Math.min(card.scrollHeight + 2, maxHeight) };
      setPosition((previous) => previous && Object.keys(next).every((key) => previous[key as keyof Position] === next[key as keyof Position]) ? previous : next);
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(slot); observer.observe(card); observer.observe(main);
    desktop.addEventListener("change", measure);
    window.addEventListener("resize", measure);
    return () => { observer.disconnect(); desktop.removeEventListener("change", measure); window.removeEventListener("resize", measure); };
  }, []);

  return <div ref={slotRef} className="min-w-0" style={position ? { height: position.height } : undefined}>
    <aside ref={cardRef} aria-label="Resumen del cobro" className="admin-surface min-w-0" style={position ? { position: "fixed", top: position.top, left: position.left, width: position.width, maxHeight: position.maxHeight, overflowY: "auto", overscrollBehavior: "contain", zIndex: 20 } : undefined}>
      {children}
    </aside>
  </div>;
}
