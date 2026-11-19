import type { Transition } from "motion/react";

/**
 * Motion presets, from v2. Nothing sets a duration or spring inline; import from here.
 */

export const spring = {
  /** Indicators, chips, press feedback. */
  snappy: { type: "spring", stiffness: 500, damping: 40 },
  /** Panels, morphs, previews. */
  soft: { type: "spring", bounce: 0.15, visualDuration: 0.4 },
} as const satisfies Record<string, Transition>;

/** Seconds. */
export const duration = {
  fast: 0.15,
  base: 0.2,
  slow: 0.3,
} as const;

export const ease = {
  out: [0.22, 1, 0.36, 1],
} as const satisfies Record<string, [number, number, number, number]>;

export const fade = {
  fast: { duration: duration.fast, ease: ease.out },
  base: { duration: duration.base, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
} as const satisfies Record<string, Transition>;

/** Tactile press: scale down on tap, spring back on release. */
export const press = {
  whileTap: { scale: 0.96 },
  transition: spring.snappy,
} as const;

/** Subtle lift for hoverable rows, tiles, and raised buttons. */
export const hoverLift = {
  whileHover: { y: -1 },
  transition: spring.snappy,
} as const;
