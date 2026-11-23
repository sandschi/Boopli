import { css, svg, type SVGTemplateResult } from "lit";
import { extras } from "./pet-kit";
import { momentArt, workArms, workBehind, workFront, type Activity, type Hands, type Moment } from "./pet-work";
import type { Mood } from "./types";

/**
 * The dog: a happy orange puppy with big floppy brown ears, a cream face and chest, pink cheeks,
 * white paws and a curled, wagging tail. Built on the same kit as the slime and the bear.
 */

const INK = "#2F2E5C";
const ORANGE = "#F9A03B";
const ORANGE_DARK = "#E0821F";
const CREAM = "#FFF4E2";
const EAR = "#9C6A57";
const EAR_LIGHT = "#B8826C";
const PINK = "#FF8FA3";
const TONGUE = "#FF6B8A";

const HANDS: Hands = {
  color: ORANGE,
  thick: 1.4,
  shoulders: { l: [80, 130], r: [120, 130] },
  armD: { l: "M78 130 C40 130 16 152 22 180", r: "M122 130 C160 132 176 154 170 176" },
  typingBehind: true,
  codeAt: [66, 34],
};

// A big, fluffy tail that sweeps out to the side and curls up and over, with a cream tip.
const TAIL =
  "M122 185 C158 190 186 168 184 136 C183 108 154 98 141 115 C133 128 143 137 151 141 C156 147 150 163 137 167 C129 169 121 167 115 163 Z";

const BODY = "M72 182 C66 160 68 130 78 116 C86 106 114 106 122 116 C132 130 134 160 128 182 Z";
const HEAD = "M50 80 C50 54 72 40 100 40 C128 40 150 54 150 80 C150 106 128 118 100 118 C72 118 50 106 50 80 Z";
// The cream lower face: it starts as a soft curve across the cheeks.
const FACE = "M51 82 Q100 62 149 82 C150 106 128 118 100 118 C72 118 50 106 51 82 Z";

function eyes(mood: Mood): SVGTemplateResult {
  switch (mood) {
    case "happy":
      return svg`<path d="M73 85 Q82 72 91 85" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M109 85 Q118 72 127 85" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sleepy":
      return svg`<path d="M74 82 Q82 87 90 82" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M110 82 Q118 87 126 82" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`<path d="M74 80 Q82 89 90 80" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>
        <path d="M110 80 Q118 89 126 80" fill="none" stroke=${INK} stroke-width="4.5" stroke-linecap="round"/>`;
    case "sad":
      return svg`<g class="eyes">
          <g class="eye"><ellipse cx="82" cy="83" rx="6.6" ry="8.2" fill=${INK}/><circle cx="79.8" cy="79.5" r="2.5" fill="#fff"/><circle cx="84.4" cy="86.5" r="1.2" fill="#fff"/></g>
          <g class="eye"><ellipse cx="118" cy="83" rx="6.6" ry="8.2" fill=${INK}/><circle cx="115.8" cy="79.5" r="2.5" fill="#fff"/><circle cx="120.4" cy="86.5" r="1.2" fill="#fff"/></g>
        </g>
        <path d="M72 71 L91 65" stroke=${INK} stroke-width="3.6" stroke-linecap="round"/>
        <path d="M128 71 L109 65" stroke=${INK} stroke-width="3.6" stroke-linecap="round"/>`;
    default:
      return svg`<g class="eyes look">
        <g class="eye"><circle cx="82" cy="82" r="7.4" fill=${INK}/><circle cx="84.6" cy="79" r="2.7" fill="#fff"/><circle cx="79.6" cy="85" r="1.3" fill="#fff"/></g>
        <g class="eye"><circle cx="118" cy="82" r="7.4" fill=${INK}/><circle cx="120.6" cy="79" r="2.7" fill="#fff"/><circle cx="115.6" cy="85" r="1.3" fill="#fff"/></g>
      </g>`;
  }
}

function cheeks(mood: Mood): SVGTemplateResult {
  const opacity = mood === "sad" || mood === "hibernating" ? 0.55 : 0.9;
  return svg`<ellipse cx="65" cy="98" rx="10" ry="7" fill=${PINK} opacity=${opacity}/>
    <ellipse cx="135" cy="98" rx="10" ry="7" fill=${PINK} opacity=${opacity}/>`;
}

function mouth(mood: Mood): SVGTemplateResult {
  const line = svg`<path d="M100 97 V101" stroke=${INK} stroke-width="3" stroke-linecap="round"/>`;
  switch (mood) {
    case "happy":
      return svg`${line}<path d="M88 101 Q100 122 112 101 Z" fill=${INK} stroke=${INK} stroke-width="3.2" stroke-linejoin="round"/>
        <path d="M94 112 Q100 104 106 112 Q100 119 94 112 Z" fill=${TONGUE}/>`;
    case "sleepy":
      return svg`${line}<ellipse cx="100" cy="106" rx="3.6" ry="3" fill=${INK}/>`;
    case "sad":
      return svg`${line}<path d="M91 110 Q100 101 109 110" fill="none" stroke=${INK} stroke-width="3.6" stroke-linecap="round"/>`;
    case "hibernating":
      return svg`${line}<path d="M94 104 Q100 108 106 104" fill="none" stroke=${INK} stroke-width="3.4" stroke-linecap="round"/>`;
    default:
      return svg`${line}<path d="M90 102 Q95 109 100 101 Q105 109 110 102" fill="none" stroke=${INK} stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
}

function sleepBubble(mood: Mood): SVGTemplateResult {
  if (mood !== "hibernating") return svg``;
  return svg`<g class="snore"><circle cx="112" cy="97" r="7" fill="#FFF1DD" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="109.5" cy="94.5" r="1.8" fill="#fff"/></g>`;
}

export interface DogOptions {
  activity?: Activity;
  moment?: Moment;
  text?: string;
}

export function dogSvg(mood: Mood, options: DogOptions = {}): SVGTemplateResult {
  const activity = options.activity ?? "";
  const moment = options.moment ?? "";
  mood = activity ? "content" : mood; // busy: no sleepy or sad face
  return svg`<svg class="pet-art dog ${mood} ${activity ? `work ${activity}` : ""} ${moment}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <clipPath id="dog-body-clip"><path d=${BODY}/></clipPath>
      <clipPath id="dog-tail-clip"><path d=${TAIL}/></clipPath>
      <clipPath id="dog-head-clip"><path d=${HEAD}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="56" ry="8" fill="#000" opacity="0.22"/>
    ${workBehind(activity)} ${workArms(activity, HANDS)}
    <g class="jelly">
      <g class="tail">
        <path d=${TAIL} fill=${ORANGE}/>
        <g clip-path="url(#dog-tail-clip)">
          <circle cx="158" cy="118" r="15" fill=${CREAM}/>
          <path d="M122 182 C150 182 168 168 170 150" fill="none" stroke=${ORANGE_DARK} stroke-width="8" opacity="0.45"/>
        </g>
        <path d=${TAIL} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      </g>
      <g class="ear earL"><path d="M64 50 C44 40 24 56 26 86 C27 100 42 104 50 92 C58 80 66 66 64 50 Z" fill=${EAR} stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
        <path d="M44 56 C34 62 32 78 36 90" fill="none" stroke=${EAR_LIGHT} stroke-width="4" stroke-linecap="round" opacity="0.7"/></g>
      <g class="ear earR"><path d="M136 50 C156 40 176 56 174 86 C173 100 158 104 150 92 C142 80 134 66 136 50 Z" fill=${EAR} stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
        <path d="M156 56 C166 62 168 78 164 90" fill="none" stroke=${EAR_LIGHT} stroke-width="4" stroke-linecap="round" opacity="0.7"/></g>
      <path d=${BODY} fill=${ORANGE}/>
      <g clip-path="url(#dog-body-clip)">
        <ellipse cx="100" cy="196" rx="70" ry="26" fill=${ORANGE_DARK} opacity="0.5"/>
        <path d="M86 108 Q100 130 114 108 L118 170 Q100 178 82 170 Z" fill=${CREAM}/>
      </g>
      <path d=${BODY} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      ${activity ? svg`` : svg`<path d="M97 140 V178 M103 140 V178" stroke=${INK} stroke-width="3" stroke-linecap="round"/>`}
      <ellipse cx="86" cy="180" rx="13" ry="7.5" fill="#fff" stroke=${INK} stroke-width="4"/>
      <ellipse cx="114" cy="180" rx="13" ry="7.5" fill="#fff" stroke=${INK} stroke-width="4"/>
      <path d=${HEAD} fill=${ORANGE}/>
      <g clip-path="url(#dog-head-clip)">
        <path d=${FACE} fill=${CREAM}/>
        <ellipse cx="100" cy="53" rx="7" ry="4" fill="#FFD9A0"/>
      </g>
      <path d=${HEAD} fill="none" stroke=${INK} stroke-width="4" stroke-linejoin="round"/>
      ${cheeks(mood)} ${eyes(mood)}
      <ellipse cx="100" cy="93" rx="6" ry="4.4" fill=${INK}/>
      <ellipse cx="98" cy="91.6" rx="1.8" ry="1" fill="#fff" opacity="0.7"/>
      ${moment === "wake" ? svg`<path d="M100 97 V101" stroke=${INK} stroke-width="3" stroke-linecap="round"/>` : mouth(mood)}
      ${sleepBubble(mood)}
    </g>
    ${workFront(activity, HANDS)}
    ${activity ? svg`` : extras(mood, { z: [10, -30], tear: [-8, -58] })}
    ${momentArt(moment, options.text ?? "", { mouth: [100, 110], badgeDy: -14, xpDy: -42, heartDy: -40 })}
  </svg>`;
}

export const dogCss = css`
  /* A puppy is lively: it squashes about half as much as the slime. */
  .dog {
    --k: 0.5;
  }
  .dog .ear,
  .dog .tail {
    transform-box: fill-box;
  }
  .dog .earL {
    transform-origin: 90% 10%;
    animation: ear-flop-l 6s ease-in-out infinite;
  }
  .dog .earR {
    transform-origin: 10% 10%;
    animation: ear-flop-r 6s ease-in-out 2s infinite;
  }
  @keyframes ear-flop-l {
    0%,
    80%,
    100% {
      transform: rotate(0deg);
    }
    88% {
      transform: rotate(7deg);
    }
    94% {
      transform: rotate(-3deg);
    }
  }
  @keyframes ear-flop-r {
    0%,
    80%,
    100% {
      transform: rotate(0deg);
    }
    88% {
      transform: rotate(-7deg);
    }
    94% {
      transform: rotate(3deg);
    }
  }
  .dog .tail {
    transform-origin: 0% 90%;
    animation: wag 2.4s ease-in-out infinite alternate;
  }
  .dog.happy .tail {
    animation-duration: 0.45s;
  }
  .dog.work .tail {
    animation-duration: 0.9s;
  }
  .dog.sleepy .tail,
  .dog.hibernating .tail,
  .dog.sad .tail {
    animation: none;
  }
  .dog.sad .earL {
    animation: none;
    transform: rotate(8deg);
  }
  .dog.sad .earR {
    animation: none;
    transform: rotate(-8deg);
  }
  .dog.hibernating .earL,
  .dog.hibernating .earR,
  .dog.sleepy .earL,
  .dog.sleepy .earR {
    animation: none;
  }
  @keyframes wag {
    from {
      transform: rotate(-9deg);
    }
    to {
      transform: rotate(9deg);
    }
  }
`;
