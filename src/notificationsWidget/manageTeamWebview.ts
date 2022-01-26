import {
  commands,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  window,
} from "vscode";
import layout from "../utils/webviewLayout";
import { getHubBaseUrl } from "../utils/binary.utils";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { fireEvent } from "../binary/requests/requests";

function registerNotificaitonsWebviewProvider(context: ExtensionContext): void {
  const provider = new NotificationsWebviewProvider();
  void setManageTeamWebviewReady();

  context.subscriptions.push(
    window.registerWebviewViewProvider("tabnine-notifications", provider)
  );
}

function setManageTeamWebviewReady() {
  if (isCapabilityEnabled(Capability.NOTIFICATIONS_WIDGET)) {
    void commands.executeCommand(
      "setContext",
      "tabnine.notifications-ready",
      true
    );
  }
}

class NotificationsWebviewProvider implements WebviewViewProvider {
  // eslint-disable-next-line class-methods-use-this
  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    return (async () => {
      try {
        const baseUrl = await getHubBaseUrl();

        if (baseUrl) {
          const url = `${baseUrl}/notifications-widget`;

          // eslint-disable-next-line no-param-reassign
          webviewView.webview.html = layout(`
          <iframe src=${url} id="active-frame" frameborder="0" sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms" allow="clipboard-read; clipboard-write;" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
           `);

          await fireEvent({
            name: "loaded-notificaitons-widget-as-webview",
          });
        } else {
          // eslint-disable-next-line no-param-reassign
          webviewView.webview.html = layout(`
          <div>Failed to load notifications</div>
        `);
        }
      } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-param-reassign
        webviewView.webview.html = layout(`
          <div>Failed to load notifications</div>
        `);
      }
    })();
  }
}

export default registerNotificaitonsWebviewProvider;
