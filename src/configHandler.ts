import { ExtensionContext, Uri, ViewColumn, window } from "vscode";
import { handleStartUpNotification } from "./notificationsHandler";
import { setProgressBar } from "./progressBar";
import { updateStatusBar } from "./statusBar";
const IS_OSX = process.platform == "darwin";

export function registerConfig(
  context: ExtensionContext,
  config: { message: string }
) {
  const panel = window.createWebviewPanel(
    "tabnine.settings",
    "TabNine Settings",
    { viewColumn: ViewColumn.Active, preserveFocus: false },
    {
      retainContextWhenHidden: true,
      enableFindWidget: true,
      enableCommandUris: true,
      enableScripts: true,
    }
  );
  panel.iconPath = Uri.parse("../small_logo.png");
  panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TabNine Settings</title>
            </head>
            <body>
            <iframe src=${config.message} id="config" frameborder="0" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
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
                          window.dispatchEvent(new KeyboardEvent('keydown',data.event));
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
            </body>
        </html>`;

  panel.onDidDispose(
    () => {
      updateStatusBar(null);
      setProgressBar(context);
      handleStartUpNotification(context);
    },
    null,
    context.subscriptions
  );
}
