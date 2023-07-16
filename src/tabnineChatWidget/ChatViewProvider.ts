import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ExtensionContext, WebviewView, WebviewViewProvider } from "vscode";
import { chatEventRegistry } from "./chatEventRegistry";
import { initChatApi } from "./ChatApi";

type View = "history" | "settings";

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
          console.error("failed to handle event. message:", message);
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

  handleMessageSubmitted(userInput: string) {
    setTimeout(
      () => {
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
    void vscode.commands.executeCommand(
      "workbench.view.extension.tabnine-access"
    );
    void this.chatWebviewView?.show(true);
    void this.chatWebview?.postMessage({
      command: "focus-input",
    });
  }

  moveToView(view: View) {
    void this.chatWebview?.postMessage({
      command: "move-to-view",
      data: {
        view,
      },
    });
  }

  createNewConversation() {
    void this.chatWebview?.postMessage({
      command: "create-new-conversation",
    });
  }

  clearConversation() {
    void this.chatWebview?.postMessage({
      command: "clear-conversation",
    });
  }

  submitFeedback() {
    void this.chatWebview?.postMessage({
      command: "submit-feedback",
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
    const reactAppPath = path.join(this.extensionPath, "chat", "index.html");
    let html: string = fs.readFileSync(reactAppPath, "utf8");
    html = html.replace(/(href|src)="\/static\//g, (_, p1) => {
      // eslint-disable-next-line
      const attribute = p1;
      const uri = vscode.Uri.file(
        path.join(this.extensionPath, "chat", "static")
      );
      const webviewUri = webviewView.webview.asWebviewUri(uri).toString();
      return `${attribute}="${webviewUri}/`;
    });
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.html = html;
  }
}

function setDevWebviewHtml(webviewView: WebviewView): void {
  webviewView.webview.html = `
    <iframe src="http://localhost:3000?dev" id="config" frameborder="0" style="display: block; margin: 0; padding: 0; position: absolute; min-width: 100%; min-height: 100%; visibility: visible;"></iframe>
    <script>
        const iframe = document.querySelector("#config").contentWindow;
        const vscodeApi = window.acquireVsCodeApi();
        window.addEventListener("message", (e) => {
          if(event.source === iframe){
            vscodeApi.postMessage(e.data);
          }
          else{
            iframe.postMessage(e.data, "*");
          }
        });
      </script>
  `;
}
