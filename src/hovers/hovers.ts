import {
  commands,
  DecorationOptions,
  Disposable,
  ExtensionContext,
  languages,
  MarkdownString,
  Position,
  Range,
  Uri,
  window,
  workspace,
} from "vscode";
import * as path from "path";
import { getHover, Hover, sendHoverAction } from "../binary/requests/hovers";
import { LOGO_BY_THEME, StatePayload } from "../consts";
import setState from "../binary/requests/setState";

const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 1rem" },
});

let currentHover: Hover | null | undefined = null;
let decoration: DecorationOptions | null;
let decorationsDebounce: NodeJS.Timeout;
let hoverActionsDisposable: Disposable[];

languages.registerHoverProvider(
  { pattern: "**" },
  {
    provideHover(_document, position) {
      return handleHoverShown(position);
    },
  }
);

function handleHoverShown(position: Position) {
  if (currentHover && decoration?.range.contains(position)) {
    void setState({
      [StatePayload.HOVER_SHOWN]: {
        id: currentHover.id,
        text: currentHover.message,
        notification_type: currentHover.notification_type,
      },
    });
  }
  return null;
}

export default async function setHover(
  context: ExtensionContext,
  position: Position
): Promise<void> {
  currentHover = await getHover();

  if (currentHover?.message) {
    registerHoverCommands(currentHover, context);
    makeTextDecoration(position, context, currentHover);
    showDecoration();
  }
}

function makeTextDecoration(
  position: Position,
  context: ExtensionContext,
  hover: Hover
) {
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
}

function getMarkdownMessage(context: ExtensionContext, message: string) {
  const fileUri = getLogoPath(context);
  const template = `[![tabnine](${fileUri}|width=100)](https://www.tabnine.com/pricing/buy)  \n${message}`;
  const markdown = new MarkdownString(template, true);
  markdown.isTrusted = true;
  return markdown;
}

function getLogoPath(context: ExtensionContext) {
  return Uri.file(
    path.join(
      context.extensionPath,
      LOGO_BY_THEME[window.activeColorTheme.kind]
    )
  ).toString();
}

function registerHoverCommands(hover: Hover, context: ExtensionContext) {
  hoverActionsDisposable?.forEach((a) => !!a.dispose());
  hoverActionsDisposable = [];
  hover.options.forEach((option) => {
    const hoverAction = commands.registerCommand(option.key, () => {
      void sendHoverAction(
        hover.id,
        option.actions,
        hover.notification_type,
        hover.state
      );
    });
    hoverActionsDisposable.push(hoverAction);
    context.subscriptions.push(hoverAction);
  });
}
function showDecoration(delay = 10) {
  clearTimeout(decorationsDebounce);
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
