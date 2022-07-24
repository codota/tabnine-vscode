import { WebviewView, WebviewViewProvider } from "vscode";
import { SLEEP_TIME_BEFORE_OPEN_HUB, StateType } from "../globals/consts";
import {
  createLayoutTemplate,
  createLoadingHubTemplate,
} from "../hub/createHubTemplate";
import { getHubBaseUrl } from "../utils/binary.utils";
import { sleep } from "../utils/utils";

export default class WidgetWebviewProvider implements WebviewViewProvider {
  source: StateType;

  hubPath: string;

  onWebviewLoaded: () => void;

  constructor(source: StateType, hubPath: string, onWebviewLoaded: () => void) {
    this.source = source;
    this.hubPath = hubPath;
    this.onWebviewLoaded = onWebviewLoaded;
  }

  // eslint-disable-next-line class-methods-use-this
  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    return setWebviewHtml(
      webviewView,
      this.source,
      this.hubPath,
      this.onWebviewLoaded
    );
  }
}

let waitForServerReadyDelay = SLEEP_TIME_BEFORE_OPEN_HUB;
async function setWebviewHtml(
  webviewView: WebviewView,
  source: StateType,
  hubPath: string,
  onWebviewLoaded: () => void
): Promise<void> {
  try {
    const baseUrl = await getHubBaseUrl(source);

    if (baseUrl) {
      const url = `${baseUrl}${hubPath}`;

      if (waitForServerReadyDelay > 0) {
        // eslint-disable-next-line no-param-reassign
        webviewView.webview.html = createLoadingHubTemplate();
        await sleep(SLEEP_TIME_BEFORE_OPEN_HUB);
        waitForServerReadyDelay = 0;
      }

      // eslint-disable-next-line no-param-reassign
      webviewView.webview.html = createLayoutTemplate(`
          <iframe src=${url} id="active-frame" frameborder="0" sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms" allow="clipboard-read; clipboard-write;" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
           `);

      onWebviewLoaded();
    } else {
      // eslint-disable-next-line no-param-reassign
      webviewView.webview.html = createLayoutTemplate(`
          <div>Failed to load webview</div>
        `);
    }
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.html = createLayoutTemplate(`
          <div>Failed to load webview</div>
        `);
  }
}
