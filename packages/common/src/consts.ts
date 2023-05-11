export const API_VERSION = "4.4.223";
export const RELOAD_BUTTON = "Reload";
export const OPEN_NETWORK_SETUP_HELP = "Help";
export const BUNDLE_DOWNLOAD_FAILURE_MESSAGE =
  "Tabnine Extension was unable to download its dependencies. Please check your internet connection. If you use a proxy server, please visit https://code.visualstudio.com/docs/setup/network";

export const CONSECUTIVE_RESTART_THRESHOLD = 100;
export const REQUEST_FAILURES_THRESHOLD = 20;
const SLEEP_TIME_BETWEEN_ATTEMPTS = 1000; // 1 second
const MAX_SLEEP_TIME_BETWEEN_ATTEMPTS = 60 * 60 * 1000; // 1 hour
export const DELAY_FOR_CODE_ACTION_PROVIDER = 800;
export function restartBackoff(attempt: number): number {
  return Math.min(
    SLEEP_TIME_BETWEEN_ATTEMPTS * 2 ** Math.min(attempt, 10),
    MAX_SLEEP_TIME_BETWEEN_ATTEMPTS
  );
}
export const BINARY_RESTART_EVENT = "binary-restart-event";
export const CHAR_LIMIT = 100_000;
export const MAX_NUM_RESULTS = 5;

export const TAB_OVERRIDE_COMMAND = "tabnine.tab-override";

export enum SuggestionTrigger {
  DocumentChanged = "DocumentChanged",
  LookAhead = "LookAhead",
}
