import { Disposable, ExtensionContext, WebviewView, window } from "vscode";
import { fireEvent } from "../../binary/requests/requests";
import { html } from "./authenticate.html";
import { getIcon } from "./getIcon";

export function emptyStateAuthenticateView(
  context: ExtensionContext
): Disposable {
  return window.registerWebviewViewProvider("tabnine.chat.authenticate", {
    resolveWebviewView(webviewView: WebviewView) {
      context.subscriptions.push(
        webviewView.onDidChangeVisibility(() => {
          if (webviewView.visible) {
            void fireEvent({
              name: "tabnine-chat-authenticate-visible",
            });
          }
        })
      );
      const view = webviewView.webview;
      view.options = {
        enableScripts: true,
        enableCommandUris: true,
      };
      const logoSrc = getIcon(context, view);
      view.html = html(logoSrc);

      void fireEvent({
        name: "tabnine-chat-authenticate-inited",
      });
    },
  });
}
