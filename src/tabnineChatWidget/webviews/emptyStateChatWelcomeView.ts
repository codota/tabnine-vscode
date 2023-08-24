import {
  Disposable,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  window,
} from "vscode";
import { fireEvent } from "../../binary/requests/requests";
import { refreshRemote } from "../../binary/requests/refreshRemote";
import { html } from "./welcome.html";
import { getIcon } from "./getIcon";

export function emptyStateWelcomeView(context: ExtensionContext): Disposable {
  return window.registerWebviewViewProvider(
    "tabnine.chat.welcome",
    new ChatWelcomeProvider(context)
  );
}

class ChatWelcomeProvider implements WebviewViewProvider {
  private MINIMAL_MS_BETWEEN_FORCE_REFRESH_CAPABILITIES = 2_000;

  private lastCapabilitiesRefresh: number | undefined;

  constructor(private readonly context: ExtensionContext) {}

  resolveWebviewView(webviewView: WebviewView) {
    this.context.subscriptions.push(
      webviewView.onDidChangeVisibility(() => {
        this.onVisible(webviewView, "tabnine-chat-empty-visible");
      })
    );
    this.onVisible(webviewView, "tabnine-chat-empty-inited");

    const view = webviewView.webview;
    view.options = {
      enableScripts: true,
      enableCommandUris: true,
    };
    const logoSrc = getIcon(this.context, view);
    view.html = html(logoSrc);
  }

  private onVisible(webviewView: WebviewView, eventName: string) {
    if (webviewView.visible) {
      if (this.isTimeForForceRefreshCapabilities()) {
        this.lastCapabilitiesRefresh = new Date().getTime();
        void fireEvent({
          name: "tabnine-chat-refresh-state",
        });
        void refreshRemote();
      }
      void fireEvent({
        name: eventName,
      });
    }
  }

  private isTimeForForceRefreshCapabilities(): boolean {
    return (
      !this.lastCapabilitiesRefresh ||
      new Date().getTime() - this.lastCapabilitiesRefresh >
        this.MINIMAL_MS_BETWEEN_FORCE_REFRESH_CAPABILITIES
    );
  }
}
