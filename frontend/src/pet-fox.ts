import { css, svg, type SVGTemplateResult } from "lit";
import { extras, scarfArt } from "./pet-kit";
import { momentArt, workArms, workBehind, workFront, type Activity, type Hands, type Moment } from "./pet-work";
import type { Mood } from "./types";

/**
 * The fox: a bright orange fox with tall pointed ears, a cream face mask with cheek tufts, dark
 * socks and a big bushy tail with a cream tip. Built on the same kit as the other pets.
 */

const INK = "#3B2A3F";
const ORANGE = "var(--fur, #F28A30)"; // --fur: the fur colour the pet wears (see furStyle in pet-kit)
const ORANGE_DARK = "var(--fur-dark, #D96E1B)";
const NECK = { x: 100, y: 118, w: 56 }; // where a scarf goes
const CREAM = "#F6EDD6";
const SOCK = "#4B2E3A";
const TONGUE = "#FF6B8A";

const HANDS: Hands = {
  color: ORANGE,
  thick: 1.4,
  shoulders: { l: [80, 130], r: [120, 130] },
  armD: { l: "M78 130 C40 130 16 152 22 180", r: "M122 130 C160 132 176 154 170 176" },
  typingBehind: true,
  codeAt: [66, 34],
};

const BODY = "M70 182 C64 160 66 132 78 118 C86 108 114 108 122 118 C134 132 136 160 130 182 Z";
// The head has pointed cheek tufts at both sides.
const HEAD =
  "M100 44 C124 44 146 52 154 68 L162 90 C142 102 128 116 100 124 C72 116 58 102 38 90 L46 68 C54 52 76 44 100 44 Z";
// The cream mask: from the cheek tufts, dipping to a V in the middle, down to the chin.
const MASK = "M38 90 C60 98 82 82 100 100 C118 82 140 98 162 90 C142 102 128 116 100 124 C72 116 58 102 38 90 Z";
// A big bushy tail that sweeps out and up, with a cream tip.
const TAIL =
  "M120 186 C162 194 198 164 192 122 C188 92 170 74 154 84 C146 96 158 108 160 124 C162 148 146 166 120 168 Z";

function eyes(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "happy":
      return svg`<path d="M70 84 Q78 72 86 84" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M114 84 Q122 72 130 84" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sleepy":
      return svg`<path d="M71 81 Q78 86 85 81" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M115 81 Q122 86 129 81" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`<path d="M71 79 Q78 88 85 79" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M115 79 Q122 88 129 79" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sad":
      return svg`<g class="eyes">
          <g class="eye"><ellipse cx="78" cy="82" rx="6" ry="7.6" fill=${INK}/><circle cx="76" cy="78.8" r="2.3" fill="#fff"/><circle cx="80.2" cy="85.4" r="1.1" fill="#fff"/></g>
          <g class="eye"><ellipse cx="122" cy="82" rx="6" ry="7.6" fill=${INK}/><circle cx="120" cy="78.8" r="2.3" fill="#fff"/><circle cx="124.2" cy="85.4" r="1.1" fill="#fff"/></g>
        </g>
        <path d="M68 70 L87 64" stroke=${INK} stroke-width="3.4" stroke-linecap="round"/>
        <path d="M132 70 L113 64" stroke=${INK} stroke-width="3.4" stroke-linecap="round"/>`;
    default:
      return svg`<g class="eyes look">
        <g class="eye"><circle cx="78" cy="80" r="6.6" fill=${INK}/><circle cx="80.2" cy="77.4" r="2.4" fill="#fff"/><circle cx="75.8" cy="83" r="1.2" fill="#fff"/></g>
        <g class="eye"><circle cx="122" cy="80" r="6.6" fill=${INK}/><circle cx="124.2" cy="77.4" r="2.4" fill="#fff"/><circle cx="119.8" cy="83" r="1.2" fill="#fff"/></g>
      </g>`;
  }
}

function cheeks(mood: Mood): SVGTemplateResult {
  const opacity = mood === "sad" || mood === "hibernating" ? 0.4 : 0.7;
  return svg`<ellipse cx="66" cy="97" rx="7" ry="4.4" fill="#FFA08A" opacity=${opacity}/>
    <ellipse cx="134" cy="97" rx="7" ry="4.4" fill="#FFA08A" opacity=${opacity}/>`;
}

function mouth(mood: Mood): SVGTemplateResult {
  const line = svg`<path d="M100 109 V112" stroke=${INK} stroke-width="3" stroke-linecap="round"/>`;
  switch (mood) {
    case "happy":
      return svg`${line}<path d="M92 112 Q100 126 108 112 Z" fill=${INK} stroke=${INK} stroke-width="3" stroke-linejoin="round"/>
        <path d="M96 118 Q100 114 104 118 Q100 123 96 118 Z" fill=${TONGUE}/>`;
    case "sleepy":
      return svg`${line}<ellipse cx="100" cy="117" rx="3.4" ry="2.8" fill=${INK}/>`;
    case "sad":
      return svg`${line}<path d="M93 119 Q100 112 107 119" fill="none" stroke=${INK} stroke-width="3.4" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`${line}<path d="M95 115 Q100 119 105 115" fill="none" stroke=${INK} stroke-width="3.2" stroke-linecap="round"/>`;
    default:
      return svg`${line}<path d="M92 114 Q96 120 100 112 Q104 120 108 114" fill="none" stroke=${INK} stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

function sleepBubble(mood: Mood): SVGTemplateResult {
  if (mood !== "hibernating") return svg``;
  return svg`<g class="snore"><circle cx="113" cy="108" r="7" fill="#FFF1DD" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="105.5" r="1.8" fill="#fff"/></g>`;
}

export interface FoxOptions {
  activity?: Activity;
  moment?: Moment;
  text?: string;
  /** The colour of a scarf the pet wears (none = no scarf). */
  neck?: string;
}

export function foxSvg(mood: Mood, options: FoxOptions = {}): SVGTemplateResult {
  const activity = options.activity ?? "";
  const moment = options.moment ?? "";
  mood = activity ? "content" : mood; // busy: no sleepy or sad face
  return svg`<svg class="pet-art fox ${mood} ${activity ? `work ${activity}` : ""} ${moment}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="fox-body-clip"><path d=${BODY}/></clipPath>
      <clipPath id="fox-head-clip"><path d=${HEAD}/></clipPath>
      <clipPath id="fox-tail-clip"><path d=${TAIL}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="56" ry="8" fill="#000" opacity="0.22"/>
    ${workBehind(activity)} ${workArms(activity, HANDS)}
    <g class="jelly">
      <g class="tail">
        <path d=${TAIL} fill=${ORANGE}/>
        <g clip-path="url(#fox-tail-clip)">
          <circle cx="166" cy="86" r="20" fill=${CREAM}/>
          <path d="M120 188 C166 196 200 164 194 122" fill="none" stroke=${ORANGE_DARK} stroke-width="9" opacity="0.5"/>
        </g>
        <path d=${TAIL} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      </g>
      <g class="ear earL"><path d="M56 64 L50 18 C64 20 84 34 92 50 Z" fill=${ORANGE} stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
        <path d="M60 54 L57 30 C66 34 76 42 80 50 Z" fill=${SOCK}/></g>
      <g class="ear earR"><path d="M144 64 L150 18 C136 20 116 34 108 50 Z" fill=${ORANGE} stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
        <path d="M140 54 L143 30 C134 34 124 42 120 50 Z" fill=${SOCK}/></g>
      <path d=${BODY} fill=${ORANGE}/>
      <g clip-path="url(#fox-body-clip)">
        <ellipse cx="100" cy="196" rx="70" ry="26" fill=${ORANGE_DARK} opacity="0.5"/>
        <path d="M86 110 Q100 132 114 110 L118 170 Q100 178 82 170 Z" fill=${CREAM}/>
      </g>
      <path d=${BODY} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      ${activity ? svg`` : svg`<path d="M97 144 V166 M103 144 V166" stroke=${INK} stroke-width="3" stroke-linecap="round"/>`}
      <ellipse cx="86" cy="180" rx="13" ry="7.5" fill=${SOCK} stroke=${INK} stroke-width="4"/>
      <ellipse cx="114" cy="180" rx="13" ry="7.5" fill=${SOCK} stroke=${INK} stroke-width="4"/>
      ${scarfArt(options.neck, NECK)}
      <path d=${HEAD} fill=${ORANGE}/>
      <g clip-path="url(#fox-head-clip)">
        <path d=${MASK} fill=${CREAM}/>
      </g>
      <path d=${HEAD} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      ${cheeks(mood)} ${eyes(mood)}
      <ellipse cx="100" cy="105" rx="6.4" ry="4.6" fill=${INK}/>
      <ellipse cx="98" cy="103.4" rx="1.9" ry="1" fill="#fff" opacity="0.7"/>
      ${moment === "wake" ? svg`<path d="M100 109 V112" stroke=${INK} stroke-width="3" stroke-linecap="round"/>` : mouth(mood)}
      ${sleepBubble(mood)}
    </g>
    ${workFront(activity, HANDS)}
    ${activity ? svg`` : extras(mood, { z: [14, -30], tear: [-8, -60] })}
    ${momentArt(moment, options.text ?? "", { mouth: [100, 118], badgeDy: -16, xpDy: -46, heartDy: -44 })}
  </svg>`;
}

export const foxCss = css`
  /* A fox is light and quick: it squashes a bit less than the slime. */
  .fox {
    --k: 0.4;
  }
  .fox .ear,
  .fox .tail {
    transform-box: fill-box;
  }
  .fox .ear {
    transform-origin: 50% 100%;
    animation: fox-ear 7s ease-in-out infinite;
  }
  .fox .earR {
    animation-delay: 3s;
  }
  @keyframes fox-ear {
    0%,
    88%,
    100% {
      transform: rotate(0deg);
    }
    91% {
      transform: rotate(-8deg);
    }
    94% {
      transform: rotate(3deg);
    }
  }
  .fox .tail {
    transform-origin: 0% 90%;
    animation: fox-sway 3s ease-in-out infinite alternate;
  }
  .fox.happy .tail {
    animation-duration: 0.9s;
  }
  .fox.work .tail {
    animation-duration: 1.4s;
  }
  .fox.sleepy .tail,
  .fox.hibernating .tail,
  .fox.sad .tail {
    animation: none;
  }
  .fox.sad .ear,
  .fox.sleepy .ear,
  .fox.hibernating .ear {
    animation: none;
  }
  .fox.sad .earL {
    transform: rotate(-10deg);
  }
  .fox.sad .earR {
    transform: rotate(10deg);
  }
  @keyframes fox-sway {
    from {
      transform: rotate(-6deg);
    }
    to {
      transform: rotate(6deg);
    }
  }
`;
