import * as vscode from "vscode";
import * as path from 'path';
import { WebviewView, WebviewViewProvider } from "vscode";
import * as fs from 'fs';

export default class ChatViewProvider implements WebviewViewProvider {

  constructor(private extensionPath: string,) { }

  // eslint-disable-next-line class-methods-use-this
  resolveWebviewView(webviewView: WebviewView): void | Thenable<void> {
    // eslint-disable-next-line no-param-reassign
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
    try {
      const reactAppPath = path.join(this.extensionPath, 'chat', 'build', 'index.html')
      let html = fs.readFileSync(reactAppPath, 'utf8');
      html = html.replace(/(href|src)="\/static\//g, (match, p1) => {
        const attribute = p1; // href or src
        const uri = vscode.Uri.file(
          path.join(this.extensionPath, 'chat', 'build', 'static')
        );
        const webviewUri = webviewView.webview.asWebviewUri(uri);
        return `${attribute}="${webviewUri}/`;
      });
      webviewView.webview.html = html;
    } catch (e) {
      console.log(e);
    }
  }

  setDevWebviewHtml(
    webviewView: WebviewView,
  ): void {
    webviewView.webview.html = `
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              margin: 0;
              padding: 0;
              height: 99vh;
            }
          </style>
        </head>
        <body>
        <iframe src="http://localhost:3000" frameBorder="0" width="100%" height="100%"></iframe>
        </body>
        </html>
        `;
  }
}
