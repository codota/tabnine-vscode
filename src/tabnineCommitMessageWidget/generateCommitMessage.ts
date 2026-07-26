import * as vscode from "vscode";
import { generateCommitMessageFromDiff } from "./commitMessageGenerator";
import {
  getCommitDiff,
  getGitAPI,
  hasChanges,
  resolveRepository,
} from "./gitApi";
import CommitMessageEnabledState from "./CommitMessageEnabledState";
import { isCommitMessageSettingEnabled } from "./commitMessageSettings";
import { TabnineAuthError } from "./tabnineChatClient";
import { callForLogin } from "../authentication/authentication.api";

export async function generateCommitMessageCommand(
  enabledState: CommitMessageEnabledState,
  sourceControl?: vscode.SourceControl
): Promise<void> {
  if (!isCommitMessageSettingEnabled()) {
    await vscode.window.showWarningMessage(
      "Tabnine commit message generation is disabled in Settings."
    );
    return;
  }

  const currentState = enabledState.get();
  if (!currentState.enabled && !currentState.loading) {
    if (currentState.commitMessageNotEnabledReason === "not_logged_in") {
      const action = await vscode.window.showWarningMessage(
        "Sign in to Tabnine to generate commit messages.",
        "Sign in"
      );
      if (action === "Sign in") {
        await callForLogin();
      }
      return;
    }

    await vscode.window.showWarningMessage(
      getDisabledMessage(currentState.commitMessageNotEnabledReason)
    );
    return;
  }

  const gitApi = await getGitAPI();
  if (!gitApi) {
    await vscode.window.showErrorMessage(
      "Git extension was not found or is disabled."
    );
    return;
  }

  const repository = resolveRepository(gitApi, sourceControl);
  if (!repository) {
    await vscode.window.showWarningMessage(
      "Open a Git repository to generate a commit message."
    );
    return;
  }

  await repository.status();
  if (!hasChanges(repository)) {
    await vscode.window.showWarningMessage(
      "No changes found to generate a commit message."
    );
    return;
  }

  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Tabnine: Generating commit message...",
        cancellable: true,
      },
      async (_progress, token) => {
        const diff = await getCommitDiff(repository);
        if (!diff.trim()) {
          throw new Error("No diff available for the current changes.");
        }

        const message = await generateCommitMessageFromDiff(diff, token);
        if (token.isCancellationRequested) {
          return;
        }

        if (!message) {
          throw new Error("Failed to generate a commit message.");
        }

        repository.inputBox.value = message;
      }
    );
  } catch (error) {
    if (error instanceof TabnineAuthError) {
      const action = await vscode.window.showWarningMessage(
        error.message,
        "Sign in"
      );
      if (action === "Sign in") {
        await callForLogin();
      }
      return;
    }

    const details = error instanceof Error ? error.message : String(error);
    await vscode.window.showErrorMessage(
      `Tabnine could not generate a commit message: ${details}`
    );
  }
}

function getDisabledMessage(reason: string | null): string {
  switch (reason) {
    case "not_logged_in":
      return "Sign in to Tabnine to generate commit messages.";
    case "disabled_by_setting":
      return "Tabnine commit message generation is disabled in Settings.";
    case "capability_required":
      return "Commit message generation is not available on your Tabnine plan.";
    case "preview_ended":
      return "The preview for this feature has ended.";
    default:
      return "Commit message generation is currently unavailable.";
  }
}
