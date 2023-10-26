import { window, workspace } from "vscode";
import { completionsState } from "../state/completionsState";
import { sendEvent } from "../binary/requests/sendEvent";

const RESUME_TABNINE = "Resume Tabnine";

export function showStatusBarNotificationOptions(
  settingsButton: string,
  onSettingsClicked: () => void
) {
  const snoozeDuration = workspace
    .getConfiguration("tabnine")
    .get<number>("snoozeDuration", 1);

  const snoozeTabnine = `Snooze Tabnine (${snoozeDuration}h)`;

  const currentAction = completionsState.value ? snoozeTabnine : RESUME_TABNINE;

  void window
    .showInformationMessage("Tabnine options", settingsButton, currentAction)
    .then((selection) => {
      switch (selection) {
        case settingsButton:
          onSettingsClicked();
          break;
        case snoozeTabnine:
          trackSnoozeToggled(false, snoozeDuration);
          completionsState.value = false;
          break;
        case RESUME_TABNINE:
          trackSnoozeToggled(true, snoozeDuration);
          completionsState.value = true;
          break;
        default:
          console.warn("Unexpected selection");
          break;
      }
    });
}

function trackSnoozeToggled(showCompletions: boolean, duration: number) {
  void sendEvent({
    name: "snooze-toggled",
    properties: {
      show_completions: showCompletions.toString(),
      duration: duration.toString(),
    },
  });
}
