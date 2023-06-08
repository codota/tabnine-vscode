import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ExtensionContext, WebviewView, WebviewViewProvider } from "vscode";
import { chatEventRegistry } from "./chatEventRegistry";
import { initChatApi } from "./ChatApi";

type View = "history";

export default class ChatViewProvider implements WebviewViewProvider {
  private chatWebviewView?: vscode.WebviewView;
  private chatWebview?: vscode.Webview;
  private extensionPath: string;

  constructor(private context: ExtensionContext) {
    this.extensionPath = context.extensionPath;
    initChatApi(context);
  }

  private init() {
    if (!this.chatWebview) {
      return;
    }

    this.chatWebview.onDidReceiveMessage(
      async (message) => {
        try {
          const payload = await chatEventRegistry.handleEvent(
            message.command,
            message.data
          );
          this.chatWebview?.postMessage({
            id: message.id,
            payload,
          });
        } catch (e) {
          console.error("failed to handle event. message:", message);
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  async handleMessageSubmitted(userInput: string) {
    setTimeout(
      () => {
        this.chatWebview?.postMessage({
          command: "submit-message",
          data: {
            input: userInput,
          },
        });
      },
      this.chatWebview ? 0 : 1000
    );
  }

  async showWebview() {
    await vscode.commands.executeCommand(
      "workbench.view.extension.tabnine-access"
    );
    this.chatWebviewView?.show(true);
  }

  async moveToView(view: View) {
    this.chatWebview?.postMessage({
      command: "move-to-view",
      data: {
        view,
      },
    });
  }

  createNewConversation() {
    this.chatWebview?.postMessage({
      command: "create-new-conversation",
    });
  }

  clearConversation() {
    this.chatWebview?.postMessage({
      command: "clear-conversation",
    });
  }

  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    this.chatWebviewView = webviewView;
    this.chatWebview = webviewView.webview;
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    this.init();

    if (process.env.NODE_ENV === "development") {
      return this.setDevWebviewHtml(webviewView);
    }
    return this.setWebviewHtml(webviewView);
  }

  setWebviewHtml(webviewView: WebviewView): void {
    const reactAppPath = path.join(
      this.extensionPath,
      "chat",
      "build",
      "index.html"
    );
    let html = fs.readFileSync(reactAppPath, "utf8");
    html = html.replace(/(href|src)="\/static\//g, (_, p1) => {
      const attribute = p1; // href or src
      const uri = vscode.Uri.file(
        path.join(this.extensionPath, "chat", "build", "static")
      );
      const webviewUri = webviewView.webview.asWebviewUri(uri);
      return `${attribute}="${webviewUri}/`;
    });
    webviewView.webview.html = html;
  }

  setDevWebviewHtml(webviewView: WebviewView): void {
    const jsFile = "vscode.js";
    const localServerUrl = "http://localhost:3000";
    const scriptUrl = `${localServerUrl}/${jsFile}`;
    webviewView.webview.html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style type="text/css">
          body,
          html,
          div#root {
            margin: 0;
            padding: 0;
            border: 0;
            width: 100%;
            height: 100%;
            -webkit-box-sizing: border-box;
            box-sizing: border-box;
            font-family: sans-serif;
          }
      
          *,
          *::before,
          *::after {
            -webkit-box-sizing: inherit;
            box-sizing: inherit;
          }
      
          /* width */
          ::-webkit-scrollbar {
            width: 6px;
          }
      
          /* Track */
          ::-webkit-scrollbar-track {
            background: transparent;
          }
      
          /* Handle */
          ::-webkit-scrollbar-thumb {
            background: #888;
          }
      
          /* Handle on hover */
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        </style>
        </head>
        <body>
          <script defer src="${scriptUrl}"></script>
          <div id="root"></div>
        </body>
        </html>
        `;
  }
}
