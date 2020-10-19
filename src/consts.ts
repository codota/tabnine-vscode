import * as path from "path";

export const API_VERSION = "2.0.2";
export const BINARY_ROOT_PATH = path.join(__dirname, "..", "binaries");

export const CHAR_LIMIT = 100000;
export const MAX_NUM_RESULTS = 5;
export const CONSECUTIVE_RESTART_THRESHOLD = 10;
export const SLEEP_TIME_BETWEEN_ATTEMPTS = 1000; // 1 second
export const MAX_SLEEP_TIME_BETWEEN_ATTEMPTS = 60 * 60 * 1000; // 1 hour
export const WAIT_BEFORE_RESTART_MILLIS = 1000; // 1 second
export const DELAY_FOR_CODE_ACTION_PROVIDER = 800;

export const DEFAULT_DETAIL = "TabNine";
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
}
