import * as vscode from "vscode";
import { getStatusBarMessage, sendStatusBarAction, StatusBarMessage } from "../binary/requests/statusBar";

import { BINARY_NOTIFICATION_POLLING_INTERVAL, OPEN_LP_FROM_STATUS_BAR } from "../consts";
import { resetToDefaultStatus, setPromotionStatus } from "../statusBar";

let firstMessagePollingInterval: NodeJS.Timeout | null = null;
let hourlyMessagePollingInterval: NodeJS.Timeout | null = null;
let statusBarCommandDisposable: vscode.Disposable;

export default function pollMessages(
  context: vscode.ExtensionContext
): void {
  firstMessagePollingInterval = setInterval(
    () => void doPollFirstMessage(context),
    BINARY_NOTIFICATION_POLLING_INTERVAL
  );
}

function pollMessagesHourly(
  context: vscode.ExtensionContext
): void {
  hourlyMessagePollingInterval = setInterval(
    () => void doPollMessagesHourly(context),
    60000 * 5
  );
}

function cancelFirstMessagePolling(): void {
  if (firstMessagePollingInterval) {
    clearInterval(firstMessagePollingInterval);
  }
}
function cancelHourlyMessagePolling(): void {
  if (hourlyMessagePollingInterval) {
    clearInterval(hourlyMessagePollingInterval);
  }
}

async function doPollFirstMessage(
  context: vscode.ExtensionContext
): Promise<void> {
  const message = await getStatusBarMessage();
  
  if (!message) {
    return;
  }

  cancelFirstMessagePolling();
  pollMessagesHourly(context);
  handleMessage(context, message);
}
async function doPollMessagesHourly(
  context: vscode.ExtensionContext
): Promise<void> {
  const message = await getStatusBarMessage();
  
  if (!message) {
    return;
  }
  handleMessage(context, message);
}

function handleMessage(
  context: vscode.ExtensionContext,
  message: StatusBarMessage,
): void {

  if(statusBarCommandDisposable){
    statusBarCommandDisposable.dispose();
  }
  statusBarCommandDisposable = vscode.commands.registerCommand(
    OPEN_LP_FROM_STATUS_BAR,
    () => { 
      void sendStatusBarAction(message.id, message.message); 
    }
  )

  context.subscriptions.push(statusBarCommandDisposable);

  setPromotionStatus(message.message, OPEN_LP_FROM_STATUS_BAR);

  setTimeout(() => {
    resetToDefaultStatus();
  }, 60000 * 2)
}

export function dispose(): void {
  if(statusBarCommandDisposable){
    statusBarCommandDisposable.dispose();
  }
  cancelFirstMessagePolling();
  cancelHourlyMessagePolling();
}
