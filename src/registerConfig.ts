import { Uri, ViewColumn, window } from "vscode";
import * as path from "path";

export default function registerConfig(
  config: { message: string } | null | undefined
): void {
  const panel = window.createWebviewPanel(
    "tabnine.settings",
    "TabNine Config",
    { viewColumn: ViewColumn.Active, preserveFocus: false },
    {
      retainContextWhenHidden: true,
      enableFindWidget: true,
      enableCommandUris: true,
      enableScripts: true,
    }
  );
  panel.iconPath = Uri.file(path.resolve(__dirname, "..", "small_logo.png"));
  panel.webview.html = `
        <!DOCTYPE html>
        <html lang="en" style="margin: 0px; min-width: 100%; min-height: 100%">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>TabNine Config</title>
            </head>
            <body style="margin: 0px; min-width: 100%; min-height: 100%">
            <iframe src=${config?.message} id="config" frameborder="0" style="display: block; margin: 0px; position: absolute; min-width: 100%; min-height: 100%; visibility: visible;"></iframe>
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
}
