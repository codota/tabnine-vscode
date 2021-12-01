import * as vscode from "vscode";
import { getCapabilities } from "../binary/requests/requests";

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
  LEFT_TREE_VIEW = "vscode.left_tree_view",
  EMPTY_LINE_SUGGESTIONS = "empty_line_suggestions",
  AUTHENTICATION = "vscode.authentication",
}

const enabledCapabilities: Record<string, boolean> = {};

export function isCapabilityEnabled(capability: Capability): boolean {
  return enabledCapabilities[capability];
}

export function fetchCapabilitiesOnFocus(): Promise<void> {
  return new Promise((resolve) => {
    if (vscode.window.state.focused) {
      console.log("capabilities resolved immediately");
      resolveCapabilities(resolve);
    } else {
      const disposable = vscode.window.onDidChangeWindowState(({ focused }) => {
        disposable.dispose();
        console.log(`capabilities resolved on focus ${focused}`);
        resolveCapabilities(resolve);
      });
    }
  });
}

function resolveCapabilities(resolve: () => void): void {
  void getCapabilities().then((capabilities) => {
    capabilities?.enabled_features.forEach((feature) => {
      enabledCapabilities[feature] = true;
    });

    resolve();
  });
}
