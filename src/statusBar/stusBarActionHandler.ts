import * as vscode from "vscode";
import setState from "../binary/requests/setState";
import { sendStatusBarAction, StatusBarStatus } from "../binary/requests/statusBar";

import {OPEN_LP_FROM_STATUS_BAR, StatePayload, StateType, STATUS_BAR_NOTIFICATION_PERIOD } from "../consts";
import { resetToDefaultStatus, setPromotionStatus } from "./statusBar";
import { sleep } from "../utils";

let statusBarCommandDisposable: vscode.Disposable;

export default async function handleStatus(
    context: vscode.ExtensionContext,
    status: StatusBarStatus,
  ): Promise<void> {
  
    registerStatusHandlingCommand(status, context);
  
    void setState({
      [StatePayload.MESSAGE]: { message: status.message, message_type: StateType.STATUS },
    });
  
    setPromotionStatus(status.message, OPEN_LP_FROM_STATUS_BAR);
  
    await sleep(STATUS_BAR_NOTIFICATION_PERIOD);
  
    resetToDefaultStatus();
  }
  
  function registerStatusHandlingCommand(message: StatusBarStatus, context: vscode.ExtensionContext) {
    statusBarCommandDisposable?.dispose();
  
    statusBarCommandDisposable = vscode.commands.registerCommand(
      OPEN_LP_FROM_STATUS_BAR,
      () => {
        void sendStatusBarAction(message.id, message.message);
      }
    );
  
    context.subscriptions.push(statusBarCommandDisposable);
  }
  export function disposeStatusBarCommand(): void {
    if(statusBarCommandDisposable){
      statusBarCommandDisposable.dispose();
    }
  }