// What counts as a text a person would read when it is written as a "string literal".
export const KEYBOARD_AND_NAMES = /^(Home|End|Enter|Escape|Tab|Space|Arrow\w+|Backspace|Delete|Shift|Control|Alt|Meta|Itim|Roboto|Click|Mon|Tue|Wed|Thu|Fri|Sat|Sun|Boopli)$/;

export function looksTranslatable(v) {
  if (v.length < 4 || /\s$/.test(v) || KEYBOARD_AND_NAMES.test(v)) return false;
  if (/^[A-Z][A-Z ]{5,}$/.test(v)) return true; // AWAY MODE IS ON
  if (!/^[A-Z]/.test(v) || !/[a-z]/.test(v)) return false;
  if (/[_{}<>=\\]|https?:|\.\w{2,4}$/.test(v)) return false; // ids, addresses, file names, markup
  return /^[A-Z][A-Za-z'’]*[:,.]?( [\w'’,.!?:;…()\/%+-]+)*$/.test(v);
}
