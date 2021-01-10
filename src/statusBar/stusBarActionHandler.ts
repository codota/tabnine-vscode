import * as vscode from "vscode";
import setState from "../binary/requests/setState";
import {
  sendStatusBarAction,
  StatusBarStatus,
} from "../binary/requests/statusBar";

import {
  MessageActions,
  OPEN_LP_FROM_STATUS_BAR,
  StatePayload,
  StateType,
  STATUS_BAR_NOTIFICATION_PERIOD,
} from "../consts";
import {
  promotionTextIs,
  resetDefaultStatuses,
  setPromotionStatus,
} from "./statusBar";
import { sleep } from "../utils";
import { openConfigWithSource } from "../commandsHandler";

let statusBarCommandDisposable: vscode.Disposable;
let currentStatusBarId: string | null;

export default function handleStatus(
  context: vscode.ExtensionContext,
  status: StatusBarStatus
 ) {
  currentStatusBarId = status.id;
  registerStatusHandlingCommand(status, context);

  if (!promotionTextIs(status.message)) {
    void setState({
      [StatePayload.STATUS_SHOWN]: {
        text: status.message,
        notification_type: status.notification_type,
      },
    });
  }

  setPromotionStatus(status.message, OPEN_LP_FROM_STATUS_BAR);

  let duration = STATUS_BAR_NOTIFICATION_PERIOD;
  if (status.duration_seconds) {
    duration = status.duration_seconds * 1000;
  }

  void asyncRemoveStatusAfterDuration(status.id, duration);
}

async function asyncRemoveStatusAfterDuration(id: string, duration: number) {
  await sleep(duration);
  if (currentStatusBarId === id) {
    resetDefaultStatuses();
  }
}

function registerStatusHandlingCommand(
  message: StatusBarStatus,
  context: vscode.ExtensionContext
) {
  statusBarCommandDisposable?.dispose();

  statusBarCommandDisposable = vscode.commands.registerCommand(
    OPEN_LP_FROM_STATUS_BAR,
    () => {
      executeStatusAction(message);
      void sendStatusBarAction(
        message.id,
        message.message,
        message.notification_type,
        message.actions
      );
    }
  );

  context.subscriptions.push(statusBarCommandDisposable);
}
function executeStatusAction(message: StatusBarStatus) {
  const selectedAction = message.actions;
  if (selectedAction?.includes(MessageActions.OPEN_HUB)) {
    void openConfigWithSource(StateType.STATUS)();
  }
}

export function disposeStatusBarCommand(): void {
  if (statusBarCommandDisposable) {
    statusBarCommandDisposable.dispose();
  }
}
