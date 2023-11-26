import * as vscode from "vscode";
import { ExtensionContext } from "vscode";
import ChatViewProvider from "./ChatViewProvider";
import { getState } from "../binary/requests/requests";
import { Logger } from "../utils/logger";
import { registerChatQuickFix } from "./extensionCommands/quickFix";
import registerChatCodeLens from "./extensionCommands/codeLens";
import ChatEnabledState, { ChatNotEnabledReason } from "./ChatEnabledState";

const VIEW_ID = "tabnine.chat";

export default function registerTabnineChatWidgetWebview(
  context: ExtensionContext,
  chatEnabledState: ChatEnabledState,
  serverUrl?: string
): void {
  if (process.env.IS_EVAL_MODE === "true") {
    void vscode.commands.executeCommand(
      "setContext",
      "tabnine.chat.eval",
      true
    );
  }

  context.subscriptions.push(
    chatEnabledState.useState((state) => {
      if (state.enabled) {
        registerChatView(serverUrl, context);
      } else if (state.chatNotEnabledReason) {
        setContextForChatNotEnabled(state.chatNotEnabledReason);
      }
    })
  );
}

function setContextForChatNotEnabled(reason: ChatNotEnabledReason) {
  setChatReady(false);
  setNotEnabledReasonContext(reason);
}

function registerChatView(
  serverUrl: string | undefined,
  context: vscode.ExtensionContext
) {
  registerWebview(context, serverUrl);
  setNotEnabledReasonContext(null);
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

function registerWebview(context: ExtensionContext, serverUrl?: string): void {
  const chatProvider = new ChatViewProvider(context, serverUrl);

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
    }),
    vscode.commands.registerCommand("tabnine.chat.commands.explain-code", () =>
      chatProvider.handleMessageSubmitted("/explain-code")
    ),
    vscode.commands.registerCommand(
      "tabnine.chat.commands.generate-tests",
      () => chatProvider.handleMessageSubmitted("/generate-test-for-code")
    ),
    vscode.commands.registerCommand("tabnine.chat.commands.document-code", () =>
      chatProvider.handleMessageSubmitted("/document-code")
    ),
    vscode.commands.registerCommand("tabnine.chat.commands.fix-code", () =>
      chatProvider.handleMessageSubmitted("/fix-code")
    )
  );
  registerChatQuickFix(context, chatProvider);
  registerChatCodeLens(context, chatProvider);
}

function setNotEnabledReasonContext(reason: ChatNotEnabledReason | null) {
  void vscode.commands.executeCommand(
    "setContext",
    "tabnine.chat.not_enabled_reason",
    reason
  );
}

function setChatReady(ready: boolean) {
  void vscode.commands.executeCommand(
    "setContext",
    "tabnine.chat.ready",
    ready
  );
}
