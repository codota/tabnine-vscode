import { MarkdownString } from "vscode";
import { FULL_BRAND_REPRESENTATION, IS_OSX } from "../globals/consts";

const space = "&nbsp;&nbsp;&nbsp;";
const altKey = IS_OSX ? "\u2325" : "alt";
const hoverPopupContent = `[Next \\(${altKey}\\]\\)](command:tabnine.next-inline-suggestion)${space}[Prev \\(${altKey}\\[\\)](command:tabnine.prev-inline-suggestion)${space}[Accept \\(tab\\)](command:tabnine.accept-inline-suggestion)${space}[Escape \\(esc\\)](command:tabnine.escape-inline-suggestion)${space}${FULL_BRAND_REPRESENTATION}`;

const hoverPopup =  new MarkdownString(hoverPopupContent, true);
hoverPopup.isTrusted = true;

export default hoverPopup;
