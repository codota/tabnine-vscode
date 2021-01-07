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

let decoration: DecorationOptions | null;
const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 1rem" },
});
let currentHover: Hover | null | undefined = null;

let decorationsDebounce: NodeJS.Timeout;
let hoverActionsDisposable: Disposable[];

languages.registerHoverProvider(
  { pattern: "**" },
  {
    provideHover(_document, position) {
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
    },
  }
);

export default async function setHover(
  context: ExtensionContext,
  position: Position
): Promise<void> {
  currentHover = await getHover();

  if (currentHover?.message) {
    registerHoverCommands(currentHover, context);
    const fileUri = Uri.file(
      path.join(
        context.extensionPath,
        LOGO_BY_THEME[window.activeColorTheme.kind]
      )
    ).toString();
    const message = `[![tabnine](${fileUri}|width=100)](https://www.tabnine.com/pricing/buy)  \n${currentHover.message}`;
    const markdown = new MarkdownString(message, true);
    markdown.isTrusted = true;
    decoration = {
      renderOptions: {
        after: {
          contentText: currentHover.title,
          color: "gray",
        },
      },
      range: new Range(
        new Position(position.line, position.character),
        new Position(position.line, 1024)
      ),
      hoverMessage: markdown,
    };
    showDecoration();
  }
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
workspace.onDidChangeTextDocument(() => {
  window.activeTextEditor?.setDecorations(decorationType, []);
  decoration = null;
});
