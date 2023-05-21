import * as vscode from "vscode";

type Message = {
    command: string;
    content?: object;
};

export class ChatWebviewManager {
    private webviewView?: vscode.WebviewView;

    public setWebviewView(webviewView: vscode.WebviewView) {
        this.webviewView = webviewView;
    }

    public sendMessage(message: Message) {
        this.webviewView?.webview.postMessage(message);
    }
}