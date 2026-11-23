import { css, svg, type SVGTemplateResult } from "lit";
import { extras } from "./pet-kit";
import { momentArt, workArms, workBehind, workFront, type Activity, type Hands, type Moment } from "./pet-work";
import type { Mood } from "./types";

/**
 * The bear: a big, soft brown bear sitting up, with a tan muzzle and belly and a round dark nose.
 * It is built on the same kit as the slime (the same moods, housework, typing and moments),
 * but it has real paws, and a heavy body that only squashes a little (--k below).
 */

const INK = "#3A1204";
const FUR = "#8A2A0B";
const FUR_DARK = "#6E1F07";
const TAN = "#D79563";
const NOSE = "#190703";

const ARM_IDLE = { l: "M54 130 C40 138 38 158 46 170", r: "M146 130 C160 138 162 158 154 170" };

/** One arm, drawn BEHIND the body: it comes out from the side, so there is no visible joint. */
function arm(d: string): SVGTemplateResult {
  return svg`<path d=${d} fill="none" stroke=${INK} stroke-width="19.5" stroke-linecap="round"/>
    <path d=${d} fill="none" stroke=${FUR} stroke-width="10.5" stroke-linecap="round"/>`;
}

const HANDS: Hands = {
  color: FUR,
  thick: 1.5,
  shoulders: { l: [54, 130], r: [146, 130] },
  armD: { l: "M54 130 C28 130 16 156 22 180", r: "M146 130 C172 132 178 154 170 176" },
  // Typing: the paws are behind the laptop lid and tap above its edge.
  typingBehind: true,
  codeAt: [66, 34], // the symbols rise to the right of the head, not on its forehead
};

const BODY =
  "M54 182 C40 182 36 160 44 138 C52 118 74 110 100 110 C126 110 148 118 156 138 C164 160 160 182 146 182 Z";
const HEAD = "M52 80 C52 56 70 42 100 42 C130 42 148 56 148 80 C148 104 130 118 100 118 C70 118 52 104 52 80 Z";

function eyes(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "happy":
      return svg`<path d="M72 72 Q80 61 88 72" fill="none" stroke=${NOSE} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M112 72 Q120 61 128 72" fill="none" stroke=${NOSE} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sleepy":
      return svg`<path d="M73 70 Q80 74 87 70" fill="none" stroke=${NOSE} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M113 70 Q120 74 127 70" fill="none" stroke=${NOSE} stroke-width="4.5" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`<path d="M73 68 Q80 76 87 68" fill="none" stroke=${NOSE} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M113 68 Q120 76 127 68" fill="none" stroke=${NOSE} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sad":
      return svg`<g class="eyes">
          <g class="eye"><ellipse cx="80" cy="72" rx="5.6" ry="7" fill=${NOSE}/><circle cx="78.2" cy="68.8" r="2.1" fill="#fff"/><circle cx="82" cy="75" r="1" fill="#fff"/></g>
          <g class="eye"><ellipse cx="120" cy="72" rx="5.6" ry="7" fill=${NOSE}/><circle cx="118.2" cy="68.8" r="2.1" fill="#fff"/><circle cx="122" cy="75" r="1" fill="#fff"/></g>
        </g>
        <path d="M71 61 L88 55" stroke=${NOSE} stroke-width="3.4" stroke-linecap="round"/>
        <path d="M129 61 L112 55" stroke=${NOSE} stroke-width="3.4" stroke-linecap="round"/>`;
    default:
      return svg`<g class="eyes look">
        <g class="eye"><circle cx="80" cy="70" r="5.6" fill=${NOSE}/><circle cx="78.2" cy="67.8" r="1.9" fill="#fff"/></g>
        <g class="eye"><circle cx="120" cy="70" r="5.6" fill=${NOSE}/><circle cx="118.2" cy="67.8" r="1.9" fill="#fff"/></g>
      </g>`;
  }
}

function cheeks(mood: Mood): SVGTemplateResult {
  const opacity = mood === "sad" || mood === "hibernating" ? 0.4 : 0.75;
  return svg`<ellipse cx="66" cy="88" rx="6" ry="3.6" fill="#FF8FB0" opacity=${opacity}/>
    <ellipse cx="134" cy="88" rx="6" ry="3.6" fill="#FF8FB0" opacity=${opacity}/>`;
}

function mouth(mood: Mood): SVGTemplateResult {
  const line = svg`<path d="M100 93 V98" stroke=${NOSE} stroke-width="3.2" stroke-linecap="round"/>`;
  switch (mood) {
    case "happy":
      return svg`${line}<path d="M90 98 Q100 118 110 98 Z" fill=${NOSE} stroke=${NOSE} stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M95 108 Q100 102 105 108 Q100 113 95 108 Z" fill="#FF6B8A"/>`;
    case "sleepy":
      return svg`${line}<ellipse cx="100" cy="104" rx="3.8" ry="3.2" fill=${NOSE}/>`;
    case "sad":
      return svg`${line}<path d="M92 107 Q100 98 108 107" fill="none" stroke=${NOSE} stroke-width="3.6" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`${line}<path d="M94 101 Q100 105 106 101" fill="none" stroke=${NOSE} stroke-width="3.4" stroke-linecap="round"/>`;
    default:
      return svg`${line}<path d="M91 98 Q100 108 109 98" fill="none" stroke=${NOSE} stroke-width="3.6" stroke-linecap="round"/>`;
  }
}

/** The little bubble a sleeping bear blows from its nose. */
function sleepBubble(mood: Mood): SVGTemplateResult {
  if (mood !== "hibernating") return svg``;
  return svg`<g class="snore"><circle cx="112" cy="94" r="7" fill="#FFF1DD" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="109.5" cy="91.5" r="1.8" fill="#fff"/></g>`;
}

export interface BearOptions {
  activity?: Activity;
  moment?: Moment;
  text?: string;
}

export function bearSvg(mood: Mood, options: BearOptions = {}): SVGTemplateResult {
  const activity = options.activity ?? "";
  const moment = options.moment ?? "";
  mood = activity ? "content" : mood; // busy: no sleepy or sad face
  return svg`<svg class="pet-art bear ${mood} ${activity ? `work ${activity}` : ""} ${moment}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="bear-body-clip"><path d=${BODY}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="62" ry="8" fill="#000" opacity="0.22"/>
    ${workBehind(activity)} ${workArms(activity, HANDS)}
    <g class="jelly">
      <g class="ear earL"><circle cx="62" cy="48" r="17" fill=${FUR} stroke=${INK} stroke-width="4"/><circle cx="63" cy="49" r="9" fill=${TAN}/></g>
      <g class="ear earR"><circle cx="138" cy="48" r="17" fill=${FUR} stroke=${INK} stroke-width="4"/><circle cx="137" cy="49" r="9" fill=${TAN}/></g>
      ${activity ? svg`` : svg`${arm(ARM_IDLE.l)}${arm(ARM_IDLE.r)}`}
      <path d=${BODY} fill=${FUR}/>
      <g clip-path="url(#bear-body-clip)">
        <ellipse cx="100" cy="196" rx="86" ry="30" fill=${FUR_DARK} opacity="0.55"/>
        <ellipse cx="100" cy="152" rx="29" ry="32" fill=${TAN}/>
      </g>
      <path d=${BODY} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      <g class="foot"><ellipse cx="72" cy="178" rx="19" ry="10" fill=${FUR} stroke=${INK} stroke-width="4"/><ellipse cx="72" cy="180" rx="10" ry="5" fill=${TAN}/></g>
      <g class="foot"><ellipse cx="128" cy="178" rx="19" ry="10" fill=${FUR} stroke=${INK} stroke-width="4"/><ellipse cx="128" cy="180" rx="10" ry="5" fill=${TAN}/></g>
      <path d=${HEAD} fill=${FUR} stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      <path d="M60 70 C60 58 70 50 82 48" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.16"/>
      <ellipse cx="100" cy="96" rx="25" ry="19" fill=${TAN}/>
      ${cheeks(mood)} ${eyes(mood)}
      <rect x="88" y="80" width="24" height="14" rx="7" fill=${NOSE}/>
      <ellipse cx="94" cy="84" rx="4.5" ry="2" fill="#fff" opacity="0.8"/>
      ${moment === "wake" ? svg`<path d="M100 93 V98" stroke=${NOSE} stroke-width="3.2" stroke-linecap="round"/>` : mouth(mood)}
      ${sleepBubble(mood)}
    </g>
    ${workFront(activity, HANDS)}
    ${activity ? svg`` : extras(mood, { z: [10, -30], tear: [-8, -68] })}
    ${momentArt(moment, options.text ?? "", { mouth: [100, 106], badgeDy: -16, xpDy: -42, heartDy: -34 })}
  </svg>`;
}

export const bearCss = css`
  /* A bear is heavy: it only squashes a third as much as the slime. */
  .bear {
    --k: 0.3;
  }
  .ear,
  .foot {
    transform-box: fill-box;
  }
  .ear {
    transform-origin: 50% 70%;
    animation: ear-twitch 9s ease-in-out infinite;
  }
  .earR {
    animation-delay: 3.5s;
  }
  @keyframes ear-twitch {
    0%,
    90%,
    100% {
      transform: rotate(0deg);
    }
    93% {
      transform: rotate(-9deg);
    }
    96% {
      transform: rotate(4deg);
    }
  }
  .bear.hibernating .ear,
  .bear.sad .ear {
    animation: none;
  }
`;
