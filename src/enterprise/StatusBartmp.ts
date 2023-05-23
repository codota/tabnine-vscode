// import {
//   Disposable,
//   StatusBarAlignment,
//   StatusBarItem,
//   ThemeColor,
//   authentication,
//   commands,
//   window,
//   workspace,
// } from "vscode";
// import {
//   EXTENSION_ID,
//   OPEN_SETTINGS_COMMAND,
//   TABNINE_HOST_CONFIGURATION,
// } from "./consts";
// import {
//   BINARY_NOTIFICATION_POLLING_INTERVAL,
//   BRAND_NAME,
//   FULL_BRAND_REPRESENTATION,
// } from "../globals/consts";
// import { isValidateServer } from "./update/serverUrl";
// import { callForLogin } from "../authentication/authentication.api";
// import { getState, tabNineProcess } from "../binary/requests/requests";
// import { waitFor } from "../utils/utils";

// const commandId = "tabnine.enterprise.status.handler";

// enum StatusState {
//   SetServer,
//   LogIn,
//   WaitingForProcess,
//   ErrorWaitingForProcess,
//   Ready,
// }
// export class StatusBar implements Disposable {
//   private item: StatusBarItem;
//   private disposables: Disposable[] = [];
//   private statusPollingInterval: NodeJS.Timeout | undefined = undefined;

//   constructor() {
//     this.item = window.createStatusBarItem(StatusBarAlignment.Left, -1);
//     this.disposables.push(commands.registerCommand(commandId, action));
//     this.disposables.push(
//       authentication.onDidChangeSessions((e) => {
//         if (e.provider.id === BRAND_NAME) {
//           this.setReady();
//         }
//       })
//     );
//     this.setDefault();
//     this.item.show();
//     this.setCommand(StatusState.Ready);

//     this.setServerRequired();
//   }

//   private setServerRequired() {
//     this.setWarning("Please set your Tabnine server URL");

//     if (isValidateServer()) {
//       this.setDefault();
//       this.waitForProcess();
//     } else {
//       this.setCommand(StatusState.SetServer);
//       this.disposables.push(
//         workspace.onDidChangeConfiguration((event) => {
//           if (
//             event.affectsConfiguration(TABNINE_HOST_CONFIGURATION) &&
//             isValidateServer()
//           ) {
//             this.item.backgroundColor = undefined;
//             this.waitForProcess();
//           }
//         })
//       );
//     }
//   }

//   private setWarning(message: string) {
//     this.item.backgroundColor = new ThemeColor(
//       "statusBarItem.warningBackground"
//     );
//     this.item.tooltip = message;
//     this.item.text = "Tabnine";
//   }
//   private setDefault() {
//     this.item.backgroundColor = undefined;
//     this.item.tooltip = `${FULL_BRAND_REPRESENTATION} (Click to open settings)`;
//     this.item.text = "Tabnine";
//   }

//   private waitForProcess() {
//     this.setLoading();
//     this.setCommand(StatusState.WaitingForProcess);

//     waitFor(tabNineProcess.onReady, 2000).then(
//       this.setLoginRequired.bind(this),
//       this.setProcessTimedoutError.bind(this)
//     );
//   }
//   private setLoading() {
//     this.item.text = "$(loading~spin) Tabnine";
//     this.item.backgroundColor = undefined;
//     this.item.tooltip = "Starting tabnine process, please wait...";
//   }

//   private setProcessTimedoutError() {
//     this.setError();
//     this.setCommand(StatusState.ErrorWaitingForProcess);
//   }

//   private setCommand(state: StatusState) {
//     this.item.command = {
//       title: "Status action",
//       command: commandId,
//       arguments: [state],
//     };
//   }

//   private setError() {
//     this.item.text = "$(warning) Tabnine";
//     this.item.backgroundColor = new ThemeColor("statusBarItem.errorBackground");
//     this.item.tooltip = "Tabnine failed to start, view logs for more details";
//   }

//   private setLoginRequired() {
//     this.setWarning("Please sign in using your Tabnine account.");
//     this.setCommand(StatusState.LogIn);
//     void authentication.getSession(BRAND_NAME, []).then((isLoggedIn) => {
//       if (isLoggedIn) {
//         this.setReady();
//       }
//     }, showLoginNotification);
//   }

//   dispose() {
//     this.item.dispose();
//     Disposable.from(...this.disposables).dispose();
//     if (this.statusPollingInterval) {
//       clearInterval(this.statusPollingInterval);
//     }
//   }

//   private setReady() {
//     this.setDefault();
//     this.setCommand(StatusState.Ready);
//     this.statusPollingInterval = setInterval(() => {
//       void getState().then((state) => {
//         if (state?.cloud_connection_health_status !== "Ok") {
//           this.setWarning("Server connectivity issue");
//         }
//       });
//     }, BINARY_NOTIFICATION_POLLING_INTERVAL);
//   }
// }

// function action(state: StatusState): void {
//   switch (state) {
//     case StatusState.SetServer:
//       void commands.executeCommand(
//         OPEN_SETTINGS_COMMAND,
//         `@id:${TABNINE_HOST_CONFIGURATION}`
//       );
//       break;
//     case StatusState.LogIn:
//       showLoginNotification();
//       break;
//     case StatusState.ErrorWaitingForProcess:
//       window
//         .showErrorMessage(
//           "An error occurred. Please check the Developer Tools for more information",
//           "View Developer Tools",
//           "Reload VSCode"
//         )
//         .then((selection) => {
//           if (selection === "View Developer Tools") {
//             void commands.executeCommand("workbench.action.toggleDevTools");
//           }
//           if (selection === "Reload VSCode") {
//             void commands.executeCommand("workbench.action.reload");
//           }
//         });
//       break;
//     case StatusState.WaitingForProcess:
//       window
//         .showInformationMessage(
//           "waiting for Tabnine process to start...",
//           "view logs"
//         )
//         .then((selection) => {
//           if (selection === "view logs") {
//             void commands.executeCommand("workbench.action.toggleDevTools");
//           }
//         });
//       break;
//     default:
//       void commands.executeCommand(OPEN_SETTINGS_COMMAND, [
//         `@ext:tabnine.${EXTENSION_ID}`,
//       ]);
//       break;
//   }
// }

// function showLoginNotification() {
//   void window
//     .showInformationMessage(
//       "Please sign in using your Tabnine account.",
//       "Sign in"
//     )
//     .then((selection) => {
//       if (selection === "Sign in") {
//         void callForLogin();
//       }
//     });
// }
