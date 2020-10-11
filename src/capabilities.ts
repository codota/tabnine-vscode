import { TabNine } from "./TabNine";
import * as vscode from "vscode";

export const ON_BOARDING_CAPABILITY = "vscode.onboarding";
export const NOTIFICATIONS_CAPABILITY = "vscode.user-notifications";

export function getCapabilitiesOnFocus(
  tabNine: TabNine
): Promise<{ isCapability: (string) => boolean }> {
  return new Promise((resolve) => {
    if (vscode.window.state.focused) {
      console.log("resolved immediately");
      resolveCapabilities(resolve, tabNine);
    } else {
      let disposable = vscode.window.onDidChangeWindowState(({ focused }) => {
        disposable.dispose();
        console.log(`resolved on focus ${focused}`);
        resolveCapabilities(resolve, tabNine);
      });
    }
  });
}
async function resolveCapabilities(resolve, tabNine: TabNine) {
  let { enabled_features } = await tabNine.getCapabilities();
  resolve({
    isCapability(capability) {
      return enabled_features.includes(capability);
    },
  });
}
