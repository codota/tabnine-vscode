import { Disposable, EventEmitter } from "vscode";

export enum Capability {
  ON_BOARDING_CAPABILITY = "vscode.onboarding",
  ASSISTANT_CAPABILITY = "vscode.assistant",
  ASSISTANT_MODE_A_CAPABILITY_KEY = "vscode.assistant.mode.A",
  ASSISTANT_MODE_B_CAPABILITY_KEY = "vscode.assistant.mode.B",
  ASSISTANT_BACKGROUND_CAPABILITY = "vscode.assistant.background",
  ASSISTANT_PASTE_CAPABILITY = "vscode.assistant.paste",
  SUGGESTIONS_SINGLE = "suggestions-single",
  SUGGESTIONS_TWO = "suggestions-two",
  SUGGESTIONS_ORIGINAL = "suggestions-original",
  ALPHA_CAPABILITY = "vscode.validator",
  SHOW_AGRESSIVE_STATUS_BAR_UNTIL_CLICKED = "promoteHub1",
  INLINE_SUGGESTIONS = "inline_suggestions_mode",
  SNIPPET_SUGGESTIONS = "snippet_suggestions",
  SNIPPET_SUGGESTIONS_CONFIGURABLE = "snippet_suggestions_configurable",
  VSCODE_INLINE_V2 = "vscode_inline_v2",
  SNIPPET_AUTO_TRIGGER = "snippet_auto_trigger",
  LEFT_TREE_VIEW = "vscode.left_tree_view",
  EMPTY_LINE_SUGGESTIONS = "empty_line_suggestions",
  AUTHENTICATION = "vscode.authentication",
  CODE_REVIEW = "vscode.code-review",
  SAVE_SNIPPETS = "save_snippets",
  BETA_CAPABILITY = "beta",
  FIRST_SUGGESTION_DECORATION = "first_suggestion_hint_enabled",
  DEBOUNCE_VALUE_300 = "debounce_value_300",
  DEBOUNCE_VALUE_600 = "debounce_value_600",
  DEBOUNCE_VALUE_900 = "debounce_value_900",
  DEBOUNCE_VALUE_1200 = "debounce_value_1200",
  DEBOUNCE_VALUE_1500 = "debounce_value_1500",
}

export function isCapabilityEnabled(capability: Capability): boolean {
  console.log(capability);
  return true;
}

const capabilitiesRefreshed = new EventEmitter<void>();

export function onDidRefreshCapabilities(listener: () => void): Disposable {
  return capabilitiesRefreshed.event(listener);
}
