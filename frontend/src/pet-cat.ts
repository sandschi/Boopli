import { css, svg, type SVGTemplateResult } from "lit";
import { extras, scarfArt } from "./pet-kit";
import { momentArt, workArms, workBehind, workFront, type Activity, type Hands, type Moment } from "./pet-work";
import type { Mood } from "./types";

/**
 * The cat: a slim black cat, dark purple in the light, with big lavender eyes, whiskers, a green
 * bow tie and a long swishing tail. A black body would disappear in a dark room, so every shape
 * has a light violet rim line. Built on the same kit as the other pets.
 */

const RIM = "var(--fur-rim, #8C78CC)"; // the light outline
const DARK = "#1B1133";
const BODY_TOP = "var(--fur, #2F2054)"; // --fur: the fur colour the pet wears (see furStyle in pet-kit)
const BODY_BOTTOM = "var(--fur-dark, #170E2E)";
const VEST = "var(--fur-vest, #3C2C70)";
const NECK = { x: 100, y: 121, w: 52 }; // where a scarf goes
const EYE = "#C4B6F0";
const NOSE = "#D69AE8";
const BOW = "#1F9C7C";
const BOW_DARK = "#0E5C48";

const HANDS: Hands = {
  color: "var(--fur-deep, #2A1B4A)",
  ink: RIM,
  thick: 1.4,
  shoulders: { l: [80, 130], r: [120, 130] },
  armD: { l: "M78 130 C40 130 16 152 22 180", r: "M122 130 C160 132 176 154 170 176" },
  typingBehind: true,
  codeAt: [66, 34],
};

const BODY = "M72 182 C66 162 68 134 80 120 C88 112 112 112 120 120 C132 134 134 162 128 182 Z";
const HEAD = "M54 78 C54 54 74 46 100 46 C126 46 146 54 146 78 C146 102 126 118 100 118 C74 118 54 102 54 78 Z";
// A long tail that lies out to the side and curls up at the end.
const TAIL = "M124 176 C168 184 182 156 164 144 C150 135 154 116 174 112";

function eyes(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "happy":
      return svg`<path d="M71 84 Q80 71 89 84" fill="none" stroke=${EYE} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M111 84 Q120 71 129 84" fill="none" stroke=${EYE} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sleepy":
      return svg`<path d="M72 81 Q80 86 88 81" fill="none" stroke=${EYE} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M112 81 Q120 86 128 81" fill="none" stroke=${EYE} stroke-width="4.5" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`<path d="M72 79 Q80 88 88 79" fill="none" stroke=${EYE} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M112 79 Q120 88 128 79" fill="none" stroke=${EYE} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sad":
      return svg`<g class="eyes">
          <g class="eye"><circle cx="80" cy="82" r="9.5" fill=${EYE}/><ellipse cx="80" cy="83" rx="5.4" ry="6.6" fill=${DARK}/><circle cx="78" cy="80" r="2.2" fill="#fff"/></g>
          <g class="eye"><circle cx="120" cy="82" r="9.5" fill=${EYE}/><ellipse cx="120" cy="83" rx="5.4" ry="6.6" fill=${DARK}/><circle cx="118" cy="80" r="2.2" fill="#fff"/></g>
        </g>
        <path d="M69 69 L90 63" stroke=${EYE} stroke-width="3.4" stroke-linecap="round"/>
        <path d="M131 69 L110 63" stroke=${EYE} stroke-width="3.4" stroke-linecap="round"/>`;
    default:
      return svg`<g class="eyes look">
        <g class="eye"><circle cx="80" cy="80" r="9.5" fill=${EYE}/><circle cx="80" cy="80" r="5" fill=${DARK}/><circle cx="82" cy="78" r="1.9" fill="#fff"/></g>
        <g class="eye"><circle cx="120" cy="80" r="9.5" fill=${EYE}/><circle cx="120" cy="80" r="5" fill=${DARK}/><circle cx="122" cy="78" r="1.9" fill="#fff"/></g>
      </g>`;
  }
}

function mouth(mood: Mood): SVGTemplateResult {
  const line = svg`<path d="M100 95 V98" stroke=${EYE} stroke-width="2.8" stroke-linecap="round"/>`;
  switch (mood) {
    case "happy":
      return svg`${line}<path d="M91 99 Q100 114 109 99 Z" fill=${DARK} stroke=${EYE} stroke-width="2.8" stroke-linejoin="round"/>
        <path d="M95 106 Q100 101 105 106 Q100 111 95 106 Z" fill="#FF7FA3"/>`;
    case "sleepy":
      return svg`${line}<ellipse cx="100" cy="104" rx="3.2" ry="2.6" fill=${EYE}/>`;
    case "sad":
      return svg`${line}<path d="M92 107 Q100 99 108 107" fill="none" stroke=${EYE} stroke-width="3" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`${line}<path d="M95 101 Q100 105 105 101" fill="none" stroke=${EYE} stroke-width="3" stroke-linecap="round"/>`;
    default:
      return svg`${line}<path d="M92 100 Q96 106 100 98 Q104 106 108 100" fill="none" stroke=${EYE} stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

function whiskers(): SVGTemplateResult {
  return svg`<g class="whiskers" fill="none" stroke=${EYE} stroke-width="2" stroke-linecap="round" opacity="0.85">
    <path d="M68 92 L34 84"/><path d="M68 97 L32 98"/><path d="M70 102 L38 112"/>
    <path d="M132 92 L166 84"/><path d="M132 97 L168 98"/><path d="M130 102 L162 112"/>
  </g>`;
}

function sleepBubble(mood: Mood): SVGTemplateResult {
  if (mood !== "hibernating") return svg``;
  return svg`<g class="snore"><circle cx="113" cy="98" r="7" fill="#E9E0FF" fill-opacity="0.45" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="95.5" r="1.8" fill="#fff"/></g>`;
}

export interface CatOptions {
  activity?: Activity;
  moment?: Moment;
  text?: string;
  /** The colour of a scarf the pet wears (none = no scarf; with a scarf the bow tie is left off). */
  neck?: string;
}

export function catSvg(mood: Mood, options: CatOptions = {}): SVGTemplateResult {
  const activity = options.activity ?? "";
  const moment = options.moment ?? "";
  mood = activity ? "content" : mood; // busy: no sleepy or sad face
  return svg`<svg class="pet-art cat ${mood} ${activity ? `work ${activity}` : ""} ${moment}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <linearGradient id="cat-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color=${BODY_TOP}/>
        <stop offset="1" stop-color=${BODY_BOTTOM}/>
      </linearGradient>
      <clipPath id="cat-body-clip"><path d=${BODY}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="56" ry="8" fill="#000" opacity="0.3"/>
    ${workBehind(activity)} ${workArms(activity, HANDS)}
    <g class="jelly">
      <g class="tail">
        <path d=${TAIL} fill="none" stroke=${RIM} stroke-width="17" stroke-linecap="round"/>
        <path d=${TAIL} fill="none" stroke=${DARK} stroke-width="10.5" stroke-linecap="round"/>
      </g>
      <g class="ear earL"><path d="M56 72 C52 52 52 36 56 22 C70 28 84 38 92 50 Z" fill="url(#cat-fill)" stroke=${RIM} stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M63 58 C61 48 61 40 63 33 C70 37 77 42 81 48 Z" fill="#6E5AA8"/></g>
      <g class="ear earR"><path d="M144 72 C148 52 148 36 144 22 C130 28 116 38 108 50 Z" fill="url(#cat-fill)" stroke=${RIM} stroke-width="3.5" stroke-linejoin="round"/>
        <path d="M137 58 C139 48 139 40 137 33 C130 37 123 42 119 48 Z" fill="#6E5AA8"/></g>
      <path d=${BODY} fill="url(#cat-fill)"/>
      <g clip-path="url(#cat-body-clip)">
        <path d="M86 116 L100 128 L114 116 L117 176 L83 176 Z" fill=${VEST}/>
        <path d="M100 128 V176" stroke="#2A1C52" stroke-width="2.4"/>
        <ellipse cx="100" cy="198" rx="70" ry="22" fill="#000" opacity="0.25"/>
      </g>
      <path d=${BODY} fill="none" stroke=${RIM} stroke-width="3.5" stroke-linejoin="round"/>
      <ellipse cx="86" cy="180" rx="13" ry="7.5" fill=${VEST} stroke=${RIM} stroke-width="3.5"/>
      <ellipse cx="114" cy="180" rx="13" ry="7.5" fill=${VEST} stroke=${RIM} stroke-width="3.5"/>
      ${scarfArt(options.neck, NECK)}
      <path d=${HEAD} fill="url(#cat-fill)" stroke=${RIM} stroke-width="3.5" stroke-linejoin="round"/>
      <path d="M62 70 C62 60 70 54 82 52" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity="0.14"/>
      ${whiskers()} ${eyes(mood)}
      <path d="M94.5 89 L105.5 89 L100 96 Z" fill=${NOSE} stroke=${NOSE} stroke-width="2" stroke-linejoin="round"/>
      ${moment === "wake" ? svg`<path d="M100 95 V98" stroke=${EYE} stroke-width="2.8" stroke-linecap="round"/>` : mouth(mood)}
      ${sleepBubble(mood)}
      ${options.neck ? svg`` : svg`<g><path d="M100 121 L80 112 L80 130 Z" fill=${BOW} stroke=${BOW_DARK} stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M100 121 L120 112 L120 130 Z" fill=${BOW} stroke=${BOW_DARK} stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="100" cy="121" r="5" fill="#27B592" stroke=${BOW_DARK} stroke-width="2.4"/></g>`}
    </g>
    ${workFront(activity, HANDS)}
    ${activity ? svg`` : extras(mood, { z: [10, -30], tear: [-10, -62] })}
    ${momentArt(moment, options.text ?? "", { mouth: [100, 106], badgeDy: -18, xpDy: -46, heartDy: -44 })}
  </svg>`;
}

export const catCss = css`
  /* A cat is graceful: it squashes a bit less than the slime. */
  .cat {
    --k: 0.4;
  }
  .cat .ear,
  .cat .tail,
  .cat .whiskers {
    transform-box: fill-box;
  }
  .cat .ear {
    transform-origin: 50% 100%;
    animation: cat-ear 8s ease-in-out infinite;
  }
  .cat .earR {
    animation-delay: 3.5s;
  }
  @keyframes cat-ear {
    0%,
    88%,
    100% {
      transform: rotate(0deg);
    }
    91% {
      transform: rotate(-9deg);
    }
    94% {
      transform: rotate(3deg);
    }
  }
  .cat .tail {
    transform-origin: 0% 100%;
    animation: cat-swish 3.6s ease-in-out infinite alternate;
  }
  .cat.happy .tail {
    animation-duration: 1.6s;
  }
  .cat.work .tail {
    animation-duration: 2s;
  }
  .cat.sleepy .tail,
  .cat.hibernating .tail,
  .cat.sad .tail {
    animation: none;
  }
  .cat.sleepy .ear,
  .cat.hibernating .ear,
  .cat.sad .ear {
    animation: none;
  }
  .cat.sad .earL {
    transform: rotate(-12deg);
  }
  .cat.sad .earR {
    transform: rotate(12deg);
  }
  @keyframes cat-swish {
    from {
      transform: rotate(-5deg);
    }
    to {
      transform: rotate(6deg);
    }
  }
  .cat .whiskers {
    transform-origin: 50% 50%;
    animation: whisker 6s ease-in-out infinite;
  }
  @keyframes whisker {
    0%,
    90%,
    100% {
      transform: scaleY(1);
    }
    94% {
      transform: scaleY(1.12);
    }
  }
`;
