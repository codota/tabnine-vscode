import { commands, window } from "vscode";
import { callForLogin } from "../../authentication/authentication.api";
import {
  EXTENSION_ID,
  OPEN_SETTINGS_COMMAND,
  TABNINE_HOST_CONFIGURATION,
} from "../consts";

export enum StatusState {
  SetServer,
  LogIn,
  WaitingForProcess,
  ErrorWaitingForProcess,
  Ready,
}
export function action(state: StatusState): void {
  switch (state) {
    case StatusState.SetServer:
      void commands.executeCommand(
        OPEN_SETTINGS_COMMAND,
        `@id:${TABNINE_HOST_CONFIGURATION}`
      );
      break;
    case StatusState.LogIn:
      showLoginNotification();
      break;
    case StatusState.ErrorWaitingForProcess:
      window
        .showErrorMessage(
          "An error occurred. Please check the Developer Tools for more information",
          "View Developer Tools",
          "Reload VSCode"
        )
        .then((selection) => {
          if (selection === "View Developer Tools") {
            void commands.executeCommand("workbench.action.toggleDevTools");
          }
          if (selection === "Reload VSCode") {
            void commands.executeCommand("workbench.action.reload");
          }
        });
      break;
    case StatusState.WaitingForProcess:
      window
        .showInformationMessage(
          "waiting for Tabnine process to start...",
          "view logs"
        )
        .then((selection) => {
          if (selection === "view logs") {
            void commands.executeCommand("workbench.action.toggleDevTools");
          }
        });
      break;
    default:
      void commands.executeCommand(OPEN_SETTINGS_COMMAND, [
        `@ext:tabnine.${EXTENSION_ID}`,
      ]);
      break;
  }
}

export function showLoginNotification() {
  void window
    .showInformationMessage(
      "Please sign in using your Tabnine account.",
      "Sign in"
    )
    .then((selection) => {
      if (selection === "Sign in") {
        void callForLogin();
      }
    });
}
