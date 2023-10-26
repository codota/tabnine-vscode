import { window, workspace } from "vscode";
import {
  isCompletionsEnabled,
  setCompletionsEnabled,
} from "../state/completionsState";

const RESUME_TABNINE = "Resume Tabnine";

export function showStatusBarNotificationOptions(
  settingsButton: string,
  onSettingsClicked: () => void
) {
  const snoozeDuration = workspace
    .getConfiguration("tabnine")
    .get<number>("snoozeDuration", 1);

  const snoozeTabnine = `Snooze Tabnine (${snoozeDuration}h)`;

  const currentAction = isCompletionsEnabled() ? snoozeTabnine : RESUME_TABNINE;

  void window
    .showInformationMessage("Tabnine options", settingsButton, currentAction)
    .then((selection) => {
      switch (selection) {
        case settingsButton:
          onSettingsClicked();
          break;
        case snoozeTabnine:
          setCompletionsEnabled(false);
          break;
        case RESUME_TABNINE:
          setCompletionsEnabled(true);
          break;
        default:
          console.warn("Unexpected selection");
          break;
      }
    });
}
