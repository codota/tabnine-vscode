import { Disposable, ExtensionContext, Uri, WebviewView, window } from "vscode";
import { fireEvent } from "../../binary/requests/requests";
import { refreshRemote } from "../../binary/requests/refreshRemote";
import { html } from "./welcome.html";

export function emptyStateWelcomeView(context: ExtensionContext): Disposable {
  return window.registerWebviewViewProvider("tabnine.chat.welcome", {
    resolveWebviewView(webviewView: WebviewView) {
      webviewView.onDidChangeVisibility(() => {
        if (webviewView.visible) {
          void refreshRemote();
          void fireEvent({
            name: "tabnine-chat-empty-visible",
          });
        }
      });
      void fireEvent({
        name: "tabnine-chat-empty-inited",
      });

      const view = webviewView.webview;
      view.html = html;
    },
  });
}
