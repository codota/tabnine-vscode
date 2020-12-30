import {
  commands,
  DecorationOptions,
  Disposable,
  ExtensionContext,
  MarkdownString,
  Position,
  Range,
  window,
  workspace,
} from "vscode";
import { getHover, Hover, sendHoverAction } from "../binary/requests/hovers";
import { HOVER_ACTION_COMMAND } from "../consts";

let decoration: DecorationOptions;
const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 1rem" },
});

let decorationsDebounce: NodeJS.Timeout;
let hoverActionsCommandDisposable: Disposable;

export default async function setHover(
  context: ExtensionContext,
  position: Position
): Promise<void> {
  const hover = await getHover();

  if (hover?.message) {
    
    handleHoverCommand(hover, context);

    const markdown = new MarkdownString(hover?.message, true);
    markdown.isTrusted = true;
    decoration = {
      renderOptions: {
        after: {
          contentText: hover.title,
          color: "gray",
        },
      },
      range: new Range(
        new Position(position.line, position.character + 10),
        new Position(position.line, 1024)
      ),
      hoverMessage: markdown,
    };
    refreshDecorations();
  }
}

function handleHoverCommand(hover: Hover, context: ExtensionContext) {
  hoverActionsCommandDisposable?.dispose();
  hoverActionsCommandDisposable = commands.registerCommand(
    HOVER_ACTION_COMMAND,
    () => {
      void sendHoverAction(hover.id, hover.actions, hover.notification_type, hover.state);
    }
  );
  context.subscriptions.push(hoverActionsCommandDisposable);
}
function refreshDecorations(delay = 10) {
  clearTimeout(decorationsDebounce);
  decorationsDebounce = setTimeout(
    () => window.activeTextEditor?.setDecorations(decorationType, [decoration]),
    delay
  );
}
workspace.onDidChangeTextDocument(() => {
  window.activeTextEditor?.setDecorations(decorationType, []);
});
