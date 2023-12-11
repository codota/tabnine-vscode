import { Disposable, ExtensionContext, WebviewView, window } from "vscode";
import { fireEvent } from "../../binary/requests/requests";
import { html } from "./previewEnded.html";
import { getIcon } from "./getIcon";

export function previewEndedView(context: ExtensionContext): Disposable {
  return window.registerWebviewViewProvider("tabnine.chat.preview_ended", {
    resolveWebviewView(webviewView: WebviewView) {
      context.subscriptions.push(
        webviewView.onDidChangeVisibility(() => {
          if (webviewView.visible) {
            void fireEvent({
              name: "tabnine-chat-preview-ended-visible",
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
        name: "tabnine-chat-preview-ended-inited",
      });
    },
  });
}
