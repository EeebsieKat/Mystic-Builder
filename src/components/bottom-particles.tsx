"use client";

import { useEffect, useRef } from "react";

interface Sparkle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  fadeRate: number;
}

export default function BottomParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let sparkles: Sparkle[] = [];

    // Match canvas internal resolution to the full screen
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Load Sparkle.png and strip its black background into true transparency
    const img = new Image();
    img.src = "/assets/awakening-ui/particles/Sparkle.png";

    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      const offCtx = offscreen.getContext("2d");
      if (!offCtx) return;

      offCtx.drawImage(img, 0, 0);
      const imageData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = Math.max(r, g, b);
        data[i + 3] = brightness;

        if (brightness > 0) {
          const scale = 255 / brightness;
          data[i] = Math.min(255, r * scale);
          data[i + 1] = Math.min(255, g * scale);
          data[i + 2] = Math.min(255, b * scale);
        }
      }
      offCtx.putImageData(imageData, 0, 0);

      // Spawn a sparkle anywhere along the full bottom edge
      const spawnSparkle = () => {
        sparkles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 10,
          size: 8 + Math.random() * 12,
          // Slower upward drift (was 0.8 + Math.random() * 1.2)
          speedY: 0.3 + Math.random() * 0.45,
          // Gentler horizontal sway
          speedX: (Math.random() - 0.5) * 0.2,
          opacity: 0.5 + Math.random() * 0.4,
          fadeRate: 0.002 + Math.random() * 0.002,
        });
      };

      const render = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fewer sparkles spawning per second (was 0.35)
        if (Math.random() < 0.12) {
          spawnSparkle();
        }

        const maxHeight = canvas.height * (1 / 3); // Stops 2/3 up from the bottom

        for (let i = sparkles.length - 1; i >= 0; i--) {
          const s = sparkles[i];
          s.y -= s.speedY;
          s.x += s.speedX;

          // Calculate progress from bottom (0) to 2/3 up the screen (1)
          const progress = (canvas.height - s.y) / (canvas.height * (2 / 3));
          const heightAlpha = Math.max(0, 1 - progress);

          ctx.globalAlpha = s.opacity * heightAlpha;
          ctx.drawImage(
            offscreen,
            s.x - s.size / 2,
            s.y - s.size / 2,
            s.size,
            s.size
          );

          // Remove sparkle once it reaches 2/3 up the screen
          if (s.y <= maxHeight || heightAlpha <= 0) {
            sparkles.splice(i, 1);
          }
        }

        ctx.globalAlpha = 1;
        animationFrameId = requestAnimationFrame(render);
      };

      render();
    };

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen"
    />
  );
}
