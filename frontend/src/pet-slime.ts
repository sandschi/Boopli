import { svg, type SVGTemplateResult } from "lit";
import { extras, scarfArt } from "./pet-kit";
import { momentArt, workArms, workBehind, workFront, type Activity, type Hands, type Moment } from "./pet-work";
import type { Mood } from "./types";

/**
 * The slime: a round, glossy neon green jelly with a thick outline, drawn in code and animated
 * with CSS. One drawing, five moods: the face, the extras and the way it moves change.
 *
 * Only `transform` and `opacity` are animated, so it is cheap for a phone or a wall tablet.
 * The jelly squashes and stretches from its bottom, so it always stays on the floor.
 */

const INK = "#101010";
/** The slime has no limbs: its "hands" are small jelly arms in the same green. */
const NECK = { x: 100, y: 167, w: 96 }; // where a scarf goes
const SLIME_HANDS: Hands = { color: "var(--fur-lt, #4DFF2B)", thick: 1, typingBehind: true };

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


/** The little bubble a sleeping slime blows. */
function sleepBubble(mood: Mood): SVGTemplateResult {
  if (mood !== "hibernating") return svg``;
  return svg`<g class="snore"><circle cx="113" cy="152" r="7" fill="#D8FFE2" fill-opacity="0.55" stroke="#fff" stroke-width="2"/><circle cx="110.5" cy="149.5" r="1.8" fill="#fff"/></g>`;
}

export interface SlimeOptions {
  /** What it is busy with: the housework routine or typing. Then it shows its content face. */
  activity?: Activity;
  /** A one-shot moment that is playing now. */
  moment?: Moment;
  /** The words of a moment: "Level 6!" or "+10 XP". */
  text?: string;
  /** The colour of a scarf the pet wears (none = no scarf). */
  neck?: string;
}

export function slimeSvg(mood: Mood, options: SlimeOptions = {}): SVGTemplateResult {
  const activity = options.activity ?? "";
  const moment = options.moment ?? "";
  const face: Mood = activity ? "content" : mood; // busy: no sleepy or sad face
  mood = face;
  return svg`<svg class="pet-art slime ${mood} ${activity ? `work ${activity}` : ""} ${moment}" viewBox="0 0 200 200" aria-hidden="true">
    <defs>
      <radialGradient id="slime-fill" cx="0.36" cy="0.3" r="0.9">
        <stop offset="0" stop-color="var(--fur-hi, #D4FFC2)"/>
        <stop offset="0.28" stop-color="var(--fur-lt, #7CFF5B)"/>
        <stop offset="0.62" stop-color="var(--fur, #39FF14)"/>
        <stop offset="1" stop-color="var(--fur-dark, #10B83A)"/>
      </radialGradient>
      <clipPath id="slime-clip"><path d=${BODY}/></clipPath>
    </defs>
    <ellipse class="shadow" cx="100" cy="187" rx="58" ry="8" fill="#000" opacity="0.22"/>
    <ellipse class="puddle" cx="100" cy="184" rx="66" ry="9" fill="var(--fur, #39FF14)" opacity="0.35"/>
    ${workBehind(activity)} ${workArms(activity, SLIME_HANDS)}
    <g class="jelly">
      <path class="body" d=${BODY} fill="url(#slime-fill)"/>
      <g clip-path="url(#slime-clip)">
        <ellipse cx="100" cy="196" rx="84" ry="34" fill="var(--fur-deep, #047A28)" opacity="0.38"/>
        <ellipse cx="160" cy="132" rx="14" ry="48" fill="#fff" opacity="0.13"/>
        <circle class="bubble b1" cx="146" cy="168" r="6" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.8"/>
        <circle class="bubble b2" cx="132" cy="176" r="3" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.5"/>
        <circle class="bubble b3" cx="54" cy="172" r="4" fill="#fff" fill-opacity="0.1" stroke="#fff" stroke-opacity="0.38" stroke-width="1.6"/>
      </g>
      <path class="body-line" d=${BODY} fill="none" stroke=${INK} stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="76" cy="100" rx="17" ry="9" transform="rotate(-32 76 100)" fill="#fff" opacity="0.4"/>
      <path d="M50 128 C49 108 60 92 78 86" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity="0.7"/>
      <circle cx="49" cy="143" r="3.6" fill="#fff" opacity="0.65"/>
      ${cheeks(mood)} ${eyes(mood)}
      ${moment === "wake" ? svg`` : mouth(mood)} ${sleepBubble(mood)}
      ${scarfArt(options.neck, NECK)}
    </g>
    ${workFront(activity, SLIME_HANDS)}
    ${activity ? svg`` : extras(mood)}
    ${momentArt(moment, options.text ?? "")}
  </svg>`;
}
