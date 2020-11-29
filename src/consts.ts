import * as path from "path";

export const API_VERSION = "2.0.2";
export const BINARY_ROOT_PATH = path.join(__dirname, "..", "binaries");
export const ATTRIBUTION_BRAND = "⌬ ";
export const BRAND_NAME = "tabnine";
export const FULL_BRAND_REPRESENTATION = ATTRIBUTION_BRAND + BRAND_NAME;

export const CHAR_LIMIT = 100_000;
export const MAX_NUM_RESULTS = 5;
export const CONSECUTIVE_RESTART_THRESHOLD = 100;
export const REQUEST_FAILURES_THRESHOLD = 20;
export const WAIT_BEFORE_RESTART_MILLIS = 1_000; // 1 second
export const DELAY_FOR_CODE_ACTION_PROVIDER = 800;
// Env variable is to make the tests faster. It is not set in production environment.
export const BINARY_NOTIFICATION_POLLING_INTERVAL = +(
  process.env.BINARY_NOTIFICATION_POLLING_INTERVAL || 10_000
); // 10 seconds

export const BINARY_STATUS_BAR_POLLING_INTERVAL = +(
  process.env.BINARY_STATUS_BAR_POLLING_INTERVAL || 60 * 60 * 1_000
); // one hour

export const BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL = +(
  process.env.BINARY_NOTIFICATION_POLLING_INTERVAL || 10_000
); // 10 seconds

export const STATUS_BAR_NOTIFICATION_PERIOD = +(
  process.env.STATUS_BAR_NOTIFICATION_PERIOD || 2 * 60 * 1_000
); // 2 minutes

export const OPEN_LP_FROM_STATUS_BAR = "tabnine:open_lp";
export const INSTALL_COMMAND = "workbench.extensions.installExtension";
export const LATEST_RELEASE_URL =
  "https://api.github.com/repos/codota/tabnine-vscode/releases";
export const MINIMAL_SUPPORTED_VSCODE_API = "1.35.0";
export const ALPHA_VERSION_KEY = "tabnine.alpha.version";

export const DEFAULT_DETAIL = BRAND_NAME;
export const PROGRESS_KEY = "tabnine.hide.progress";

export const COMPLETION_TRIGGERS = [
  " ",
  ".",
  "(",
  ")",
  "{",
  "}",
  "[",
  "]",
  ",",
  ":",
  "'",
  '"',
  "=",
  "<",
  ">",
  "/",
  "\\",
  "+",
  "-",
  "|",
  "&",
  "*",
  "%",
  "=",
  "$",
  "#",
  "@",
  "!",
];

export enum StateType {
  ERROR = "error",
  INFO = "info",
  PROGRESS = "progress",
  STATUS = "status",
  PALLETTE = "pallette",
  NOTIFICATION = "notification",
}

export enum StatePayload {
  MESSAGE = "Message",
  STATE = "State",
  NOTIFICATION_SHOWN = "NotificationShown",
  STATUS_SHOWN = "StatusShown",
}

const SLEEP_TIME_BETWEEN_ATTEMPTS = 1000; // 1 second
const MAX_SLEEP_TIME_BETWEEN_ATTEMPTS = 60 * 60 * 1000; // 1 hour

export function restartBackoff(attempt: number): number {
  return Math.min(
    SLEEP_TIME_BETWEEN_ATTEMPTS * 2 ** Math.min(attempt, 10),
    MAX_SLEEP_TIME_BETWEEN_ATTEMPTS
  );
}
