"use client";

import { useEffect, useRef, type PointerEvent } from "react";

type Props = {
  running: boolean;
  onFrame: (ctx: CanvasRenderingContext2D, w: number, h: number, dt: number) => void;
  onPointer?: (x: number, y: number, type: "down" | "move" | "up") => void;
};

export default function GameCanvas({ running, onFrame, onPointer }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useRef(onFrame);
  frame.current = onFrame;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const fit = () => {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    fit();
    window.addEventListener("resize", fit);

    let last = performance.now();
    let id = 0;
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (running) {
        frame.current(ctx, canvas.clientWidth, canvas.clientHeight, dt);
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", fit);
    };
  }, [running]);

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  return (
    <canvas
      ref={ref}
      className="board"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        onPointer?.(pos(e).x, pos(e).y, "down");
      }}
      onPointerMove={(e) => onPointer?.(pos(e).x, pos(e).y, "move")}
      onPointerUp={(e) => onPointer?.(pos(e).x, pos(e).y, "up")}
    />
  );
}
