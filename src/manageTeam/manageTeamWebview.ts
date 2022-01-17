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

function registerManageTeamWebviewProvider(context: ExtensionContext): void {
  const provider = new ManageTeamWebviewProvider();
  void setManageTeamWebviewReady();

  context.subscriptions.push(
    window.registerWebviewViewProvider("tabnine-team", provider)
  );
}

function setManageTeamWebviewReady() {
  if (isCapabilityEnabled(Capability.MANAGE_TEAM_WIDGET)) {
    void commands.executeCommand(
      "setContext",
      "tabnine.manage-team-ready",
      true
    );
  }
}

class ManageTeamWebviewProvider implements WebviewViewProvider {
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
          const url = `${baseUrl}/manage-team-widget`;

          // eslint-disable-next-line no-param-reassign
          webviewView.webview.html = layout(`
          <iframe src=${url} id="active-frame" frameborder="0" sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms" allow="clipboard-read; clipboard-write;" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
           `);

          await fireEvent({
            name: "loaded-manage-team-widget-as-webview",
          });
        } else {
          // eslint-disable-next-line no-param-reassign
          webviewView.webview.html = layout(`
          <div>Failed to load manage team</div>
        `);
        }
      } catch (err) {
        console.error(err);
        // eslint-disable-next-line no-param-reassign
        webviewView.webview.html = layout(`
          <div>Failed to load manage team</div>
        `);
      }
    })();
  }
}

export default registerManageTeamWebviewProvider;
