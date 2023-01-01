import * as vscode from "vscode";
import { getStatus } from "../binary/requests/statusBar";
import {
  onStartServiceLevel,
  resetDefaultStatus,
  setServiceLevel,
} from "./statusBar";
import handleStatus, {
  disposeStatusBarCommand,
} from "./statusBarActionHandler";
import { onStateChangedEmitter } from "../events/onStateChangedEmitter";
import { BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL } from "../globals/consts";

let statusPollingInterval: NodeJS.Timeout | null = null;

export default function pollStatuses(context: vscode.ExtensionContext): void {
  onStateChangedEmitter.event(setServiceLevel);

  statusPollingInterval = setInterval(
    () => void doPollStatus(context),
    BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL
  );
  void onStartServiceLevel();
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

  void handleStatus(context, status);
}

export function disposeStatus(): void {
  disposeStatusBarCommand();
  cancelStatusPolling();
  resetDefaultStatus();
}
