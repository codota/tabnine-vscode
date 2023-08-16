import { Disposable, ExtensionContext, Uri, WebviewView, window } from "vscode";
import { fireEvent } from "../../binary/requests/requests";
import { html } from "./authenticate.html";

export function emptyStateAuthenticateView(
  context: ExtensionContext
): Disposable {
  return window.registerWebviewViewProvider("tabnine.authenticate", {
    resolveWebviewView(webviewView: WebviewView) {
      webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          void fireEvent({
            name: "tabnine-chat-authenticate-visible",
          });
        }
      });

      const view = webviewView.webview;
      view.options = {
        enableScripts: true,
        enableCommandUris: true,
      };
      view.html = html;

      void fireEvent({
        name: "tabnine-chat-authenticate-inited",
      });
    },
  });
}
