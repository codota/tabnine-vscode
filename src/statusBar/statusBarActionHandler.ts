import * as vscode from "vscode";
import setState from "../binary/requests/setState";
import {
  sendStatusBarAction,
  StatusBarStatus,
} from "../binary/requests/statusBar";

import {
  MessageActions,
  NOTIFICATIONS_OPEN_QUERY_PARAM,
  OPEN_LP_FROM_STATUS_BAR,
  StatePayload,
  StateType,
  STATUS_BAR_NOTIFICATION_PERIOD,
  TABNINE_NOTIFICATIONS_FOCUS_COMMAND,
} from "../globals/consts";
import {
  promotionTextIs,
  resetDefaultStatus,
  setPromotionStatus,
} from "./statusBar";
import { sleep } from "../utils/utils";
import openHub from "../hub/openHub";

let statusBarCommandDisposable: vscode.Disposable;

export default function handleStatus(
  context: vscode.ExtensionContext,
  status: StatusBarStatus
): void {
  registerStatusHandlingCommand(status, context);

  if (!promotionTextIs(status.message)) {
    void setState({
      [StatePayload.STATUS_SHOWN]: {
        id: status.id,
        text: status.message,
        notification_type: status.notification_type,
        state: status.state,
      },
    });
  }

  setPromotionStatus(
    status.id,
    status.message,
    status.title,
    OPEN_LP_FROM_STATUS_BAR
  );

  let duration = STATUS_BAR_NOTIFICATION_PERIOD;
  if (status.duration_seconds) {
    duration = status.duration_seconds * 1000;
  }

  void asyncRemoveStatusAfterDuration(status.id, duration);
}

async function asyncRemoveStatusAfterDuration(id: string, duration: number) {
  await sleep(duration);
  resetDefaultStatus(id);
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
        message.actions,
        message.state
      );
    }
  );

  context.subscriptions.push(statusBarCommandDisposable);
}
function executeStatusAction(message: StatusBarStatus) {
  const selectedAction = message.actions;

  if (selectedAction?.includes(MessageActions.OPEN_HUB)) {
    void openHub(StateType.STATUS)();
  }

  if (selectedAction?.includes(MessageActions.OPEN_NOTIFICATIONS)) {
    void vscode.commands.executeCommand(TABNINE_NOTIFICATIONS_FOCUS_COMMAND);
  }

  if (selectedAction?.includes(MessageActions.OPEN_NOTIFICATIONS_IN_HUB)) {
    void openHub(StateType.STATUS, `/home?${NOTIFICATIONS_OPEN_QUERY_PARAM}`)();
  }

  resetDefaultStatus(message.id);
}

export function disposeStatusBarCommand(): void {
  if (statusBarCommandDisposable) {
    statusBarCommandDisposable.dispose();
  }
}
