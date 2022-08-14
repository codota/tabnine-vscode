import * as path from "path";
import { CompletionItemKind } from "vscode";
import {
  AutocompleteResult,
  CompletionKind,
} from "../../../binary/requests/requests";
import { SaveSnippetResponse } from "../../../binary/requests/saveSnippet";
import CompletionOrigin from "../../../CompletionOrigin";
import {
  API_VERSION,
  ATTRIBUTION_BRAND,
  BRAND_NAME,
} from "../../../globals/consts";
import RequestMatcher from "./RequestMatcher";

export const A_NOTIFICATION_ID = "A_NOTIFICATION_ID";
export const ANOTHER_NOTIFICATION_ID = "ANOTHER_NOTIFICATION_ID";
export const A_MESSAGE = "A_MESSAGE";
export const ANOTHER_MESSAGE = "ANOTHER_MESSAGE";
export const AN_OPTION_KEY = "AN_OPTION_KEY";
export const ANOTHER_OPTION_KEY = "ANOTHER_OPTION_KEY";

export const DIFFERENT_NOTIFICATION_ID = "DIFFERENT_NOTIFICATION_ID";
export const SAME_NOTIFICATION_ID = "SAME_NOTIFICATION_ID";
export const PROMO_TYPE = "promo";

export const NOTIFICATIONS_REQUEST = `{"version":"${API_VERSION}","request":{"Notifications":{}}}\n`;
export const EVENT_REQUEST = `{"version":"${API_VERSION}","request":{"Notifications":{}}}\n`;

export const DIFFERENT_NOTIFICATION_ACTION_HAPPENED = `{"version":"${API_VERSION}","request":{"NotificationAction":{"id":"DIFFERENT_NOTIFICATION_ID","selected":"AN_OPTION_KEY","message":"A_MESSAGE","notification_type":"promo","actions":["None"],"state":null}}}\n`;
export const ANOTHER_NOTIFICATION_ACTION_HAPPENED = `{"version":"${API_VERSION}","request":{"NotificationAction":{"id":"ANOTHER_NOTIFICATION_ID","message":"ANOTHER_MESSAGE","notification_type":"promo","state":null}}}\n`;

export const ACTIVE_VERSION = "1.2.3";
export const VERSION_DOWNLOAD = "1.2.5";
export const EXISTING_VERSION = "1.2.4";
export const MOCKED_BINARY = "test binary";
export const MOCKED_ZIP_FILE = path.join(
  __dirname,
  "../..",
  "fixture",
  "TabNine.zip"
);
export const DOWNLOAD_ERROR = new Error("Download failure");

// Needs to match what inside the completion.txt file
const A_COMPLETION_PREFIX = "blabla";
export const A_SUGGESTION = `${A_COMPLETION_PREFIX}bla`;
const ANOTHER_SUGGESTION = `${A_COMPLETION_PREFIX}_test`;
export const SINGLE_CHANGE_CHARACTER = "k";
export const INLINE_PREFIX = `${A_COMPLETION_PREFIX}${SINGLE_CHANGE_CHARACTER}`;
export const INLINE_NEW_PREFIX = `${A_COMPLETION_PREFIX}${SINGLE_CHANGE_CHARACTER}bla`;

export function anEventRequest(
  name: string,
  properties: Record<string, unknown> = {}
): unknown {
  return new RequestMatcher({ Event: { ...properties, name } });
}

export function aNotificationId(): string {
  return `A_NOTIFICATION_ID_${Math.random()}`;
}

export function anAutocompleteResponse(
  oldPrefix?: string,
  newPrefix?: string,
  completion_kind?: CompletionKind
): AutocompleteResult {
  return {
    old_prefix: oldPrefix !== undefined ? oldPrefix : A_COMPLETION_PREFIX,
    results: [
      {
        new_prefix: newPrefix !== undefined ? newPrefix : A_SUGGESTION,
        old_suffix: "",
        new_suffix: "",
        origin: CompletionOrigin.VANILLA,
        completion_kind,
      },
      {
        new_prefix: ANOTHER_SUGGESTION,
        detail: "5%",
        old_suffix: "",
        new_suffix: "",
        origin: CompletionOrigin.LOCAL,
      },
    ],
    user_message: [""],
    is_locked: false,
  };
}

export function aCompletionResult(): Record<string, unknown>[] {
  return [
    {
      label: ATTRIBUTION_BRAND + A_SUGGESTION,
      kind: CompletionItemKind.Property,
      detail: BRAND_NAME,
      sortText: "\u0000\u0000",
      preselect: true,
      insertText: {
        _tabstop: 1,
        value: A_SUGGESTION,
      },
    },
    {
      label: ATTRIBUTION_BRAND + ANOTHER_SUGGESTION,
      kind: CompletionItemKind.Property,
      detail: BRAND_NAME,
      sortText: "\u0000\u0001",
      preselect: undefined,
      insertText: {
        _tabstop: 1,
        value: ANOTHER_SUGGESTION,
      },
    },
  ];
}

export function aSaveSnippetSuccessResponse(): SaveSnippetResponse {
  return { result: "Success" };
}

export function anErrorSnippetSuccessResponse(
  error: string
): SaveSnippetResponse {
  return { result: { Error: error } };
}
