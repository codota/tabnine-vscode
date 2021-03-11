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
import { getLogoPath } from "../consts";

const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 1rem" },
});

let decoration: DecorationOptions | null | undefined;
let decorationsDebounce: NodeJS.Timeout | null | undefined;

export default function showTextDecoration(
  position: Position,
  context: ExtensionContext,
  hover: Hover
): void {
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
    hoverMessage: getMarkdownMessage(context, hover.message),
  };
  renderDecoration();
}

export function isDecorationContains(position: Position): boolean {
  return !!decoration?.range.contains(position);
}

function getMarkdownMessage(context: ExtensionContext, message: string) {
  const fileUri = getLogoPath(context);
  const template = message
    ? `[![tabnine](${fileUri}|width=100)](https://www.tabnine.com)  \n${message}`
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
}
