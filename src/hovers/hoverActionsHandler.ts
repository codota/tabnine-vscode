import { commands, Disposable, ExtensionContext } from "vscode";
import { Hover, sendHoverAction } from "../binary/requests/hovers";

let hoverActionsDisposable: Disposable[] = [];

export default function registerHoverCommands(
  hover: Hover,
  context: ExtensionContext
): void {
  hoverActionsDisposable.forEach((a) => !!a.dispose());
  hoverActionsDisposable = [];

  hover.options.forEach((option) => {
    const hoverAction = commands.registerCommand(option.key, () => {
      void sendHoverAction(
        hover.id,
        option.key,
        option.actions,
        hover.notification_type,
        hover.state
      );
    });
    hoverActionsDisposable.push(hoverAction);
    context.subscriptions.push(hoverAction);
  });
}
