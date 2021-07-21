import { MarkdownString } from "vscode";
import {
  ACCEPT_INLINE_COMMAND,
  ESCAPE_INLINE_COMMAND,
  FULL_BRAND_REPRESENTATION,
  IS_OSX,
  NEXT_INLINE_COMMAND,
  PREV_INLINE_COMMAND,
} from "../globals/consts";

const space = "&nbsp;&nbsp;&nbsp;";
const altKey = IS_OSX ? "\u2325" : "alt";
const nextAction = `[Next \\(${altKey}\\]\\)](command:${NEXT_INLINE_COMMAND})`;
const prevAction = `[Prev \\(${altKey}\\[\\)](command:${PREV_INLINE_COMMAND})`;
const acceptAction = `[Accept \\(Tab\\)](command:${ACCEPT_INLINE_COMMAND})`;
const escapeAction = `[Escape \\(Esc\\)](command:${ESCAPE_INLINE_COMMAND})`;

const hoverPopupContent = `${nextAction}${space}${prevAction}${space}${acceptAction}${space}${escapeAction}${space}${FULL_BRAND_REPRESENTATION}`;

const hoverPopup = new MarkdownString(hoverPopupContent, true);
hoverPopup.isTrusted = true;

export default hoverPopup;
