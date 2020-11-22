import * as vscode from "vscode";
import { getStatus } from "../binary/requests/statusBar";

import { BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL, BINARY_STATUS_BAR_POLLING_INTERVAL} from "../consts";
import { resetToDefaultStatus } from "./statusBar";
import handleStatus, { disposeStatusBarCommand } from "./stusBarActionHandler";

let firstStatusPollingInterval: NodeJS.Timeout | null = null;
let hourlyStatusPollingInterval: NodeJS.Timeout | null = null;

export default function pollStatuses(
  context: vscode.ExtensionContext
): void {
  firstStatusPollingInterval = setInterval(
    () => void doPollFirstStatus(context),
    BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL
  );
}

function pollStatusHourly(
  context: vscode.ExtensionContext
): void {
  hourlyStatusPollingInterval = setInterval(
    () => void doPollStatusHourly(context),
    BINARY_STATUS_BAR_POLLING_INTERVAL
  );
}

function cancelFirstStatusPolling(): void {
  if (firstStatusPollingInterval) {
    clearInterval(firstStatusPollingInterval);
  }
}
function cancelHourlyStatusPolling(): void {
  if (hourlyStatusPollingInterval) {
    clearInterval(hourlyStatusPollingInterval);
  }
}

async function doPollFirstStatus(
  context: vscode.ExtensionContext
): Promise<void> {
  const status = await getStatus();
  
  if (!status) {
    return;
  }

  cancelFirstStatusPolling();
  pollStatusHourly(context);
  void handleStatus(context, status);
}
async function doPollStatusHourly(
  context: vscode.ExtensionContext
): Promise<void> {
  const message = await getStatus();
  
  if (!message) {
    return;
  }
  void handleStatus(context, message);
}

export function disposeStatus(): void {
  disposeStatusBarCommand();
  cancelFirstStatusPolling();
  cancelHourlyStatusPolling();
  resetToDefaultStatus();
}
