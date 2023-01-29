import { ViewColumn, WebviewPanel, window } from "vscode";
import { fireEvent } from "../binary/requests/requests";
import { createIFrameTemplate } from "./webviewTemplates";
import { setAlreadyOpenedGettingStarted } from "../state/gettingStartedOpenedState";
import { TABNINE_GETTING_STARTED_FOR_VSCODE_URL } from "../globals/consts";
import { ExtensionContext } from "../preRelease/types";
import {isSandboxed} from "../sandbox";

let panel: WebviewPanel | undefined;

// eslint-disable-next-line import/prefer-default-export
export function openGettingStartedWebview(context: ExtensionContext): void {
  if (isSandboxed()) {
    return;
  }
  if (!panel) {
    panel = window.createWebviewPanel(
      "tabnine.getting-started",
      "Tabnine - Getting Started",
      { viewColumn: ViewColumn.Beside, preserveFocus: false },
      {
        retainContextWhenHidden: true,
        enableFindWidget: true,
        enableCommandUris: true,
        enableScripts: true,
      }
    );
    panel.onDidDispose(() => {
      panel = undefined;
      void fireEvent({
        name: "getting-started-closed",
      });
    });
    panel.webview.html = createIFrameTemplate(
      TABNINE_GETTING_STARTED_FOR_VSCODE_URL
    );
    void setAlreadyOpenedGettingStarted(context);
  }
}
