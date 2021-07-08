import { Uri, ViewColumn, WebviewPanel, window } from "vscode";
import axios from "axios";
import * as path from "path";
import { IS_OSX } from "./globals/consts";
import { fireEvent } from "./binary/requests/requests";

const layout = (content: string) => `
<!DOCTYPE html>
<html lang="en" style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tabnine Hub</title>
    </head>
    <body style="margin: 0; padding: 0; min-width: 100%; min-height: 100%">
        ${content}
    </body>
</html>`;

function waitForHub(uri: string): Promise<void> {
  return new Promise((resolve) => {
    axios
      .get(uri, { timeout: 500 })
      .then((res) => {
        if (res.status === 200) {
          resolve();
        } else {
          setTimeout(() => void waitForHub(uri).then(resolve), 500);
        }
      })
      .catch((err) => {
        setTimeout(() => void waitForHub(uri).then(resolve), 500);
      });
  });
}

export default function openHub(uri: Uri): WebviewPanel {
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

  panel.webview.html = layout(`
    <div
      id="loading"
      frameborder="0"
      style="
        display: block;
        margin: 0;
        padding: 0;
        position: absolute;
        min-width: 100%;
        min-height: 100%;
        visibility: visible;
        background: rgb(37, 37, 38);
        color: white;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      Loading ...
    </div>
   `);

  void waitForHub(uri.toString()).then(() => {
    panel.webview.html = layout(`
    <iframe src=${uri.toString()} id="config" frameborder="0" style="display: block; margin: 0; padding: 0; position: absolute; min-width: 100%; min-height: 100%; visibility: visible;"></iframe>
    <script>
        window.onfocus = config.onload = function() {
            setTimeout(function() {
                document.getElementById("config").contentWindow.focus();
            }, 100);
        };
        window.addEventListener("message", (e) => {
          let data = e.data;
          switch (data.type) {
            case "keydown": {
              if (${IS_OSX}) {
                window.dispatchEvent(new KeyboardEvent('keydown',data.event));
              }
              break;
            }
            case "link-click": {
              let tempRef = document.createElement("a");
              tempRef.setAttribute("href", data.href);
              config.appendChild(tempRef);
              tempRef.click();
              tempRef.parentNode.removeChild(tempRef);
              break;
            }
          }
      }, false);

      </script>
    `);
  });

  return panel;
}
