import * as vscode from "vscode";
import setState from "../binary/requests/setState";
import { getStatusBarMessage, sendStatusBarAction, StatusBarMessage } from "../binary/requests/statusBar";

import { BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL, BINARY_STATUS_BAR_POLLING_INTERVAL, OPEN_LP_FROM_STATUS_BAR, StatePayload, StateType, STATUS_BAR_NOTIFICATION_PERIOD } from "../consts";
import { resetToDefaultStatus, setPromotionStatus } from "../statusBar";
import { sleep } from "../utils";

let firstMessagePollingInterval: NodeJS.Timeout | null = null;
let hourlyMessagePollingInterval: NodeJS.Timeout | null = null;
let statusBarCommandDisposable: vscode.Disposable;

export default function pollMessages(
  context: vscode.ExtensionContext
): void {
  firstMessagePollingInterval = setInterval(
    () => void doPollFirstMessage(context),
    BINARY_STATUS_BAR_FIRST_MESSAGE_POLLING_INTERVAL
  );
}

function pollMessagesHourly(
  context: vscode.ExtensionContext
): void {
  hourlyMessagePollingInterval = setInterval(
    () => void doPollMessagesHourly(context),
    BINARY_STATUS_BAR_POLLING_INTERVAL
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
  void handleMessage(context, message);
}
async function doPollMessagesHourly(
  context: vscode.ExtensionContext
): Promise<void> {
  const message = await getStatusBarMessage();
  
  if (!message) {
    return;
  }
  void handleMessage(context, message);
}

async function handleMessage(
  context: vscode.ExtensionContext,
  message: StatusBarMessage,
): Promise<void> {

  registerStatusHandlingCommand(message, context);

  void setState({
    [StatePayload.MESSAGE]: { message: message.message, message_type: StateType.STATUS },
  });

  setPromotionStatus(message.message, OPEN_LP_FROM_STATUS_BAR);

  await sleep(STATUS_BAR_NOTIFICATION_PERIOD);

  resetToDefaultStatus();
}

function registerStatusHandlingCommand(message: StatusBarMessage, context: vscode.ExtensionContext) {
  if (statusBarCommandDisposable) {
    statusBarCommandDisposable.dispose();
  }
  statusBarCommandDisposable = vscode.commands.registerCommand(
    OPEN_LP_FROM_STATUS_BAR,
    () => {
      void sendStatusBarAction(message.id, message.message);
    }
  );

  context.subscriptions.push(statusBarCommandDisposable);
}

export function dispose(): void {
  if(statusBarCommandDisposable){
    statusBarCommandDisposable.dispose();
  }
  cancelFirstMessagePolling();
  cancelHourlyMessagePolling();
  resetToDefaultStatus();
}
