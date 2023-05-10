export const TABNINE_URL_QUERY_PARAM = "tabnineUrl";
export const API_VERSION = "4.4.223";
export const BINARY_UPDATE_URL = "https://update.tabnine.com/bundles";
export const BINARY_UPDATE_VERSION_FILE_URL = `${BINARY_UPDATE_URL}/version`;
export const ATTRIBUTION_BRAND = "";
export const BRAND_NAME = "Hugging Face Code";
export const LIMITATION_SYMBOL = "🔒";
export const FULL_BRAND_REPRESENTATION = ATTRIBUTION_BRAND + BRAND_NAME;
export const BUNDLE_DOWNLOAD_FAILURE_MESSAGE =
  "Tabnine Extension was unable to download its dependencies. Please check your internet connection. If you use a proxy server, please visit https://code.visualstudio.com/docs/setup/network";
export const OPEN_ISSUE_BUTTON = "Open issue";
export const OPEN_NETWORK_SETUP_HELP = "Help";
export const DOWNLOAD_RETRY = "Retry";
export const RELOAD_BUTTON = "Reload";
export const OPEN_ISSUE_LINK =
  "https://github.com/codota/tabnine-vscode/issues/new";
export const STATUS_NAME = "Tabnine";

export const INSTRUMENTATION_KEY = "<INSTRUMENTATION_KEY>";

export const CHAR_LIMIT = 4_000;
export const MAX_NUM_RESULTS = 5;
export const CONSECUTIVE_RESTART_THRESHOLD = 100;
export const REQUEST_FAILURES_THRESHOLD = 20;
export const WAIT_BEFORE_RESTART_MILLIS = 1_000; // 1 second
export const DELAY_FOR_CODE_ACTION_PROVIDER = 800;
// Env variable is to make the tests faster. It is not set in production environment.
export const BINARY_STARTUP_GRACE = +(
  process.env.BINARY_NOTIFICATION_POLLING_INTERVAL || 9_000
); // 9 seconds

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

export const STATUS_BAR_FIRST_TIME_CLICKED = "status-bar-first-time-clicked";

export const OPEN_LP_FROM_STATUS_BAR = "tabnine:open_lp";
export const INSTALL_COMMAND = "workbench.extensions.installExtension";
export const LATEST_RELEASE_URL =
  "https://api.github.com/repos/codota/tabnine-vscode/releases";
export const MINIMAL_SUPPORTED_VSCODE_API = "1.35.0";
export const ALPHA_VERSION_KEY = "tabnine.alpha.version";
export const BETA_CHANNEL_MESSAGE_SHOWN_KEY =
  "tabnine.joinBetaChannelMessageShown";

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
  STARTUP = "startup",
  TREE_VIEW = "treeView",
  AUTH = "auth",
}

export enum StatePayload {
  MESSAGE = "Message",
  STATE = "State",
  NOTIFICATION_SHOWN = "NotificationShown",
  STATUS_SHOWN = "StatusShown",
  HOVER_SHOWN = "HoverShown",
  HINT_SHOWN = "HintShown",
  SNIPPET_SHOWN = "SnippetShown",
}

export enum MessageActionsEnum {
  NONE = "None",
  OPEN_HUB = "OpenHub",
  OPEN_LP = "OpenLp",
  OPEN_BUY = "OpenBuy",
  OPEN_SIGNUP = "OpenSignup",
  OPEN_NOTIFICATIONS = "OpenNotifications",
  OPEN_NOTIFICATIONS_IN_HUB = "OpenNotificationsInHub",
  ENABLE_ADVANCED_COMPLETIONS = "EnableAdvancedCompletions",
}

export interface OpenHubWithAction {
  OpenHubWith: {
    query_params: [string, string][];
    path: string;
  };
}

export type MessageAction = MessageActionsEnum | OpenHubWithAction;
export const NOTIFICATIONS_OPEN_QUERY_PARAM = "notifications=open";

const SLEEP_TIME_BETWEEN_ATTEMPTS = 1000; // 1 second
const MAX_SLEEP_TIME_BETWEEN_ATTEMPTS = 60 * 60 * 1000; // 1 hour

export function restartBackoff(attempt: number): number {
  return Math.min(
    SLEEP_TIME_BETWEEN_ATTEMPTS * 2 ** Math.min(attempt, 10),
    MAX_SLEEP_TIME_BETWEEN_ATTEMPTS
  );
}

export const IS_OSX = process.platform === "darwin";

export const SLEEP_TIME_BEFORE_OPEN_HUB = 0;

export const ACCEPT_INLINE_COMMAND = "tabnine.accept-inline-suggestion";
export const TAB_OVERRIDE_COMMAND = "tabnine.tab-override";
export const ESCAPE_INLINE_COMMAND = "tabnine.escape-inline-suggestion";
export const ATTRIBUTION_COMMAND = "tabnine.attribution";
export const NEXT_INLINE_COMMAND = "tabnine.next-inline-suggestion";
export const PREV_INLINE_COMMAND = "tabnine.prev-inline-suggestion";
export const SNIPPET_COMMAND = "tabnine.snippet-suggestion";
export const PROJECT_OPEN_GITHUB_COMMAND = "HuggingFaceCode::openGithub";
export const TABNINE_OPEN_GETTING_STARTED_COMMAND =
  "tabnine:open-getting-started";
export const TABNINE_NOTIFICATIONS_FOCUS_COMMAND =
  "tabnine-notifications.focus";

export const PROJECT_GITHUB_URL = "https://github.com/huggingface/huggingface-vscode";
export const TABNINE_SITE_URL = "https://tabnine.com";
export const TABNINE_GETTING_STARTED_FOR_VSCODE_URL = `${TABNINE_SITE_URL}/getting-started/ide?client=vscode`;

export const URI_SCHEME_FILE = "file";
export const BINARY_RESTART_EVENT = "binary-restart-event";
export const MAX_SMALL_INTEGER_V8 = 2 ** 30; // Max number that can be stored in V8's smis (small integers)
export const LOCAL_ADDRESSES = ["localhost", "127.0.0.1"];

export enum SuggestionTrigger {
  DocumentChanged = "DocumentChanged",
  LookAhead = "LookAhead",
}

export const OUTPUT_CHANNEL_NAME = "Hugging Face Code";