import * as vscode from "vscode";
import {
  StatusBarStatus,
} from "../binary/requests/statusBar";

import {
  OPEN_LP_FROM_STATUS_BAR,
  STATUS_BAR_NOTIFICATION_PERIOD,
} from "../globals/consts";
import {
  promotionTextIs,
  resetDefaultStatus,
  setPromotionStatus,
} from "./statusBar";
import { sleep } from "../utils/utils";

let statusBarCommandDisposable: vscode.Disposable;

export default function handleStatus(
  context: vscode.ExtensionContext,
  status: StatusBarStatus
): void {

  if (!promotionTextIs(status.message)) {
    // void setState({
    //   [StatePayload.STATUS_SHOWN]: {
    //     id: status.id,
    //     text: status.message,
    //     notification_type: status.notification_type,
    //     state: status.state,
    //   },
    // });
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

export function disposeStatusBarCommand(): void {
  if (statusBarCommandDisposable) {
    statusBarCommandDisposable.dispose();
  }
}
