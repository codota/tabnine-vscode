import { CompletionItemKind } from "vscode";
import { AutocompleteResult } from "../../../binary/requests/requests";
import CompletionOrigin from "../../../CompletionOrigin";
import { ATTRIBUTION_BRAND, BRAND_NAME } from "../../../consts";

export const A_NOTIFICATION_ID = "A_NOTIFICATION_ID";
export const ANOTHER_NOTIFICATION_ID = "ANOTHER_NOTIFICATION_ID";
export const A_MESSAGE = "A_MESSAGE";
export const ANOTHER_MESSAGE = "ANOTHER_MESSAGE";
export const AN_OPTION_KEY = "AN_OPTION_KEY";
export const ANOTHER_OPTION_KEY = "ANOTHER_OPTION_KEY";

export const DIFFERENT_NOTIFICATION_ID = "DIFFERENT_NOTIFICATION_ID";
export const SAME_NOTIFICATION_ID = "SAME_NOTIFICATION_ID";

// Needs to match what inside the completion.txt file
const A_COMPLETION_PREFIX = "blabla";
const A_SUGGESTION = `${A_COMPLETION_PREFIX}bla`;
const ANOTHER_SUGGESTION = `${A_COMPLETION_PREFIX}_test`;

export function anAutocompleteResponse(): AutocompleteResult {
  return {
    old_prefix: A_COMPLETION_PREFIX,
    results: [
      {
        new_prefix: A_SUGGESTION,
        old_suffix: "",
        new_suffix: "",
        origin: CompletionOrigin.VANILLA,
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
      detail: "tabnine",
      sortText: "\u0000\u0001",
      preselect: undefined,
      insertText: {
        _tabstop: 1,
        value: ANOTHER_SUGGESTION,
      },
    },
  ];
}
