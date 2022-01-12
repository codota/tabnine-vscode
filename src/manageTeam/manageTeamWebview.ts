import {
  CancellationToken,
  commands,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { layout } from "../utils/webviewLayout";
import { getHubBaseUrl, isNewerThanVersion } from "../utils/binary.utils";

export function registerManageTeamWebviewProvider(context: ExtensionContext) {
  const provider = new ManageTeamWebviewProvider();
  void setManageTeamWebviewReady();

  context.subscriptions.push(
    window.registerWebviewViewProvider("tabnine-team", provider)
  );
}

async function setManageTeamWebviewReady() {
  if (await isNewerThanVersion([4, 0, 55])) {
    void commands.executeCommand(
      "setContext",
      "tabnine.manage-team-ready",
      true
    );
  }
}

class ManageTeamWebviewProvider implements WebviewViewProvider {
  resolveWebviewView(
    webviewView: WebviewView,
    context: WebviewViewResolveContext<unknown>,
    token: CancellationToken
  ): void | Thenable<void> {
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    return (async () => {
      try {
        const baseUrl = await getHubBaseUrl();

        if (baseUrl) {
          const url = baseUrl + "/manage-team-widget";

          webviewView.webview.html = layout(`
          <iframe src=${url} id="active-frame" frameborder="0" sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms" allow="clipboard-read; clipboard-write;" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
           `);
        } else {
          webviewView.webview.html = layout(`
          <div>Failed to load manage team</div>
        `);
        }
      } catch (err) {
        console.error(err);
        webviewView.webview.html = layout(`
          <div>Failed to load manage team</div>
        `);
      }
    })();
  }
}
