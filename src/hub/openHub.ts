import { Uri, ViewColumn, WebviewPanel, window } from "vscode";
import * as path from "path";
import { SLEEP_TIME_BEFORE_OPEN_HUB } from "../globals/consts";
import { fireEvent } from "../binary/requests/requests";
import { sleep } from "../utils/utils";
import hub from "./hub";

export default async function openHub(uri: Uri): Promise<WebviewPanel> {
  const { setLoading, setUrl } = hub();

  const panel = window.createWebviewPanel(
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
    void fireEvent({
      name: "hub-view-closed",
    });
  });

  panel.iconPath = Uri.file(path.resolve(__dirname, "..", "small_logo.png"));

  if (SLEEP_TIME_BEFORE_OPEN_HUB > 0) {
    panel.webview.html = setLoading();
    await sleep(SLEEP_TIME_BEFORE_OPEN_HUB);
  }

  panel.webview.html = setUrl(uri.toString());

  return panel;
}
