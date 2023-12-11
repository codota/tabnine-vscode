import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import ChatViewProvider from "./ChatViewProvider";
import { getState } from "../binary/requests/requests";
import { Logger } from "../utils/logger";
import { registerChatActionProvider } from "./extensionCommands/ChatActionProvider";
import { registerChatCommnmads } from "./extensionCommands/registerChatCommnmads";
import ChatEnabledState, { ChatNotEnabledReason } from "./ChatEnabledState";
import registerChatCodeLens from "./extensionCommands/ChatCodeLensProvider";

const VIEW_ID = "tabnine.chat";

export default function registerTabnineChatWidgetWebview(
  context: ExtensionContext,
  chatEnabledState: ChatEnabledState,
  chatProvider: ChatViewProvider
): void {
  if (process.env.IS_EVAL_MODE === "true") {
    void vscode.commands.executeCommand(
      "setContext",
      "tabnine.chat.eval",
      true
    );
  }

  setTabnineChatWebview("loading");

  context.subscriptions.push(
    chatEnabledState.onChange((state) => {
      if (state.enabled) {
        registerChatView(context, chatProvider);
      } else if (state.chatNotEnabledReason) {
        setContextForChatNotEnabled(state.chatNotEnabledReason);
      }
    })
  );
}

function setContextForChatNotEnabled(reason: ChatNotEnabledReason) {
  setChatReady(false);
  setTabnineChatWebview(reason);
}

let hasRegisteredChatWebview = false;

function registerChatView(
  context: vscode.ExtensionContext,
  chatProvider: ChatViewProvider
) {
  if (!hasRegisteredChatWebview) {
    registerWebview(context, chatProvider);
  }

  setTabnineChatWebview("chat");
  setChatReady(true);

  getState()
    .then((state) => {
      void vscode.commands.executeCommand(
        "setContext",
        "tabnine.chat.settings-ready",
        state?.service_level !== "Business"
      );
    })
    .catch((e) => Logger.error(`Failed to get the user state ${e}`));
}

function registerWebview(
  context: ExtensionContext,
  chatProvider: ChatViewProvider
): void {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(VIEW_ID, chatProvider, {
      webviewOptions: {
        retainContextWhenHidden: true, // keeps the state of the webview even when it's not visible
      },
    })
  );

  const evalCommands =
    process.env.IS_EVAL_MODE === "true"
      ? [
          vscode.commands.registerCommand(
            "tabnine.chat.submit-message",
            (message: string) => {
              void chatProvider.handleMessageSubmitted(message);
            }
          ),
          vscode.commands.registerCommand(
            "tabnine.chat.clear-all-conversations",
            () => {
              chatProvider.clearAllConversations();
            }
          ),
        ]
      : [];

  context.subscriptions.push(
    ...evalCommands,
    vscode.commands.registerCommand("tabnine.chat.focus-input", () => {
      void chatProvider.focusChatInput();
    })
  );
  context.subscriptions.push(registerChatCommnmads(chatProvider));
  registerChatActionProvider(context);
  registerChatCodeLens(context);

  hasRegisteredChatWebview = true;
}

function setTabnineChatWebview(
  webviewName: ChatNotEnabledReason | "chat" | "loading"
) {
  void vscode.commands.executeCommand(
    "setContext",
    "tabnine.chat.webview",
    webviewName
  );
}

function setChatReady(ready: boolean) {
  void vscode.commands.executeCommand(
    "setContext",
    "tabnine.chat.ready",
    ready
  );
}
