import * as vscode from "vscode";
import { getStatus } from "../binary/requests/statusBar";
import { BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL } from "../globals/consts";
import {
  onStartServiceLevel,
  resetDefaultStatus,
  setServiceLevel,
} from "./statusBar";
import handleStatus, {
  disposeStatusBarCommand,
} from "./statusBarActionHandler";
import BINARY_STATE from "../binary/binaryStateSingleton";

let statusPollingInterval: NodeJS.Timeout | null = null;

export default function pollStatuses(
  context: vscode.ExtensionContext
): vscode.Disposable {
  const statePollerDisposable = BINARY_STATE.onChange((state) => {
    setServiceLevel(state.service_level);
  });
  context.subscriptions.push(statePollerDisposable);
  statusPollingInterval = setInterval(() => {
    void doPollStatus(context);
  }, BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL);
  void onStartServiceLevel();
  return new vscode.Disposable(disposeStatus);
}

function cancelStatusPolling(): void {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }
}

export async function doPollStatus(
  context: vscode.ExtensionContext
): Promise<void> {
  const status = await getStatus();

  if (!status?.message) {
    return;
  }

  context.subscriptions.push(handleStatus(status));
}

function disposeStatus(): void {
  disposeStatusBarCommand();
  cancelStatusPolling();
  resetDefaultStatus();
}
