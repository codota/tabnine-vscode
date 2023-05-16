import * as vscode from "vscode";
import * as path from 'path';
import { WebviewView, WebviewViewProvider } from "vscode";

export default class ChatViewProvider implements WebviewViewProvider {

  constructor(private extensionPath: string,) { }

  // eslint-disable-next-line class-methods-use-this
  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    // eslint-disable-next-line no-param-reassign
    webviewView.webview.options = {
      enableScripts: true,
      enableCommandUris: true,
    };

    return this.setWebviewHtml(webviewView);
  }

  setWebviewHtml(
    webviewView: WebviewView,
  ): void {
    // Use the Uri.file utility to get a file URI to the bundled JS file
    const scriptFile = vscode.Uri.file(
      path.join(this.extensionPath, 'chat', 'build', 'static', 'js', 'main.85a675ab.js')
    );

    // Use the webview.asWebviewUri utility to get a URI that can be loaded by the webview
    const scriptUri = webviewView.webview.asWebviewUri(scriptFile);

    webviewView.webview.html = `
          <!DOCTYPE html>
          <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Your Webview</title>
            </head>
            <body>
              <div id="root"></div>
              <script src="${scriptUri}"></script>
            </body>
          </html>`;
  }
}
