import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import ChatViewProvider from "./ChatViewProvider";

const VIEW_ID = "tabnine.chat";

export default function registerTabnineChatWidgetWebview(
  context: ExtensionContext
): void {
  const chatProvider = new ChatViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, chatProvider, {
      webviewOptions: {
        retainContextWhenHidden: true, // keeps the state of the webview even when it's not visible
      },
    })
  );

  vscode.commands.registerCommand("tabnine.chat.submit-message", async () => {
    const userInput = await vscode.window.showInputBox({
      placeHolder: "Explain the selected code",
      prompt: "Ask Tabnine chat a question",
    });

    if (userInput) {
      chatProvider.handleMessageSubmitted(userInput);
    }
  });
}
