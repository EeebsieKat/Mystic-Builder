"use client";

import { useCallback, useMemo } from "react";
import Particles, { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine, ISourceOptions } from "@tsparticles/engine";

export default function BottomParticles() {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      // Keep false so our wrapper controls the exact z-index layer
      fullScreen: { enable: false },
      fpsLimit: 60,
      particles: {
        number: {
          value: 40,
          density: { enable: true },
        },
        shape: {
          type: "image",
          options: {
            image: {
              src: "/assets/awakening-ui/particles/Sparkle.png",
              width: 32,
              height: 32,
              replaceColor: false,
            },
          },
        },
        opacity: {
          value: { min: 0.4, max: 1 },
          animation: {
            enable: true,
            speed: 0.8,
            minimumValue: 0,
            sync: false,
          },
        },
        size: {
          value: { min: 8, max: 20 },
        },
        move: {
          enable: true,
          direction: "top",
          speed: 1.5,
          // Particles disappear once they float off the top
          outModes: {
            default: "destroy",
            bottom: "none",
          },
        },
      },
      // Spawn particles continuously along the very bottom of the screen
      emitters: {
        direction: "top",
        rate: {
          delay: 0.25,
          quantity: 2,
        },
        size: {
          width: 100,
          height: 0,
        },
        position: {
          x: 50,
          y: 100,
        },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden mix-blend-screen">
      <ParticlesProvider init={particlesInit}>
        <Particles
          id="bottom-textured-particles"
          className="h-full w-full"
          options={options}
        />
      </ParticlesProvider>
    </div>
  );
}
