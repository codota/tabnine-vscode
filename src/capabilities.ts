import * as vscode from "vscode";
import { getCapabilities } from "./binary/requests/requests";

export enum Capability {
  ON_BOARDING_CAPABILITY = "vscode.onboarding",
  VALIDATOR_CAPABILITY = "vscode.validator",
  VALIDATOR_MODE_A_CAPABILITY_KEY = "vscode.validator.mode.A",
  VALIDATOR_MODE_B_CAPABILITY_KEY = "vscode.validator.mode.B",
  VALIDATOR_BACKGROUND_CAPABILITY = "vscode.validator.background",
  VALIDATOR_PASTE_CAPABILITY = "vscode.validator.paste",
  SUGGESTIONS_SINGLE = "suggestions-single",
  SUGGESTIONS_TWO = "suggestions-two",
  SUGGESTIONS_ORIGINAL = "suggestions-original",
}

const enabledCapabilities: Record<string, boolean> = {};

export function isCapabilityEnabled(capability: Capability): boolean {
  return (
    // !["production", "test", "testing"].includes(process.env.NODE_ENV) ||
    !!enabledCapabilities[capability]
  );
}

export function fetchCapabilitiesOnFocus(): Promise<void> {
  return new Promise((resolve) => {
    if (vscode.window.state.focused) {
      console.log("resolved immediately");
      resolveCapabilities(resolve);
    } else {
      const disposable = vscode.window.onDidChangeWindowState(({ focused }) => {
        disposable.dispose();
        console.log(`resolved on focus ${focused}`);
        resolveCapabilities(resolve);
      });
    }
  });
}

async function resolveCapabilities(resolve: () => void): Promise<void> {
  const capabilities = await getCapabilities();

  for (const feature of capabilities?.enabled_features ?? []) {
    enabledCapabilities[feature] = true;
  }

  resolve();
}
