import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import axios from "axios";
import { ExtensionContext, WebviewView, WebviewViewProvider } from "vscode";
import { chatEventRegistry } from "./chatEventRegistry";
import { initChatApi } from "./ChatApi";
import { Logger } from "../utils/logger";
import { fireEvent } from "../binary/requests/requests";

interface RequestMessage {
  id: string;
  command: string;
  // eslint-disable-next-line
  data: any;
}

export default class ChatViewProvider implements WebviewViewProvider {
  private chatWebviewView?: vscode.WebviewView;

  private chatWebview?: vscode.Webview;

  private extensionPath: string;

  constructor(private context: ExtensionContext, serverUrl?: string) {
    this.extensionPath = context.extensionPath;
    initChatApi(context, serverUrl);
  }

  private init() {
    if (!this.chatWebview) {
      return;
    }

    this.chatWebviewView?.onDidChangeVisibility(() => {
      this.onVisible("tabnine-chat-visible");
    });
    this.onVisible("tabnine-chat-inited");

    this.chatWebview.onDidReceiveMessage(
      async (message: RequestMessage) => {
        try {
          const payload = await chatEventRegistry.handleEvent(
            message.command,
            message.data
          );
          void this.chatWebview?.postMessage({
            id: message.id,
            payload,
          });
        } catch (e) {
          Logger.error(`failed to handle event. message: ${message.data}`);
          void this.chatWebview?.postMessage({
            id: message.id,
            error: (e as Error).message,
          });
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  private onVisible(eventName: string) {
    void fireEvent({
      name: eventName,
      isVisible: !!this.chatWebviewView?.visible,
    });
  }

  handleMessageSubmitted(userInput: string) {
    setTimeout(
      () => {
        this.focusWebviewInput();
        void this.chatWebview?.postMessage({
          command: "submit-message",
          data: {
            input: userInput,
          },
        });
      },
      this.chatWebview ? 0 : 1000
    );
  }

  focusWebviewInput() {
    void vscode.commands.executeCommand("workbench.view.extension.tabnine");
    void this.chatWebviewView?.show(true);
    void this.chatWebview?.postMessage({
      command: "focus-input",
    });
  }

  clearAllConversations() {
    void this.chatWebview?.postMessage({
      command: "clear-all-conversations",
    });
  }

  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    const localWebviewView = webviewView;
    this.chatWebviewView = localWebviewView;
    this.chatWebview = localWebviewView.webview;
    localWebviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    this.init();

    if (process.env.NODE_ENV === "development") {
      return setDevWebviewHtml(localWebviewView);
    }
    return this.setWebviewHtml(localWebviewView);
  }

  setWebviewHtml(webviewView: WebviewView): void {
    const reactAppPath = path.join(
      process.env.TABNINE_CHAT_DIR ?? this.extensionPath,
      "chat",
      "index.html"
    );
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.html = fs.readFileSync(reactAppPath, "utf8");
  }
}

function setDevWebviewHtml(webviewView: WebviewView): void {
  axios
    .get<string>("http://localhost:3000/index.html")
    .then((response) => {
      const html = response.data
        .replace(/(href|src)="\//gi, (_, p1) => `${p1}="http://localhost:3000/`)
        .replace(
          'import RefreshRuntime from "/@react-refresh',
          'import RefreshRuntime from "http://localhost:3000/@react-refresh'
        );
      // eslint-disable-next-line no-param-reassign
      webviewView.webview.html = html;
    })
    .catch(() => {
      void vscode.window.showWarningMessage(
        "Please make sure you are running the chat app"
      );
    });
}
