import { css, svg, type SVGTemplateResult } from "lit";
import { workCss } from "./pet-work";
import type { Mood } from "./types";

const INK = "#101010";

export { workCss };

/**
 * The parts every pet shares: the extras that go with a mood (sleeping z's, a tear, sparkles)
 * and the CSS for blinking, looking around, breathing, the sleep bubble and so on.
 * Each animal only brings its own body, face and hands. How hard a body squashes and
 * stretches is set per animal with the CSS variable --k (1 = the full jelly of the slime).
 */

/** Things next to the pet that go with the mood: sleeping z's, a sleep bubble, a tear, sparkles. */
export interface ExtrasAt {
  /** Move the sleeping z's (the slime's are at the right of its head). */
  z?: [number, number];
  /** Move the tear (it starts under the slime's right eye). */
  tear?: [number, number];
}

export function extras(mood: Mood, at: ExtrasAt = {}): SVGTemplateResult {
  const z = at.z ?? [0, 0];
  const tear = at.tear ?? [0, 0];
  switch (mood) {
    case "sleepy":
      return svg`<g class="zzz" transform="translate(${z[0]} ${z[1]})"><text class="z z1" x="146" y="84">z</text><text class="z z2" x="158" y="64">z</text></g>`;
    case "hibernating":
      return svg`<g class="zzz slow" transform="translate(${z[0]} ${z[1]})"><text class="z z1" x="146" y="84">z</text><text class="z z2" x="158" y="64">z</text><text class="z z3" x="170" y="42">Z</text></g>`;
    case "sad":
      return svg`<g transform="translate(${tear[0]} ${tear[1]})"><path class="tear" d="M130 150 q-6 9 0 14 q6 -5 0 -14 z" fill="#5CC8FF" stroke=${INK} stroke-width="2" stroke-linejoin="round"/></g>`;
    case "happy":
      return svg`<path class="spark s1" d="M26 84 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z" fill="#FFE45C"/>
        <path class="spark s2" d="M176 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <path class="spark s3" d="M168 118 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2 z" fill="#fff"/>`;
    default:
      return svg``;
  }
}

/** Mix two #rrggbb colours: amount 0 gives `a`, 1 gives `b`. */
function mix(a: string, b: string, amount: number): string {
  const n = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
  const part = (i: number) => Math.round(n(a, i) + (n(b, i) - n(a, i)) * amount).toString(16).padStart(2, "0");
  return `#${part(0)}${part(1)}${part(2)}`;
}

/**
 * The fur colour a pet wears, as the CSS variables its drawing reads (--fur and its shades). A pet without
 * them keeps its own colours, because every drawing has its own colour as the fallback: var(--fur, #8A2A0B).
 * `hex` is the main colour (#rrggbb); the shades are mixed from it.
 */
export function furStyle(hex: string): string {
  const vars: [string, string][] = [
    ["--fur", hex],
    ["--fur-dark", mix(hex, "#000000", 0.22)],
    ["--fur-deep", mix(hex, "#000000", 0.5)],
    ["--fur-lt", mix(hex, "#ffffff", 0.3)],
    ["--fur-hi", mix(hex, "#ffffff", 0.7)],
    ["--fur-rim", mix(hex, "#ffffff", 0.35)],
    ["--fur-vest", mix(hex, "#ffffff", 0.1)],
  ];
  return vars.map(([k, v]) => `${k}:${v}`).join(";");
}

/** Where a scarf sits on a pet: the middle of the neck (x, y) and how wide it is, in the pet's 200 x 200 drawing. */
export interface NeckAt {
  x: number;
  y: number;
  w: number;
}

/** A scarf around the neck with one end hanging down. Drawn before the head, so the chin lies over it. `color` empty = no scarf. */
export function scarfArt(color: string | undefined, at: NeckAt): SVGTemplateResult {
  if (!color) return svg``;
  const l = at.x - at.w / 2;
  const r = at.x + at.w / 2;
  const y = at.y;
  const dark = mix(color, "#000000", 0.25);
  return svg`<g class="scarf">
    <path d="M${at.x + at.w * 0.12} ${y + 8} L${at.x + at.w * 0.12 + 3} ${y + 30} L${at.x + at.w * 0.12 + 16} ${y + 27} L${at.x + at.w * 0.12 + 12} ${y + 5} Z" fill=${dark} stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
    <path d="M${l} ${y - 6} Q${at.x} ${y + 10} ${r} ${y - 6} L${r - 2} ${y + 6} Q${at.x} ${y + 22} ${l + 2} ${y + 6} Z" fill=${color} stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
    <path d="M${l + at.w * 0.28} ${y + 2} L${l + at.w * 0.3} ${y + 14} M${l + at.w * 0.5} ${y + 5} L${l + at.w * 0.5} ${y + 17} M${l + at.w * 0.72} ${y + 2} L${l + at.w * 0.7} ${y + 14}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity="0.55"/>
  </g>`;
}

export const kitCss = css`
  .pet-art {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
  .jelly,
  .shadow,
  .puddle,
  .eye,
  .eyes,
  .z,
  .tear,
  .spark,
  .bubble,
  .snore {
    transform-box: fill-box;
  }
  .jelly {
    transform-origin: 50% 100%;
  }
  .shadow,
  .puddle {
    transform-origin: 50% 50%;
  }
  .eye {
    transform-origin: 50% 50%;
    animation: blink 4.6s infinite;
  }
  @keyframes blink {
    0%,
    93%,
    100% {
      transform: scaleY(1);
    }
    96% {
      transform: scaleY(0.1);
    }
  }
  /* content: the eyes drift to one side and the other, as if it is looking around. */
  .look {
    animation: look 9s ease-in-out infinite;
  }
  @keyframes look {
    0%,
    30%,
    100% {
      transform: translateX(0);
    }
    40%,
    55% {
      transform: translateX(-4px);
    }
    68%,
    82% {
      transform: translateX(4px);
    }
  }
  /* The bubbles inside rise a little and settle again. */
  .bubble {
    animation: bubble 6s ease-in-out infinite;
  }
  .bubble.b2 {
    animation-delay: 2s;
  }
  .bubble.b3 {
    animation-delay: 4s;
  }
  @keyframes bubble {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-9px);
    }
  }

  /* happy: it is the mood for most of a good day, so it stays calm: a slow breath, and one small
     hop every 8 seconds or so. The big hops are for the moments that earn them (level up, step done). */
  .happy .jelly {
    animation: happy-idle 8s ease-in-out infinite;
  }
  .happy .shadow {
    animation: happy-shadow 8s ease-in-out infinite;
  }
  .happy .puddle {
    animation: happy-ripple 8s ease-in-out infinite;
  }
  @keyframes happy-idle {
    0%,
    78%,
    100% {
      transform: translateY(0) scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1)));
    }
    22% {
      transform: translateY(0) scale(calc(1 + -0.015 * var(--k, 1)), calc(1 + 0.04 * var(--k, 1)));
    }
    44% {
      transform: translateY(0) scale(calc(1 + 0.01 * var(--k, 1)), calc(1 + -0.01 * var(--k, 1)));
    }
    62% {
      transform: translateY(0) scale(calc(1 + -0.015 * var(--k, 1)), calc(1 + 0.04 * var(--k, 1)));
    }
    84% {
      transform: translateY(0) scale(calc(1 + 0.08 * var(--k, 1)), calc(1 + -0.08 * var(--k, 1)));
    }
    90% {
      transform: translateY(-14px) scale(calc(1 + -0.05 * var(--k, 1)), calc(1 + 0.08 * var(--k, 1)));
    }
    95% {
      transform: translateY(0) scale(calc(1 + 0.07 * var(--k, 1)), calc(1 + -0.07 * var(--k, 1)));
    }
  }
  @keyframes happy-shadow {
    0%,
    84%,
    100% {
      transform: scale(1);
      opacity: 0.22;
    }
    90% {
      transform: scale(0.85);
      opacity: 0.14;
    }
  }
  @keyframes happy-ripple {
    0%,
    88%,
    100% {
      transform: scale(1);
      opacity: 0.35;
    }
    95% {
      transform: scale(1.12);
      opacity: 0.45;
    }
  }
  .spark {
    transform-origin: 50% 50%;
    animation: twinkle 1.6s infinite;
  }
  .spark.s2 {
    animation-delay: 0.5s;
  }
  .spark.s3 {
    animation-delay: 1s;
  }
  @keyframes twinkle {
    0%,
    100% {
      transform: scale(0.4) rotate(0deg);
      opacity: 0;
    }
    50% {
      transform: scale(1) rotate(20deg);
      opacity: 1;
    }
  }

  /* content: it breathes, with a tiny sway. */
  .content .jelly {
    animation: breathe 3.6s ease-in-out infinite;
  }
  @keyframes breathe {
    0%,
    100% {
      transform: scale(calc(1 + 0 * var(--k, 1)), calc(1 + 0 * var(--k, 1))) skewX(0deg);
    }
    35% {
      transform: scale(calc(1 + -0.015 * var(--k, 1)), calc(1 + 0.04 * var(--k, 1))) skewX(0.8deg);
    }
    70% {
      transform: scale(calc(1 + 0.01 * var(--k, 1)), calc(1 + -0.01 * var(--k, 1))) skewX(-0.8deg);
    }
  }

  /* sleepy: slower and lower, a little tilted, with z's. */
  .sleepy .jelly {
    transform: rotate(-3deg);
    animation: breathe-slow 5.2s ease-in-out infinite;
  }
  @keyframes breathe-slow {
    0%,
    100% {
      transform: rotate(-3deg) scale(calc(1 + 0.04 * var(--k, 1)), calc(1 + -0.05 * var(--k, 1)));
    }
    50% {
      transform: rotate(-3deg) scale(calc(1 + -0.01 * var(--k, 1)), calc(1 + 0.02 * var(--k, 1)));
    }
  }

  /* sad: it sags, and a tear rolls. */
  .sad .jelly {
    transform: scale(calc(1 + 0.06 * var(--k, 1)), calc(1 + -0.08 * var(--k, 1)));
    animation: sag 5.5s ease-in-out infinite;
  }
  @keyframes sag {
    0%,
    100% {
      transform: scale(calc(1 + 0.06 * var(--k, 1)), calc(1 + -0.08 * var(--k, 1)));
    }
    50% {
      transform: scale(calc(1 + 0.04 * var(--k, 1)), calc(1 + -0.06 * var(--k, 1)));
    }
  }
  .tear {
    transform-origin: 50% 0%;
    animation: tear 2.8s infinite;
  }
  @keyframes tear {
    0% {
      opacity: 0;
      transform: translateY(0);
    }
    20% {
      opacity: 1;
    }
    80% {
      opacity: 1;
      transform: translateY(20px);
    }
    100% {
      opacity: 0;
      transform: translateY(24px);
    }
  }

  /* hibernating: flat and dim, a very slow breath, a sleep bubble, z's. Never gone, just asleep. */
  .hibernating .jelly {
    transform: scale(calc(1 + 0.12 * var(--k, 1)), calc(1 + -0.2 * var(--k, 1)));
    animation: deep 7s ease-in-out infinite;
  }
  .hibernating .body {
    filter: saturate(0.7) brightness(0.9);
  }
  @keyframes deep {
    0%,
    100% {
      transform: scale(calc(1 + 0.12 * var(--k, 1)), calc(1 + -0.2 * var(--k, 1)));
    }
    50% {
      transform: scale(calc(1 + 0.09 * var(--k, 1)), calc(1 + -0.15 * var(--k, 1)));
    }
  }
  .snore {
    transform-origin: 0% 100%;
    animation: snore 7s ease-in-out infinite;
  }
  @keyframes snore {
    0%,
    100% {
      transform: scale(0.35);
      opacity: 0.4;
    }
    45% {
      transform: scale(1.25);
      opacity: 1;
    }
    55% {
      transform: scale(1.3);
      opacity: 1;
    }
    60% {
      transform: scale(0.2);
      opacity: 0;
    }
  }

  .z {
    font: 700 22px system-ui, sans-serif;
    fill: var(--primary-text-color, #fff);
    transform-origin: 50% 50%;
    animation: zfloat 3s infinite;
    opacity: 0;
  }
  .z.z2 {
    animation-delay: 1s;
  }
  .z.z3 {
    animation-delay: 2s;
  }
  .slow .z {
    animation-duration: 5s;
  }
  @keyframes zfloat {
    0% {
      opacity: 0;
      transform: translate(0, 8px) scale(0.7);
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(8px, -16px) scale(1.1);
    }
  }
`;
