import {
  CancellationToken,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  WebviewViewResolveContext,
  window,
} from "vscode";
import { configuration } from "../binary/requests/requests";
import { StateType } from "../globals/consts";
import { layout } from "../utils/webviewLayout";

export function registerManageTeamWebviewProvider(context: ExtensionContext) {
  const provider = new ManageTeamWebviewProvider();

  context.subscriptions.push(
    window.registerWebviewViewProvider("tabnine-team", provider)
  );
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
        const response = await configuration({
          quiet: true,
          source: StateType.MANAGE_TEAM_WEB_VIEW,
        });

        if (response?.message) {
          // const url = response.message + "/public-model";
          const url = "http://localhost:3000/vscode-client";

          webviewView.webview.html = layout(`
          <iframe src=${url} id="active-frame" frameborder="0" sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms" allow="clipboard-read; clipboard-write;" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
           `);
        } else {
          webviewView.webview.html = layout(`
          <div>Failed to load manage team</div>
        `);
        }
      } catch (err) {}
    })();
  }
}
