import {
  DecorationOptions,
  ExtensionContext,
  MarkdownString,
  Position,
  Range,
  window,
  workspace,
} from "vscode";
import { Hover } from "../binary/requests/hovers";
import setState from "../binary/requests/setState";
import { StatePayload } from "../globals/consts";
import { getLogoPath } from "../utils/logo.utils";

const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 1rem" },
});

let decoration: DecorationOptions | null | undefined;
let decorationsDebounce: NodeJS.Timeout | null | undefined;
let currentHover: Hover | null | undefined;

export function getCurrentHover(): Hover | null | undefined {
  return currentHover;
}

export default function showTextDecoration(
  position: Position,
  context: ExtensionContext,
  hover: Hover
): void {
  currentHover = hover;
  decoration = {
    renderOptions: {
      after: {
        contentText: hover.title,
        color: "gray",
      },
    },
    range: new Range(
      new Position(position.line, position.character),
      new Position(position.line, 1024)
    ),
    hoverMessage: getMarkdownMessage(context, hover),
  };
  renderDecoration();
  void setState({
    [StatePayload.HINT_SHOWN]: {
      id: hover.id,
      text: hover.title,
      notification_type: hover.notification_type,
      state: null,
    },
  });
}

export function isDecorationContains(position: Position): boolean {
  return !!decoration?.range.contains(position);
}

function getMarkdownMessage(context: ExtensionContext, hover: Hover) {
  const fileUri = getLogoPath(context);
  const actionKey = hover.options[0]?.key;
  const logoAction = actionKey
    ? `command:${actionKey}`
    : "https://www.tabnine.com";

  const template = hover.message
    ? `[![tabnine](${fileUri}|width=100)](${logoAction})  \n${hover.message}`
    : "";
  const markdown = new MarkdownString(template, true);
  markdown.isTrusted = true;
  return markdown;
}

function renderDecoration(delay = 10) {
  if (decorationsDebounce) {
    clearTimeout(decorationsDebounce);
  }
  decorationsDebounce = setTimeout(
    () =>
      decoration &&
      window.activeTextEditor?.setDecorations(decorationType, [decoration]),
    delay
  );
}

workspace.onDidChangeTextDocument(() => clearDecoration());

function clearDecoration() {
  window.activeTextEditor?.setDecorations(decorationType, []);
  decoration = null;
  currentHover = null;
}
