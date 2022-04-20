import { MarkdownString } from "vscode";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import {
  ACCEPT_INLINE_COMMAND,
  ESCAPE_INLINE_COMMAND,
  FULL_BRAND_REPRESENTATION,
  IS_OSX,
  NEXT_INLINE_COMMAND,
  PREV_INLINE_COMMAND,
} from "../globals/consts";
import { getCurrentSuggestion } from "./inlineSuggestionState";

const space = "&nbsp;&nbsp;&nbsp;";
const altKey = IS_OSX ? "\u2325" : "alt";
const nextAction = `[Next \\(${altKey}\\]\\)](command:${NEXT_INLINE_COMMAND})`;
const prevAction = `[Prev \\(${altKey}\\[\\)](command:${PREV_INLINE_COMMAND})`;
const acceptAction = `[Accept \\(Tab\\)](command:${ACCEPT_INLINE_COMMAND})`;
const escapeAction = `[Escape \\(Esc\\)](command:${ESCAPE_INLINE_COMMAND})`;

const hoverPopupContent = `${nextAction}${space}${prevAction}${space}${acceptAction}${space}${escapeAction}${space}${FULL_BRAND_REPRESENTATION}`;

const hoverPopup = new MarkdownString(hoverPopupContent, true);
hoverPopup.isTrusted = true;

export default function getHoverContent(): MarkdownString {
  const content = tryGetAlphaDebugContent() ?? hoverPopupContent;
  const hover = new MarkdownString(content, true);
  hover.isTrusted = true;
  return hover;
}
function tryGetAlphaDebugContent(): string | null {
  if (isCapabilityEnabled(Capability.ALPHA_CAPABILITY)) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { completion_kind = "none", origin = "none" } =
      getCurrentSuggestion() ?? {};
    return `context - origin: ${origin} - kind: ${completion_kind}`;
  }
  return null;
}
