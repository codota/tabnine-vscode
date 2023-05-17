import { commands, Disposable } from "vscode";
import { Hover, sendHoverAction } from "../binary/requests/hovers";

let hoverActionsDisposable: Disposable;

export default function registerHoverCommands(hover: Hover): Disposable {
  hoverActionsDisposable?.dispose();

  hoverActionsDisposable = Disposable.from(
    ...hover.options.map((option) =>
      commands.registerCommand(option.key, () => {
        void sendHoverAction(
          hover.id,
          option.key,
          option.actions,
          hover.notification_type,
          hover.state
        );
      })
    )
  );
  return hoverActionsDisposable;
}
