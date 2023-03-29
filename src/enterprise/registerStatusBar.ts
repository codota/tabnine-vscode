import * as vscode from "vscode";
import tabnineExtensionProperties from "../globals/tabnineExtensionProperties";
import {
  BINARY_NOTIFICATION_POLLING_INTERVAL,
  FULL_BRAND_REPRESENTATION,
  OPEN_SETTINGS_COMMAND,
  STATUS_NAME,
} from "../globals/consts";
import { getState } from "../binary/requests/requests";

// eslint-disable-next-line import/prefer-default-export
export function registerStatusBar(context: vscode.ExtensionContext): void {
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    -1
  );
  statusBar.command = {
    title: "Open Tabnine Settings",
    command: OPEN_SETTINGS_COMMAND,
    arguments: ["@ext:tabnine.tabnine-vscode-enterprise"],
  };
  const host = tabnineExtensionProperties.cloudHost
    ? ""
    : " Please set cloud host";

  statusBar.text = `Tabnine Enterprise${host}`;
  statusBar.tooltip = `${FULL_BRAND_REPRESENTATION} (Click to open settings)`;
  try {
    (statusBar as { name?: string }).name = STATUS_NAME;
  } catch (err) {
    console.error("failed to rename status bar");
  }

  context.subscriptions.push(statusBar, pollStatusUpdates(statusBar));
  statusBar.show();
}

function pollStatusUpdates(statusBar: vscode.StatusBarItem) {
  const statusPollingInterval = setInterval(() => {
    void getState().then((state) => {
      if (state?.cloud_connection_health_status !== "Ok") {
        // eslint-disable-next-line no-param-reassign
        statusBar.text = "Server connectivity issue";
      }
    });
  }, BINARY_NOTIFICATION_POLLING_INTERVAL);

  return new vscode.Disposable(() => {
    clearInterval(statusPollingInterval);
  });
}
