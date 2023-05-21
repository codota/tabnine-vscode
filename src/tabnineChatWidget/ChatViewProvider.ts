import * as vscode from "vscode";
import * as path from 'path';
import { WebviewView, WebviewViewProvider } from "vscode";
import * as fs from 'fs';
import { ChatWebviewManager } from "./ChatWebviewManager";
import { WEBVIEW_COMMANDS } from "../../shared/chatWebviewCommands";
import { getState } from "../binary/requests/requests";

export default class ChatViewProvider implements WebviewViewProvider {
  private chatWebviewManager: ChatWebviewManager;

  constructor(private extensionPath: string) {
    this.chatWebviewManager = new ChatWebviewManager();
  }

  async init() {
    const token = await this.getToken();
    this.chatWebviewManager.sendMessage({
      command: WEBVIEW_COMMANDS.SEND_JWT,
      content: {
        token
      }
    });
  }

  async getToken(): Promise<string | undefined> {
    const state = await getState();
    return state?.access_token;
  }

  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    this.chatWebviewManager.setWebviewView(webviewView);
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    if (process.env.NODE_ENV === 'development') {
      return this.setDevWebviewHtml(webviewView);
    }
    return this.setWebviewHtml(webviewView);
  }

  setWebviewHtml(
    webviewView: WebviewView,
  ): void {
    const reactAppPath = path.join(this.extensionPath, 'chat', 'build', 'index.html')
    let html = fs.readFileSync(reactAppPath, 'utf8');
    html = html.replace(/(href|src)="\/static\//g, (_, p1) => {
      const attribute = p1; // href or src
      const uri = vscode.Uri.file(
        path.join(this.extensionPath, 'chat', 'build', 'static')
      );
      const webviewUri = webviewView.webview.asWebviewUri(uri);
      return `${attribute}="${webviewUri}/`;
    });
    webviewView.webview.html = html;
  }

  setDevWebviewHtml(
    webviewView: WebviewView,
  ): void {
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
            width: 10px;
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
          <script defer src="http://localhost:3000/static/js/bundle.js"></script>
          <div id="root"></div>
        </body>
        </html>
        `;
  }
}
