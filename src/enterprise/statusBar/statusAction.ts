import { Uri, commands, env, window } from "vscode";
import { callForLogin } from "../../authentication/authentication.api";
import {
  EXTENSION_ID,
  OPEN_SETTINGS_COMMAND,
  TABNINE_HOST_CONFIGURATION,
} from "../consts";
import { Logger } from "../../utils/logger";

export enum StatusState {
  SetServer,
  LogIn,
  WaitingForProcess,
  ErrorWaitingForProcess,
  NotPartOfTheTeam,
  ConnectivityIssue,
  Ready,
  OpenLogs,
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
      void window
        .showErrorMessage(
          "An error occurred. Please check the Tabnine log output for more information",
          "Show Log",
          "Reload VSCode"
        )
        .then((selection) => {
          if (selection === "Show Log") {
            Logger.show();
          }
          if (selection === "Reload VSCode") {
            void commands.executeCommand("workbench.action.reload");
          }
        });
      break;
    case StatusState.WaitingForProcess:
      void window
        .showInformationMessage(
          "waiting for Tabnine process to start...",
          "Show Log"
        )
        .then((selection) => {
          if (selection === "Show Log") {
            Logger.show();
          }
        });
      break;
    case StatusState.NotPartOfTheTeam:
      void window.showWarningMessage(
        "You are not part of the team. Please contact your team admin to resolve this issue."
      );
      break;
    case StatusState.OpenLogs:
      void window
        .showErrorMessage(
          "An error occurred. Please check the Tabnine log output for more information",
          "Show Log"
        )
        .then((selection) => {
          if (selection === "Show Log") {
            Logger.show();
          }
        });
      break;
    case StatusState.ConnectivityIssue:
      void window
        .showErrorMessage(
          "Connectivity issue - Tabnine is unable to reach the server",
          "Learn more"
        )
        .then((selection) => {
          if (selection === "Learn more") {
            void env.openExternal(
              Uri.parse(
                "https://support.tabnine.com/hc/en-us/articles/5760725346193-Connectivity-possible-issues"
              )
            );
          }
        });
      break;

    default:
      void commands.executeCommand(
        OPEN_SETTINGS_COMMAND,
        `@ext:tabnine.${EXTENSION_ID}`
      );
      break;
  }
}

export function showLoginNotification() {
  void window
    .showInformationMessage("Please sign in to access Tabnine.", "Sign in")
    .then((selection) => {
      if (selection === "Sign in") {
        void callForLogin();
      }
    });
}
