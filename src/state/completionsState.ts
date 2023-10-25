import { EventEmitter } from "events";

let completionsEnabled = true;
let enableTimeout: NodeJS.Timeout | null = null;

const MAX_DISABLE_TIME_MS = 60 * 60 * 1000;

export const completionState = new EventEmitter();

export function setCompletionsEnabled(enabled: boolean): void {
  completionsEnabled = enabled;
  completionState.emit("changed", enabled);

  if (enableTimeout) {
    clearTimeout(enableTimeout);
    enableTimeout = null;
  }

  if (!enabled) {
    enableTimeout = setTimeout(() => {
      setCompletionsEnabled(true);
    }, MAX_DISABLE_TIME_MS);
  }
}

export function isCompletionsEnabled(): boolean {
  return completionsEnabled;
}
