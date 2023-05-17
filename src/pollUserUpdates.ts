import { TextEditor, ExtensionContext, Position } from "vscode";
import { doPollStatus } from "./statusBar/pollStatusBar";
import setHover from "./hovers/hoverHandler";
import { doPollNotifications } from "./notifications/pollNotifications";

export function pollUserUpdates(context: ExtensionContext, editor: TextEditor) {
  void doPollNotifications(context);
  void doPollStatus(context);
  void setHover(context, marginRight(editor));
}

export function marginRight(editor: TextEditor): Position {
  return editor.selection.active.translate(0, 10);
}
