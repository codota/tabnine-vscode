import { Uri, ViewColumn, WebviewPanel, window } from "vscode";
import * as path from "path";
import { SLEEP_TIME_BEFORE_OPEN_HUB } from "../globals/consts";
import { fireEvent } from "../binary/requests/requests";
import { sleep } from "../utils/utils";
import createHubTemplate, {
  createLoadingHubTemplate,
} from "./createHubTemplate";

let panel: WebviewPanel | undefined;
let waitForServerReadyDelay = SLEEP_TIME_BEFORE_OPEN_HUB;

export function setHubWebViewUrl(uri: Uri): void {
  if (panel) panel.webview.html = createHubTemplate(uri.toString(true));
}

export default async function createHubWebView(
  uri: Uri,
  view?: string
): Promise<WebviewPanel> {
  if (!panel) {
    panel = window.createWebviewPanel(
      "tabnine.settings",
      "Tabnine Hub",
      { viewColumn: ViewColumn.Active, preserveFocus: false },
      {
        retainContextWhenHidden: true,
        enableFindWidget: true,
        enableCommandUris: true,
        enableScripts: true,
      }
    );
    panel.onDidChangeViewState(({ webviewPanel }) => {
      void fireEvent({
        name: "hub-view-state-changed",
        active: webviewPanel.active,
        visible: webviewPanel.visible,
        hub_title: webviewPanel.title,
      });
    });
    panel.onDidDispose(() => {
      panel = undefined;
      void fireEvent({
        name: "hub-view-closed",
      });
    });

    panel.iconPath = Uri.file(
      path.resolve(__dirname, "..", "..", "..", "small_logo.png")
    );

    if (waitForServerReadyDelay > 0) {
      panel.webview.html = createLoadingHubTemplate();
      await sleep(SLEEP_TIME_BEFORE_OPEN_HUB);
      waitForServerReadyDelay = 0;
    }
    setHubWebViewUrl(uri);
  }
  if (view) {
    void panel.webview.postMessage({ type: "navigation", view: `#${view}` });
  }

  return panel;
}
