import * as vscode from "vscode";
import CommitMessageEnabledState from "./CommitMessageEnabledState";
import { generateCommitMessageCommand } from "./generateCommitMessage";

export default function registerCommitMessage(
  context: vscode.ExtensionContext,
  enabledState: CommitMessageEnabledState
): void {
  updateContextKey(enabledState.get());

  context.subscriptions.push(
    enabledState.onChange((state) => {
      updateContextKey(state);
    }),
    vscode.commands.registerCommand(
      "tabnine.commitMessage.generate",
      (sourceControl?: vscode.SourceControl) =>
        generateCommitMessageCommand(enabledState, sourceControl)
    )
  );
}

function updateContextKey(state: {
  enabled: boolean;
  commitMessageNotEnabledReason: string | null;
}): void {
  void vscode.commands.executeCommand(
    "setContext",
    "tabnine.commitMessage.enabled",
    state.enabled
  );
  void vscode.commands.executeCommand(
    "setContext",
    "tabnine.commitMessage.disabledReason",
    state.enabled ? null : state.commitMessageNotEnabledReason
  );
}
