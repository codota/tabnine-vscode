import { EventEmitter } from "events";
import { workspace } from "vscode";

let completionsEnabled = true;
let enableTimeout: NodeJS.Timeout | null = null;

export const completionsState = new EventEmitter();

export function setCompletionsEnabled(enabled: boolean): void {
  completionsEnabled = enabled;
  completionsState.emit("changed", enabled);

  if (enableTimeout) {
    clearTimeout(enableTimeout);
    enableTimeout = null;
  }

  if (!enabled) {
    const snoozeDuration = workspace
      .getConfiguration("tabnine")
      .get<number>("snoozeDuration", 1);

    enableTimeout = setTimeout(() => {
      setCompletionsEnabled(true);
    }, snoozeDuration * 60 * 1000);
  }
}

export function isCompletionsEnabled(): boolean {
  return completionsEnabled;
}
