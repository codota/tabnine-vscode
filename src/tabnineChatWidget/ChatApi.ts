import * as vscode from "vscode";
import { ColorThemeKind } from "vscode";
import { getState } from "../binary/requests/requests";
import { sendEvent } from "../binary/requests/sendEvent";
import { chatEventRegistry } from "./chatEventRegistry";
import {
  EditorContextRequest,
  EditorContextResponse,
  getEditorContext,
} from "./handlers/getEditorContextHandler";
import { insertTextAtCursor } from "./handlers/insertAtCursor";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { resolveSymbols } from "./handlers/resolveSymbols";
import { peekDefinition } from "./handlers/peekDefinition";

type GetUserResponse = {
  token: string;
  username: string;
  avatarUrl?: string;
};

type SendEventRequest = {
  eventName: string;
  properties?: { [key: string]: string };
};

type ChatMessageProps = {
  text: string;
  isBot: boolean;
  timestamp: string;
};

type ChatConversation = {
  id: string;
  messages: ChatMessageProps[];
};

type ChatState = {
  conversations: { [id: string]: ChatConversation };
};

type InserCode = {
  code: string;
};

type InitResponse = {
  ide: string;
  isDarkTheme: boolean;
  isTelemetryEnabled?: boolean;
};

const CHAT_CONVERSATIONS_KEY = "CHAT_CONVERSATIONS";

export function initChatApi(context: vscode.ExtensionContext) {
  chatEventRegistry.registerEvent<void, InitResponse>("init", async () =>
    Promise.resolve({
      ide: "vscode",
      isDarkTheme: vscode.window.activeColorTheme.kind === ColorThemeKind.Dark,
      isTelemetryEnabled: isCapabilityEnabled(Capability.ALPHA_CAPABILITY),
    })
  );

  chatEventRegistry.registerEvent<void, GetUserResponse>(
    "get_user",
    async () => {
      const state = await getState();
      if (!state) {
        throw new Error("state is undefined");
      }
      if (!state.access_token) {
        throw new Error("state has no access token");
      }
      return {
        token: state.access_token,
        username: state.user_name,
        avatarUrl: state.user_avatar_url,
      };
    }
  );

  chatEventRegistry.registerEvent<SendEventRequest, void>(
    "send_event",
    async (req: SendEventRequest) => {
      await sendEvent({
        name: req.eventName,
        properties: req.properties,
      });
    }
  );

  chatEventRegistry.registerEvent<EditorContextRequest, EditorContextResponse>(
    "get_editor_context",
    getEditorContext
  );

  chatEventRegistry.registerEvent<InserCode, void>(
    "insert-at-cursor",
    insertTextAtCursor
  );
  chatEventRegistry.registerEvent<
    { symbol: string },
    vscode.SymbolInformation[] | undefined
  >("resolve-symbols", resolveSymbols);

  chatEventRegistry.registerEvent<
    { symbols: vscode.SymbolInformation[] },
    void
  >("peek-definition", peekDefinition);

  chatEventRegistry.registerEvent<ChatConversation, void>(
    "update_chat_conversation",
    async (conversation) => {
      let chatState = (await context.globalState.get(
        CHAT_CONVERSATIONS_KEY
      )) as ChatState;
      if (!chatState) {
        chatState = {
          conversations: {},
        };
      }
      chatState.conversations[conversation.id] = {
        id: conversation.id,
        messages: conversation.messages,
      };
      await context.globalState.update(CHAT_CONVERSATIONS_KEY, chatState);
    }
  );

  chatEventRegistry.registerEvent<void, ChatState>(
    "get_chat_state",
    async () => {
      let chatState = (await context.globalState.get(
        CHAT_CONVERSATIONS_KEY
      )) as ChatState;
      if (!chatState) {
        chatState = {
          conversations: {},
        };
      }
      return chatState;
    }
  );

  chatEventRegistry.registerEvent<void, void>(
    "clear_all_chat_conversations",
    async () => {
      let chatState = (await context.globalState.get(
        CHAT_CONVERSATIONS_KEY
      )) as ChatState;
      if (!chatState) {
        return;
      }
      chatState = {
        conversations: {},
      };
      await context.globalState.update(CHAT_CONVERSATIONS_KEY, chatState);
    }
  );
}
