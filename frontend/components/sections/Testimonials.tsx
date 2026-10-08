"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { fetcher } from "@/lib/api";
import type { Testimonial } from "@/lib/types";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i <= n
              ? "fill-[var(--color-accent)] text-[var(--color-accent)]"
              : "text-[var(--color-border)]"
          }`}
        />
      ))}
    </div>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <div
      className="
        mrp-tcard
        group/card
        w-[300px]
        sm:w-[360px]
        shrink-0
        rounded-2xl
        bg-[var(--color-surface)]
        border
        border-[var(--color-border)]
        p-6
        mx-3
        transition-all
        duration-300
        hover:border-[var(--color-accent)]/50
        hover:-translate-y-1
        hover:shadow-[0_10px_40px_rgba(45,212,191,0.10)]
      "
    >
      <div className="flex items-center justify-between mb-4">
        <Quote className="w-7 h-7 text-[var(--color-accent)]/40 group-hover/card:text-[var(--color-accent)] transition-colors" />

        <Stars n={t.rating || 5} />
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] font-inter line-clamp-5 min-h-[100px]">
        “{t.quote}”
      </p>

      <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--color-border)]">
        {t.avatar_url ? (
          <img
            src={t.avatar_url}
            alt={t.name}
            className="w-11 h-11 rounded-full object-cover border border-[var(--color-border)]"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[var(--color-accent)]/15 border border-[var(--color-accent)]/30 flex items-center justify-center text-[var(--color-accent)] font-bold text-sm font-space-grotesk">
            {initials(t.name)}
          </div>
        )}

        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate font-space-grotesk">
            {t.name}
          </div>

          <div className="text-[11px] font-mono text-[var(--color-text-secondary)] truncate">
            {[t.role, t.company].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>
    </div>
  );
}

type MarqueeDirection = "to-left" | "to-right";

function MarqueeRow({
  items,
  direction,
  duration,
}: {
  items: Testimonial[];
  direction: MarqueeDirection;
  duration: number;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const offsetRef = useRef(0);
  const distanceRef = useRef(0);

  const pausedRef = useRef(false);
  const pointerIdRef = useRef<number | null>(null);

  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const initializedRef = useRef(false);

  const applyTransform = () => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
  };

  const updateDistance = () => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    /*
     * The track contains the same card list twice.
     * Therefore half of the total scroll width is the
     * exact distance required for one seamless loop.
     */
    const newDistance = track.scrollWidth / 2;

    if (!newDistance) {
      return;
    }

    const previousDistance = distanceRef.current;

    /*
     * First measurement.
     */
    if (!initializedRef.current || !previousDistance) {
      distanceRef.current = newDistance;

      offsetRef.current =
        direction === "to-right" ? -newDistance : 0;

      initializedRef.current = true;

      applyTransform();

      return;
    }

    /*
     * Nothing changed.
     */
    if (Math.abs(previousDistance - newDistance) < 0.5) {
      return;
    }

    /*
     * Preserve the current animation progress when the
     * viewport/card dimensions change.
     */
    if (direction === "to-left") {
      const rawProgress =
        ((-offsetRef.current % previousDistance) +
          previousDistance) %
        previousDistance;

      const progress = rawProgress / previousDistance;

      offsetRef.current = -progress * newDistance;
    } else {
      const rawProgress =
        ((offsetRef.current + previousDistance) %
          previousDistance +
          previousDistance) %
        previousDistance;

      const progress = rawProgress / previousDistance;

      offsetRef.current =
        progress * newDistance - newDistance;
    }

    distanceRef.current = newDistance;

    applyTransform();
  };

  /*
   * Initial measurement happens before browser paint.
   * This prevents the right-moving row from flashing
   * at x = 0 before being positioned at -distance.
   */
  useLayoutEffect(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    /*
     * Disable any old CSS marquee animation.
     * Movement is now controlled exclusively by JS.
     */
    track.style.animation = "none";
    track.style.willChange = "transform";

    updateDistance();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateDistance();
      });

      resizeObserver.observe(track);
    }

    const handleResize = () => {
      updateDistance();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, [direction]);

  /*
   * Main animation loop.
   *
   * duration is the approximate time in seconds required
   * to travel one complete card-set distance.
   */
  useEffect(() => {
    const tick = (timestamp: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = timestamp;
      }

      /*
       * Cap the frame delta so returning to the tab does
       * not cause a giant visual jump.
       */
      const elapsed = Math.min(
        timestamp - lastTimeRef.current,
        50
      );

      lastTimeRef.current = timestamp;

      const distance = distanceRef.current;

      if (!pausedRef.current && distance > 0) {
        const pixelsPerSecond = distance / duration;

        const movement =
          (pixelsPerSecond * elapsed) / 1000;

        if (direction === "to-left") {
          offsetRef.current -= movement;

          if (offsetRef.current <= -distance) {
            offsetRef.current += distance;
          }
        } else {
          offsetRef.current += movement;

          if (offsetRef.current >= 0) {
            offsetRef.current -= distance;
          }
        }

        applyTransform();
      }

      frameRef.current =
        requestAnimationFrame(tick);
    };

    frameRef.current =
      requestAnimationFrame(tick);

    /*
     * Reset timing when the tab becomes visible again.
     */
    const handleVisibilityChange = () => {
      lastTimeRef.current = performance.now();
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [direction, duration]);

  /*
   * Pointer press:
   * pause immediately and capture the pointer so the
   * corresponding release is still detected even if the
   * pointer moves outside the card/track.
   */
  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!event.isPrimary) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    pausedRef.current = true;

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId
      );
    } catch {
      /*
       * Pointer capture is not supported everywhere.
       * The normal pointer events still work as fallback.
       */
    }
  };

  /*
   * Pointer release:
   * immediately resume movement.
   */
  const handlePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !== null &&
      event.pointerId !== pointerIdRef.current
    ) {
      return;
    }

    pausedRef.current = false;
    pointerIdRef.current = null;

    try {
      if (
        event.currentTarget.hasPointerCapture(
          event.pointerId
        )
      ) {
        event.currentTarget.releasePointerCapture(
          event.pointerId
        );
      }
    } catch {
      /*
       * Safe fallback.
       */
    }
  };

  const handlePointerCancel = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (
      pointerIdRef.current !== null &&
      event.pointerId !== pointerIdRef.current
    ) {
      return;
    }

    pausedRef.current = false;
    pointerIdRef.current = null;
  };

  const doubled = [...items, ...items];

  return (
    <div
      className="mrp-marquee relative overflow-hidden py-2"
      style={{
        touchAction: "pan-y",
      }}
    >
      <div
        ref={trackRef}
        className="mrp-marquee-track flex w-max"
        style={{
          animation: "none",
          willChange: "transform",
          touchAction: "pan-y",
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
      >
        {doubled.map((t, i) => (
          <Card
            key={`${t.id}-${i}`}
            t={t}
          />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { data: items = [] } =
    useQuery<Testimonial[]>({
      queryKey: ["testimonials"],
      queryFn: () =>
        fetcher<Testimonial[]>(
          "/api/testimonials/"
        ),
    });

  if (!items.length) {
    return null;
  }

  /*
   * Always keep enough cards in the row so the
   * duplicated marquee has enough visual content.
   */
  const minCards = 6;

  const filled: Testimonial[] =
    items.length >= minCards
      ? items
      : Array.from({
          length: Math.ceil(
            minCards / items.length
          ),
        }).flatMap(() => items);

  const rowA = filled;
  const rowB = [...filled].reverse();

  return (
    <section
      id="testimonials"
      data-theme="dark"
      className="
        relative
        w-full
        py-24
        bg-[var(--color-background)]
        text-[var(--color-text-primary)]
        overflow-hidden
        select-none
      "
    >
      <div
        className="
          max-w-7xl
          mx-auto
          px-6
          sm:px-10
          lg:px-16
          mb-14
          text-center
        "
      >
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.9,
          }}
          whileInView={{
            opacity: 1,
            scale: 1,
          }}
          viewport={{
            once: true,
          }}
          className="
            inline-flex
            items-center
            gap-2
            px-3.5
            py-1.5
            rounded-full
            bg-[var(--color-accent)]/10
            border
            border-[var(--color-accent)]/20
            text-[var(--color-accent)]
            text-xs
            font-mono
            mb-4
          "
        >
          <Star className="w-3.5 h-3.5 fill-[var(--color-accent)]" />

          CLIENT_STORIES.LOG
        </motion.div>

        <motion.h2
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
          }}
          className="
            text-3xl
            sm:text-4xl
            md:text-5xl
            font-bold
            tracking-tight
            font-space-grotesk
          "
        >
          Trusted by{" "}
          <span className="text-[var(--color-accent)] text-glow">
            Founders & Teams
          </span>
        </motion.h2>

        <motion.p
          initial={{
            opacity: 0,
            y: 20,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
            delay: 0.1,
          }}
          className="
            text-[var(--color-text-secondary)]
            mt-3
            max-w-xl
            mx-auto
            text-sm
            md:text-base
            font-inter
          "
        >
          Real words from the people I&apos;ve shipped
          production software for.
        </motion.p>
      </div>

      <div className="relative">
        {/* Left edge fade */}
        <div
          className="
            pointer-events-none
            absolute
            left-0
            top-0
            bottom-0
            w-16
            sm:w-32
            z-10
            bg-gradient-to-r
            from-[var(--color-background)]
            to-transparent
          "
        />

        {/* Right edge fade */}
        <div
          className="
            pointer-events-none
            absolute
            right-0
            top-0
            bottom-0
            w-16
            sm:w-32
            z-10
            bg-gradient-to-l
            from-[var(--color-background)]
            to-transparent
          "
        />

        <MarqueeRow
          items={rowA}
          direction="to-left"
          duration={46}
        />

        <MarqueeRow
          items={rowB}
          direction="to-right"
          duration={62}
        />
      </div>
    </section>
  );
}