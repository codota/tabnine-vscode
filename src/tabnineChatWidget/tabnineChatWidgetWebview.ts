import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import ChatViewProvider from "./ChatViewProvider";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";

const VIEW_ID = "tabnine.chat";

export default function registerTabnineChatWidgetWebview(
  context: ExtensionContext,
  serverUrl?: string
): void {
  if (
    typeof serverUrl === "string" || // we are in self hosted, and server url is configured
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) ||
    isCapabilityEnabled(Capability.TABNINE_CHAT)
  ) {
    registerWebview(context, serverUrl);
    void vscode.commands.executeCommand(
      "setContext",
      "tabnine.chat.ready",
      true
    );
  }
}

function registerWebview(context: ExtensionContext, serverUrl?: string): void {
  const chatProvider = new ChatViewProvider(context, serverUrl);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, chatProvider, {
      webviewOptions: {
        retainContextWhenHidden: true, // keeps the state of the webview even when it's not visible
      },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("tabnine.chat.focus-input", () => {
      chatProvider.focusWebviewInput();
    }),
    vscode.commands.registerCommand("tabnine.chat.history", () => {
      chatProvider.moveToView("history");
    }),
    vscode.commands.registerCommand(
      "tabnine.chat.create-new-conversation",
      () => {
        chatProvider.createNewConversation();
      }
    ),
    vscode.commands.registerCommand("tabnine.chat.clear-conversation", () => {
      chatProvider.clearConversation();
    }),
    vscode.commands.registerCommand("tabnine.chat.submit-feedback", () => {
      chatProvider.submitFeedback();
    }),
    vscode.commands.registerCommand("tabnine.chat.open-settings", () => {
      chatProvider.moveToView("settings");
    })
  );
}
