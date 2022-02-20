import {
  commands,
  ExtensionContext,
  WebviewView,
  WebviewViewProvider,
  window,
} from "vscode";
import layout from "./utils/webviewLayout";
import { getHubBaseUrl } from "./utils/binary.utils";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import { StateType } from "./globals/consts";

interface WidgetWebviewParams {
  viewId: string;
  capability: Capability;
  readyCommand: string;
  getHubBaseUrlSource: StateType;
  hubPath: string;
  onWebviewLoaded: () => void;
}

function registerWidgetWebviewProvider(
  context: ExtensionContext,
  widgetWebviewParams: WidgetWebviewParams
): void {
  const provider = new WidgetWebviewProvider(
    widgetWebviewParams.getHubBaseUrlSource,
    widgetWebviewParams.hubPath,
    widgetWebviewParams.onWebviewLoaded
  );

  context.subscriptions.push(
    window.registerWebviewViewProvider(widgetWebviewParams.viewId, provider)
  );

  setWidgetWebviewReady(
    widgetWebviewParams.capability,
    widgetWebviewParams.readyCommand
  );
}

function setWidgetWebviewReady(
  capability: Capability,
  readyCommand: string
): void {
  if (isCapabilityEnabled(capability)) {
    void commands.executeCommand("setContext", readyCommand, true);
  }
}

class WidgetWebviewProvider implements WebviewViewProvider {
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

      // eslint-disable-next-line no-param-reassign
      webviewView.webview.html = layout(`
          <iframe src=${url} id="active-frame" frameborder="0" sandbox="allow-same-origin allow-pointer-lock allow-scripts allow-downloads allow-forms" allow="clipboard-read; clipboard-write;" style="display: block; margin: 0px; overflow: hidden; position: absolute; width: 100%; height: 100%; visibility: visible;"></iframe>
           `);

      onWebviewLoaded();
    } else {
      // eslint-disable-next-line no-param-reassign
      webviewView.webview.html = layout(`
          <div>Failed to load webview</div>
        `);
    }
  } catch (err) {
    console.error(err);
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.html = layout(`
          <div>Failed to load webview</div>
        `);
  }
}

export default registerWidgetWebviewProvider;
