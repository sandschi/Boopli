import { css, svg, unsafeCSS, type SVGTemplateResult } from "lit";

/**
 * What the slime does besides being in a mood: a housework routine (wipe, wash a sock, take out
 * the trash), typing on a laptop, and the one-shot moments (level up, waking up, a tap, a step
 * done). Everything is drawn in code and moved with CSS (transform and opacity only).
 *
 * The slime has no limbs, so it pushes a small jelly arm out of its side when it holds something.
 * The housework routine is one 12 second loop; its keyframes are generated below, so each
 * part of the routine (0 to 32 % wipe, 34 to 64 % wash, 66 to 98 % trash) is easy to read and change.
 */

const INK = "#101010";
const ARM = "#4DFF2B";

export type Activity = "" | "housework" | "typing";
export type Moment = "" | "levelup" | "wake" | "tap" | "done";

/** How long each one-shot moment lasts, in milliseconds. */
export const MOMENT_MS: Record<Exclude<Moment, "">, number> = {
  levelup: 2800,
  wake: 2600,
  tap: 700,
  done: 1700,
};

// --- the art -----------------------------------------------------------------------------

/** Behind the slime: the dirt on the floor and the tub of suds. */
function houseworkBehind(): SVGTemplateResult {
  return svg`
    <ellipse class="smudge" cx="26" cy="191" rx="20" ry="4.5" fill="#6B4A2E" opacity="0.85"/>
    <g class="tub">
      <path d="M2 178 Q4 199 24 199 Q44 199 46 178 Z" fill="#5B8DEF" stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
      <path d="M9 184 Q10 192 18 195" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
      <ellipse cx="24" cy="178" rx="22" ry="6" fill="#BFE9FF" stroke=${INK} stroke-width="3"/>
      <circle class="suds s1" cx="11" cy="174" r="5" fill="#fff" stroke=${INK} stroke-width="1.6"/>
      <circle class="suds s2" cx="22" cy="170" r="6.5" fill="#fff" stroke=${INK} stroke-width="1.6"/>
      <circle class="suds s3" cx="35" cy="173" r="5" fill="#fff" stroke=${INK} stroke-width="1.6"/>
      <circle class="suds s4" cx="28" cy="176" r="3.6" fill="#fff" stroke=${INK} stroke-width="1.4"/>
    </g>
    <g transform="translate(198 144)"><g class="bagfall">${bag()}</g></g>`;
}

function bag(): SVGTemplateResult {
  return svg`<circle r="9" fill="#3F4A5A" stroke=${INK} stroke-width="2.5"/>
    <path d="M-4 -7 L0 -15 L4 -7 Z" fill="#3F4A5A" stroke=${INK} stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-5 -2 Q-3 2 -5 5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.4"/>`;
}

/** The two jelly arms (they come out from behind the body) with what they hold. */
function houseworkArms(): SVGTemplateResult {
  return svg`
    <g class="arm armL">
      <path d="M46 150 Q28 160 22 180" fill="none" stroke=${INK} stroke-width="13" stroke-linecap="round"/>
      <path d="M46 150 Q28 160 22 180" fill="none" stroke=${ARM} stroke-width="7" stroke-linecap="round"/>
      <circle cx="22" cy="180" r="7.5" fill=${ARM} stroke=${INK} stroke-width="3"/>
      <g class="cloth"><rect x="10" y="177" width="24" height="14" rx="4" transform="rotate(-8 22 184)" fill="#FFD84D" stroke=${INK} stroke-width="2.5"/>
        <path d="M14 184 Q22 181 30 184" fill="none" stroke="#fff" stroke-width="2" opacity="0.6"/></g>
      <g class="sock" transform="translate(22 174)">
        <path d="M-5 -14 h10 v14 q0 8 -9 8 h-8 q-5 0 -5 -5 q0 -5 5 -5 h7 z" fill="#fff" stroke=${INK} stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-5 -9 h10 M-5 -5 h10" stroke="#E5484D" stroke-width="2"/>
      </g>
      <circle class="pop p1" cx="8" cy="172" r="4" fill="#fff" fill-opacity="0.5" stroke="#fff" stroke-width="1.6"/>
      <circle class="pop p2" cx="36" cy="170" r="3" fill="#fff" fill-opacity="0.5" stroke="#fff" stroke-width="1.6"/>
      <circle class="pop p3" cx="24" cy="164" r="5" fill="#fff" fill-opacity="0.5" stroke="#fff" stroke-width="1.6"/>
      <path class="clean" d="M22 160 l2.4 5 5 2.4 -5 2.4 -2.4 5 -2.4 -5 -5 -2.4 5 -2.4 z" fill="#FFE45C" stroke=${INK} stroke-width="1.2" stroke-linejoin="round"/>
    </g>
    <g class="arm armR">
      <path d="M154 150 Q168 158 170 176" fill="none" stroke=${INK} stroke-width="13" stroke-linecap="round"/>
      <path d="M154 150 Q168 158 170 176" fill="none" stroke=${ARM} stroke-width="7" stroke-linecap="round"/>
      <circle cx="170" cy="177" r="7.5" fill=${ARM} stroke=${INK} stroke-width="3"/>
      <g class="bagarm" transform="translate(170 176)">${bag()}</g>
    </g>`;
}

/** In front of the slime: the bin the trash goes into. */
function houseworkFront(): SVGTemplateResult {
  return svg`<g class="bin" transform="translate(184 160)">
    <path d="M0 6 L26 6 L23 32 L3 32 Z" fill="#9AA7B5" stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
    <path d="M8 11 L9 28 M13 11 V28 M18 11 L17 28" stroke=${INK} stroke-width="1.6" opacity="0.45" stroke-linecap="round"/>
    <g class="lid"><rect x="-2" y="0" width="30" height="7" rx="3" fill="#7D8A99" stroke=${INK} stroke-width="2.5"/></g>
  </g>`;
}

/** Typing: a laptop in front, two hands that tap, and little symbols rising from it. */
function typingFront(): SVGTemplateResult {
  return svg`
    <g class="laptop">
      <rect x="56" y="184" width="88" height="7" rx="3.5" fill="#6B7486" stroke=${INK} stroke-width="2.5"/>
      <rect x="62" y="150" width="76" height="36" rx="6" fill="#3A4150" stroke=${INK} stroke-width="3"/>
      <path d="M100 160 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.1 5.9 -.8 z" fill="#8FA3BF" opacity="0.9"/>
    </g>
    <circle class="hand h1" cx="68" cy="152" r="7" fill=${ARM} stroke=${INK} stroke-width="3"/>
    <circle class="hand h2" cx="132" cy="152" r="7" fill=${ARM} stroke=${INK} stroke-width="3"/>
    <g class="code">
      <text class="c1" x="84" y="60">&lt;/&gt;</text>
      <text class="c2" x="104" y="52">{ }</text>
      <text class="c3" x="122" y="62">01</text>
    </g>`;
}

export function workBehind(activity: Activity): SVGTemplateResult {
  return activity === "housework" ? houseworkBehind() : svg``;
}
export function workArms(activity: Activity): SVGTemplateResult {
  return activity === "housework" ? houseworkArms() : svg``;
}
export function workFront(activity: Activity): SVGTemplateResult {
  if (activity === "housework") return houseworkFront();
  if (activity === "typing") return typingFront();
  return svg``;
}

const STAR = "M0 -9 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 z";

/** The extras of a one-shot moment (stars, a badge, text, a heart, a yawn). */
export function momentArt(moment: Moment, text: string): SVGTemplateResult {
  switch (moment) {
    case "levelup": {
      const burst = [
        [-70, -52, "#FFE45C"],
        [0, -86, "#fff"],
        [70, -52, "#FF9EC0"],
        [-92, 4, "#7CD7FF"],
        [92, 4, "#FFE45C"],
        [-44, -84, "#B79CFF"],
        [44, -84, "#7CFF5B"],
      ] as const;
      return svg`${burst.map(
        ([dx, dy, color], i) =>
          svg`<g transform="translate(100 110)"><g class="burst" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${0.45 + i * 0.04}s"><path d=${STAR} fill=${color} stroke=${INK} stroke-width="1.6" stroke-linejoin="round"/></g></g>`
      )}
      <g class="badge"><rect x="100" y="16" width="96" height="28" rx="14" fill="#FFD166" stroke=${INK} stroke-width="3"/>
        <text x="148" y="35" text-anchor="middle">${text || "Level up!"}</text></g>`;
    }
    case "done":
      return svg`<path class="spark d1" d="M30 90 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <path class="spark d2" d="M170 80 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 z" fill="#FFE45C"/>
        <text class="xp" x="100" y="70" text-anchor="middle">${text}</text>`;
    case "tap":
      return svg`<path class="heart" d="M100 70 c-6 -9 -18 -2 -10 8 l10 9 l10 -9 c8 -10 -4 -17 -10 -8 z" fill="#FF6B8A" stroke=${INK} stroke-width="2" stroke-linejoin="round"/>`;
    case "wake":
      return svg`<ellipse class="yawn" cx="100" cy="153" rx="9" ry="11" fill=${INK}/>
        <path class="yawn tongue" d="M93 160 Q100 152 107 160 Q100 168 93 160 Z" fill="#FF6B8A"/>`;
    default:
      return svg``;
  }
}

// --- the motion --------------------------------------------------------------------------

const T = 12; // seconds for one run of the housework routine

type Stops = Array<[number, string]>;

function keyframes(name: string, stops: Stops): string {
  return `@keyframes ${name}{${stops.map(([p, s]) => `${p}%{${s}}`).join("")}}`;
}

/** Alternate between two states every `step` percent from `from` to `to`. */
function alternate(from: number, to: number, step: number, a: string, b: string): Stops {
  const out: Stops = [];
  let i = 0;
  for (let p = from; p <= to + 0.001; p += step) out.push([Math.round(p * 100) / 100, i++ % 2 ? b : a]);
  return out;
}

const REST = "transform:translate(0px,0px) rotate(0deg)";

// 0 to 32 %: it wipes the dirt away; 34 to 64 %: it washes a sock; 66 to 98 %: it takes out the trash.
const ARM_L: Stops = [
  [0, REST],
  ...alternate(2, 30, 2, "transform:translate(-5px,0px) rotate(-8deg)", "transform:translate(8px,0px) rotate(8deg)"),
  [32, REST],
  [34, REST],
  ...alternate(36, 62, 3.4, "transform:translate(0px,-5px) rotate(0deg)", "transform:translate(0px,6px) rotate(0deg)"),
  [64, REST],
  [100, REST],
];

const ARM_R: Stops = [
  [0, `${REST};opacity:0`],
  [64, `${REST};opacity:0`],
  [66, `${REST};opacity:1`],
  [72, `${REST};opacity:1`], // it picks the bag up
  [78, "transform:translate(14px,-4px) rotate(-62deg);opacity:1"], // and lifts it over the bin
  [84, "transform:translate(14px,-4px) rotate(-62deg);opacity:1"], // lets go
  [90, `${REST};opacity:1`],
  [98, `${REST};opacity:1`],
  [100, `${REST};opacity:0`],
];

function visible(onFrom: number, onTo: number): Stops {
  return [
    [0, "opacity:0"],
    [Math.max(0.1, onFrom - 1), "opacity:0"],
    [onFrom, "opacity:1"],
    [onTo, "opacity:1"],
    [Math.min(99.9, onTo + 1.5), "opacity:0"],
    [100, "opacity:0"],
  ];
}

/** A bubble that pops up, floats and fades once per routine, starting at `at` percent. */
function bubbleAt(at: number): Stops {
  return [
    [0, "opacity:0;transform:scale(0.3) translate(0px,0px)"],
    [at, "opacity:0;transform:scale(0.3) translate(0px,0px)"],
    [at + 2, "opacity:1;transform:scale(1) translate(0px,-2px)"],
    [at + 5, "opacity:0;transform:scale(1.5) translate(0px,-9px)"],
    [100, "opacity:0;transform:scale(1.5) translate(0px,-9px)"],
  ];
}

const generated = [
  keyframes("arm-l", ARM_L),
  keyframes("arm-r", ARM_R),
  keyframes("vis-cloth", visible(1, 31)),
  keyframes("vis-sock", visible(35, 63)),
  keyframes("vis-bagarm", visible(66, 79.5)),
  keyframes("vis-bin", visible(63, 98)),
  keyframes("vis-tub", [
    [0, "opacity:0;transform:scale(0.6)"],
    [32, "opacity:0;transform:scale(0.6)"],
    [34, "opacity:1;transform:scale(1)"],
    [64, "opacity:1;transform:scale(1)"],
    [66, "opacity:0;transform:scale(0.6)"],
    [100, "opacity:0;transform:scale(0.6)"],
  ]),
  keyframes("vis-smudge", [
    [0, "opacity:0.85"],
    [8, "opacity:0.85"],
    [30, "opacity:0"],
    [97, "opacity:0"],
    [99, "opacity:0.85"],
    [100, "opacity:0.85"],
  ]),
  keyframes("pop-1", bubbleAt(4)),
  keyframes("pop-2", bubbleAt(12)),
  keyframes("pop-3", bubbleAt(20)),
  keyframes("clean-star", [
    [0, "opacity:0;transform:scale(0.2)"],
    [59, "opacity:0;transform:scale(0.2)"],
    [61, "opacity:1;transform:scale(1.1)"],
    [64, "opacity:0;transform:scale(0.6)"],
    [100, "opacity:0;transform:scale(0.2)"],
  ]),
  keyframes("bag-fall", [
    [0, "opacity:0;transform:translateY(0px)"],
    [79.4, "opacity:0;transform:translateY(0px)"],
    [79.5, "opacity:1;transform:translateY(0px)"],
    [83, "opacity:1;transform:translateY(24px)"],
    [84, "opacity:0;transform:translateY(24px)"],
    [100, "opacity:0;transform:translateY(24px)"],
  ]),
  keyframes("lid", [
    [0, "transform:rotate(0deg)"],
    [76, "transform:rotate(0deg)"],
    [79, "transform:rotate(-38deg)"],
    [86, "transform:rotate(-38deg)"],
    [89, "transform:rotate(0deg)"],
    [100, "transform:rotate(0deg)"],
  ]),
  keyframes("look-work", [
    [0, "transform:translateX(-4px)"],
    [64, "transform:translateX(-4px)"],
    [67, "transform:translateX(4px)"],
    [98, "transform:translateX(4px)"],
    [100, "transform:translateX(-4px)"],
  ]),
  keyframes("work-bounce", [
    [0, "transform:scale(1,1)"],
    [31, "transform:scale(1,1)"],
    [33, "transform:scale(0.95,1.07)"],
    [35, "transform:scale(1,1)"],
    [63, "transform:scale(1,1)"],
    [65, "transform:scale(0.95,1.07)"],
    [67, "transform:scale(1,1)"],
    [97, "transform:scale(1,1)"],
    [99, "transform:scale(0.95,1.07)"],
    [100, "transform:scale(1,1)"],
  ]),
].join("\n");

export const workCss = css`
  ${unsafeCSS(generated)}

  .arm {
    transform-box: view-box;
  }
  .armL {
    transform-origin: 46px 150px;
  }
  .armR {
    transform-origin: 154px 150px;
  }
  .cloth,
  .sock,
  .bagarm,
  .tub,
  .smudge,
  .bin,
  .bagfall,
  .pop,
  .clean,
  .lid {
    transform-box: view-box;
    opacity: 0;
  }
  .tub {
    transform-origin: 24px 199px;
  }
  .lid {
    opacity: 1;
    transform-origin: -2px 3px;
  }
  .pop,
  .clean {
    transform-box: fill-box;
    transform-origin: 50% 50%;
  }
  .smudge {
    opacity: 0.85;
  }

  /* The housework routine: every part runs on the same 12 second loop. */
  .housework .armL {
    animation: arm-l ${unsafeCSS(String(T))}s ease-in-out infinite;
  }
  .housework .armR {
    animation: arm-r ${unsafeCSS(String(T))}s ease-in-out infinite;
  }
  .housework .cloth {
    animation: vis-cloth ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .sock {
    animation: vis-sock ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .bagarm {
    animation: vis-bagarm ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .bin {
    animation: vis-bin ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .tub {
    animation: vis-tub ${unsafeCSS(String(T))}s ease-out infinite;
  }
  .housework .smudge {
    animation: vis-smudge ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .pop.p1 {
    animation: pop-1 ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .pop.p2 {
    animation: pop-2 ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .pop.p3 {
    animation: pop-3 ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .clean {
    animation: clean-star ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .bagfall {
    animation: bag-fall ${unsafeCSS(String(T))}s linear infinite;
  }
  .housework .lid {
    animation: lid ${unsafeCSS(String(T))}s ease-in-out infinite;
  }
  .housework .eyes {
    animation: look-work ${unsafeCSS(String(T))}s ease-in-out infinite;
  }
  .housework .jelly {
    animation: work-bounce ${unsafeCSS(String(T))}s ease-in-out infinite;
  }
  .suds {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: suds 1.6s ease-in-out infinite;
  }
  .suds.s2 {
    animation-delay: 0.4s;
  }
  .suds.s3 {
    animation-delay: 0.8s;
  }
  .suds.s4 {
    animation-delay: 1.2s;
  }
  @keyframes suds {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.18);
    }
  }

  /* Typing: it looks down at the screen, the hands tap, symbols rise. */
  .typing .eyes {
    animation: none;
    transform: translateY(4px);
  }
  .typing .jelly {
    animation: type-bob 0.64s ease-in-out infinite;
  }
  @keyframes type-bob {
    0%,
    100% {
      transform: scale(1, 1);
    }
    50% {
      transform: scale(1.01, 0.985);
    }
  }
  .hand {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: tap-hand 0.32s ease-in-out infinite alternate;
  }
  .hand.h2 {
    animation-delay: 0.16s;
  }
  @keyframes tap-hand {
    from {
      transform: translateY(0px);
    }
    to {
      transform: translateY(5px);
    }
  }
  .code text {
    font: 700 13px ui-monospace, monospace;
    fill: var(--primary-text-color, #fff);
    opacity: 0;
    transform-box: fill-box;
    animation: code-rise 3.2s ease-out infinite;
  }
  .code .c2 {
    animation-delay: 1.05s;
  }
  .code .c3 {
    animation-delay: 2.1s;
  }
  @keyframes code-rise {
    0% {
      opacity: 0;
      transform: translateY(12px);
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-22px);
    }
  }

  /* The one-shot moments. They play once and win over the mood's own motion. */
  .slime.levelup .jelly {
    animation: lv-jump 2.6s ease-out 1 both;
  }
  @keyframes lv-jump {
    0% {
      transform: translateY(0) scale(1, 1);
    }
    14% {
      transform: translateY(0) scale(1.16, 0.8);
    }
    38% {
      transform: translateY(-46px) scale(0.86, 1.2);
    }
    56% {
      transform: translateY(0) scale(1.18, 0.82);
    }
    70% {
      transform: translateY(-14px) scale(0.95, 1.07);
    }
    84% {
      transform: translateY(0) scale(1.06, 0.94);
    }
    100% {
      transform: translateY(0) scale(1, 1);
    }
  }
  .burst {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    opacity: 0;
    animation: burst 1.5s ease-out 1 both;
  }
  @keyframes burst {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.3);
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--dx), var(--dy)) scale(1.1) rotate(80deg);
    }
  }
  .badge {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: badge 2.6s ease-out 1 both;
  }
  .badge text {
    font: 800 17px system-ui, sans-serif;
    fill: ${unsafeCSS(INK)};
  }
  @keyframes badge {
    0% {
      opacity: 0;
      transform: translateY(14px) scale(0.5);
    }
    18% {
      opacity: 1;
      transform: translateY(0) scale(1.1);
    }
    26%,
    80% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-8px) scale(1);
    }
  }

  .slime.done .jelly {
    animation: done-hop 1.4s ease-out 1 both;
  }
  @keyframes done-hop {
    0% {
      transform: translateY(0) scale(1.1, 0.88);
    }
    25% {
      transform: translateY(-30px) scale(0.92, 1.12);
    }
    50% {
      transform: translateY(0) scale(1.12, 0.86);
    }
    70% {
      transform: translateY(-8px) scale(0.98, 1.03);
    }
    100% {
      transform: translateY(0) scale(1, 1);
    }
  }
  .xp {
    font: 800 19px system-ui, sans-serif;
    fill: #fff;
    stroke: ${unsafeCSS(INK)};
    stroke-width: 4px;
    paint-order: stroke;
    animation: xp-rise 1.6s ease-out 1 both;
  }
  @keyframes xp-rise {
    0% {
      opacity: 0;
      transform: translateY(18px);
    }
    20% {
      opacity: 1;
    }
    75% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-26px);
    }
  }

  .slime.tap .jelly {
    animation: tap-squish 0.6s ease-out 1 both;
  }
  @keyframes tap-squish {
    0% {
      transform: scale(1, 1);
    }
    22% {
      transform: scale(1.2, 0.78);
    }
    50% {
      transform: scale(0.9, 1.14);
    }
    75% {
      transform: scale(1.05, 0.96);
    }
    100% {
      transform: scale(1, 1);
    }
  }
  .heart {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    animation: heart 0.7s ease-out 1 both;
  }
  @keyframes heart {
    0% {
      opacity: 0;
      transform: translateY(10px) scale(0.4);
    }
    35% {
      opacity: 1;
      transform: translateY(-2px) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-18px) scale(1.1);
    }
  }

  .slime.wake .jelly {
    animation: wake-stretch 2.4s ease-in-out 1 both;
  }
  @keyframes wake-stretch {
    0% {
      transform: scale(1.12, 0.82);
    }
    30% {
      transform: scale(0.92, 1.2);
    }
    55% {
      transform: scale(0.96, 1.14);
    }
    80% {
      transform: scale(1.04, 0.97);
    }
    100% {
      transform: scale(1, 1);
    }
  }
  .yawn {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: yawn 1.8s ease-in-out 1 both;
  }
  @keyframes yawn {
    0% {
      transform: scale(0.1);
    }
    35%,
    65% {
      transform: scale(1);
    }
    100% {
      transform: scale(0.1);
    }
  }
  .d1,
  .d2 {
    transform-box: fill-box;
    transform-origin: 50% 50%;
    animation: twinkle 0.9s ease-out 2;
  }
  .d2 {
    animation-delay: 0.2s;
  }
`;
