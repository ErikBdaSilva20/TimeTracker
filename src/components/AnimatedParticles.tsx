import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme";

/**
 * Fundo animado leve com partículas conectadas.
 * Renderiza apenas no tema claro (o dark já é rico o suficiente) e pausa
 * automaticamente quando a aba fica oculta.
 */
export function AnimatedParticles({
  density = 40,
  className = "",
  onlyOn = "light",
}: {
  density?: number;
  className?: string;
  onlyOn?: "light" | "dark" | "both";
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();
  const active = onlyOn === "both" || onlyOn === theme;

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let dpr = Math.min(2, window.devicePixelRatio || 1);

    interface P {
      x: number;
      y: number;
      vx: number;
      vy: number;
      r: number;
    }
    let particles: P[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round((w * h) / 22000) + density / 2;
      particles = Array.from({ length: Math.max(12, Math.min(120, target)) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1 + Math.random() * 1.8,
      }));
    };

    const color = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--particles-color")
        .trim() || "rgba(6,182,212,0.35)";

    const draw = () => {
      if (!running) return;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);
      const stroke = color();
      ctx.fillStyle = stroke;
      ctx.strokeStyle = stroke;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      // links
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 110 * 110) {
            ctx.globalAlpha = 1 - d2 / (110 * 110);
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      running = !document.hidden;
      if (running) draw();
      else cancelAnimationFrame(raf);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement!);
    resize();
    draw();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [active, density]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
