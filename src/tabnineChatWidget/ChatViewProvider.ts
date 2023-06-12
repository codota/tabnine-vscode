import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ExtensionContext, WebviewView, WebviewViewProvider } from "vscode";
import { chatEventRegistry } from "./chatEventRegistry";
import { initChatApi } from "./ChatApi";

type View = "history";

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

  constructor(private context: ExtensionContext) {
    this.extensionPath = context.extensionPath;
    initChatApi(context);
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

  showWebview() {
    void vscode.commands.executeCommand(
      "workbench.view.extension.tabnine-access"
    );
    void this.chatWebviewView?.show(true);
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
      this.extensionPath,
      "chat",
      "build",
      "index.html"
    );
    let html: string = fs.readFileSync(reactAppPath, "utf8");
    html = html.replace(/(href|src)="\/static\//g, (_, p1) => {
      // eslint-disable-next-line
      const attribute = p1;
      const uri = vscode.Uri.file(
        path.join(this.extensionPath, "chat", "build", "static")
      );
      const webviewUri = webviewView.webview.asWebviewUri(uri).toString();
      return `${attribute}="${webviewUri}/`;
    });
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.html = html;
  }
}

function setDevWebviewHtml(webviewView: WebviewView): void {
  const jsFile = "vscode.js";
  const localServerUrl = "http://localhost:3000";
  const scriptUrl = `${localServerUrl}/${jsFile}`;
  // eslint-disable-next-line no-param-reassign
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
