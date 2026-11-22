import { css, svg, type SVGTemplateResult } from "lit";
import type { Mood } from "./types";

/**
 * The slime: a round, glossy neon green jelly with a thick outline, drawn in code and animated
 * with CSS. One drawing, five moods: the face, the extras and the way it moves change.
 *
 * Only `transform` and `opacity` are animated, so it is cheap for a phone or a wall tablet.
 * The jelly squashes and stretches from its bottom, so it always stays on the floor.
 */

const INK = "#101010";

// A round jelly: wide, with a soft little tip on top and a short flat bottom to sit on.
const BODY =
  "M100 64 C106 64 108 70 114 73 C146 80 166 108 166 138 C166 164 146 182 118 182 " +
  "L82 182 C54 182 34 164 34 138 C34 108 54 80 86 73 C92 70 94 64 100 64 Z";

function eyes(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "happy":
      // Two happy arcs.
      return svg`<path d="M70 137 Q80 119 90 137" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>
        <path d="M110 137 Q120 119 130 137" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>`;
    case "sleepy":
      // Heavy lids: a flat line with a small droop.
      return svg`<path d="M71 134 Q80 138 89 134" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>
        <path d="M111 134 Q120 138 129 134" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>`;
    case "hibernating":
      // Asleep: arcs that curve down.
      return svg`<path d="M71 132 Q80 141 89 132" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>
        <path d="M111 132 Q120 141 129 132" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>`;
    case "sad":
      // Tall oval eyes with a big glint, and worried brows.
      return svg`<g class="eyes">
          <g class="eye"><ellipse cx="80" cy="134" rx="6.5" ry="12.5" fill=${INK}/><circle cx="77.8" cy="128.5" r="2.8" fill="#fff"/><circle cx="82" cy="140" r="1.3" fill="#fff"/></g>
          <g class="eye"><ellipse cx="120" cy="134" rx="6.5" ry="12.5" fill=${INK}/><circle cx="117.8" cy="128.5" r="2.8" fill="#fff"/><circle cx="122" cy="140" r="1.3" fill="#fff"/></g>
        </g>
        <path d="M68 121 L89 113" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M132 121 L111 113" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    default:
      // content: tall oval eyes with two glints. They blink now and then and look around slowly.
      return svg`<g class="eyes look">
        <g class="eye"><ellipse cx="80" cy="132" rx="6.5" ry="12.5" fill=${INK}/><circle cx="77.8" cy="126.5" r="2.8" fill="#fff"/><circle cx="82" cy="138" r="1.3" fill="#fff"/></g>
        <g class="eye"><ellipse cx="120" cy="132" rx="6.5" ry="12.5" fill=${INK}/><circle cx="117.8" cy="126.5" r="2.8" fill="#fff"/><circle cx="122" cy="138" r="1.3" fill="#fff"/></g>
      </g>`;
  }
}

function cheeks(mood: Mood): SVGTemplateResult {
  // A warm pink that stays pink on green (a lighter, stronger pink, not a see-through one).
  const opacity = mood === "sad" || mood === "hibernating" ? 0.45 : 0.85;
  return svg`<ellipse cx="61" cy="151" rx="7" ry="4.2" fill="#FF9EC0" opacity=${opacity}/>
    <ellipse cx="139" cy="151" rx="7" ry="4.2" fill="#FF9EC0" opacity=${opacity}/>`;
}

function mouth(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "happy":
      return svg`<path d="M87 147 Q100 176 113 147 Z" fill=${INK} stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
        <path d="M93 162 Q100 154 107 162 Q100 170 93 162 Z" fill="#FF6B8A"/>`;
    case "sleepy":
      return svg`<ellipse cx="100" cy="155" rx="4.5" ry="3.6" fill=${INK}/>`;
    case "sad":
      return svg`<path d="M91 160 Q100 149 109 160" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`<path d="M93 155 Q100 159 107 155" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    default:
      // A small, gentle smile.
      return svg`<path d="M90 150 Q100 161 110 150" fill="none" stroke=${INK} stroke-width="5" stroke-linecap="round"/>`;
  }
}

/** Things next to the slime that go with the mood: sleeping z's, a sleep bubble, a tear, sparkles. */
function extras(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "sleepy":
      return svg`<g class="zzz"><text class="z z1" x="146" y="84">z</text><text class="z z2" x="158" y="64">z</text></g>`;
    case "hibernating":
      return svg`<g class="zzz slow"><text class="z z1" x="146" y="84">z</text><text class="z z2" x="158" y="64">z</text><text class="z z3" x="170" y="42">Z</text></g>`;
    case "sad":
      return svg`<path class="tear" d="M130 150 q-6 9 0 14 q6 -5 0 -14 z" fill="#5CC8FF" stroke=${INK} stroke-width="2" stroke-linejoin="round"/>`;
    case "happy":
      return svg`<path class="spark s1" d="M26 84 l3.5 8 8 3.5 -8 3.5 -3.5 8 -3.5 -8 -8 -3.5 8 -3.5 z" fill="#FFE45C"/>
        <path class="spark s2" d="M176 70 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <path class="spark s3" d="M168 118 l2 4.5 4.5 2 -4.5 2 -2 4.5 -2 -4.5 -4.5 -2 4.5 -2 z" fill="#fff"/>`;
    default:
      return svg``;
  }
}

/** The little bubble a sleeping slime blows. */
function sleepBubble(mood: Mood): SVGTemplateResult {
  if (mood !== "hibernating") return svg``;
  return svg`<g class="snore"><circle cx="113" cy="152" r="7" fill="#D8FFE2" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="149.5" r="1.8" fill="#fff"/></g>`;
}

export function slimeSvg(mood: Mood): SVGTemplateResult {
  return svg`<svg class="slime ${mood}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="slime-fill" cx="0.36" cy="0.3" r="0.9">
        <stop offset="0" stop-color="#D4FFC2"/>
        <stop offset="0.28" stop-color="#7CFF5B"/>
        <stop offset="0.62" stop-color="#39FF14"/>
        <stop offset="1" stop-color="#10B83A"/>
      </radialGradient>
      <clipPath id="slime-clip"><path d=${BODY}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="58" ry="8" fill="#000" opacity="0.22"/>
    <ellipse class="puddle" cx="100" cy="184" rx="66" ry="9" fill="#39FF14" opacity="0.35"/>
    <g class="jelly">
      <path class="body" d=${BODY} fill="url(#slime-fill)"/>
      <g clip-path="url(#slime-clip)">
        <ellipse cx="100" cy="196" rx="84" ry="34" fill="#047A28" opacity="0.38"/>
        <ellipse cx="160" cy="132" rx="14" ry="48" fill="#fff" opacity="0.13"/>
        <circle class="bubble b1" cx="146" cy="168" r="6" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.8"/>
        <circle class="bubble b2" cx="132" cy="176" r="3" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.5"/>
        <circle class="bubble b3" cx="54" cy="172" r="4" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.6"/>
      </g>
      <path class="body-line" d=${BODY} fill="none" stroke=${INK} stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="76" cy="100" rx="17" ry="9" transform="rotate(-32 76 100)" fill="#fff" opacity="0.4"/>
      <path d="M50 128 C49 108 60 92 78 86" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.7"/>
      <circle cx="49" cy="143" r="3.6" fill="#fff" opacity="0.65"/>
      ${cheeks(mood)} ${eyes(mood)} ${mouth(mood)} ${sleepBubble(mood)}
    </g>
    ${extras(mood)}
  </svg>`;
}

export const slimeCss = css`
  .slime {
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

  /* happy: it hops, squashing on landing, and the puddle under it ripples. */
  .happy .jelly {
    animation: hop 1.2s infinite;
  }
  .happy .shadow {
    animation: hop-shadow 1.2s infinite;
  }
  .happy .puddle {
    animation: ripple 1.2s infinite;
  }
  @keyframes hop {
    0% {
      transform: translateY(0) scale(1.12, 0.86);
    }
    16% {
      transform: translateY(0) scale(0.93, 1.1);
      animation-timing-function: ease-out;
    }
    50% {
      transform: translateY(-26px) scale(0.92, 1.12);
      animation-timing-function: ease-in;
    }
    78% {
      transform: translateY(0) scale(1.03, 0.97);
    }
    88% {
      transform: translateY(0) scale(1.14, 0.84);
    }
    100% {
      transform: translateY(0) scale(1.12, 0.86);
    }
  }
  @keyframes hop-shadow {
    0%,
    78%,
    100% {
      transform: scale(1.08);
      opacity: 0.22;
    }
    50% {
      transform: scale(0.75);
      opacity: 0.1;
    }
  }
  @keyframes ripple {
    0%,
    78%,
    100% {
      transform: scale(1);
      opacity: 0.35;
    }
    50% {
      transform: scale(0.8);
      opacity: 0.12;
    }
    88% {
      transform: scale(1.14);
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
      transform: scale(1, 1) skewX(0deg);
    }
    35% {
      transform: scale(0.985, 1.04) skewX(0.8deg);
    }
    70% {
      transform: scale(1.01, 0.99) skewX(-0.8deg);
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
      transform: rotate(-3deg) scale(1.04, 0.95);
    }
    50% {
      transform: rotate(-3deg) scale(0.99, 1.02);
    }
  }

  /* sad: it sags, and a tear rolls. */
  .sad .jelly {
    transform: scale(1.06, 0.92);
    animation: sag 5.5s ease-in-out infinite;
  }
  @keyframes sag {
    0%,
    100% {
      transform: scale(1.06, 0.92);
    }
    50% {
      transform: scale(1.04, 0.94);
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
    transform: scale(1.12, 0.8);
    animation: deep 7s ease-in-out infinite;
  }
  .hibernating .body {
    filter: saturate(0.7) brightness(0.9);
  }
  @keyframes deep {
    0%,
    100% {
      transform: scale(1.12, 0.8);
    }
    50% {
      transform: scale(1.09, 0.85);
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
