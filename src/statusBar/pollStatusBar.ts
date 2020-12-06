import * as vscode from "vscode";
import { getStatus } from "../binary/requests/statusBar";
import { BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL } from "../consts";
import {
  onStartServiceLevel,
  pollServiceLevel,
  resetDefaultStatuses,
} from "./statusBar";
import handleStatus, { disposeStatusBarCommand } from "./stusBarActionHandler";

let statusPollingInterval: NodeJS.Timeout | null = null;

export default function pollStatuses(context: vscode.ExtensionContext): void {
  statusPollingInterval = setInterval(() => {
    void doPollStatus(context);
    void pollServiceLevel();
  }, BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL);
  void onStartServiceLevel();
}

function cancelStatusPolling(): void {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
  }
}

async function doPollStatus(context: vscode.ExtensionContext): Promise<void> {
  const status = await getStatus();

  if (!status?.message) {
    return;
  }

  void handleStatus(context, status);
}

export function disposeStatus(): void {
  disposeStatusBarCommand();
  cancelStatusPolling();
  resetDefaultStatuses();
}
