import * as vscode from "vscode";
import { ColorThemeKind } from "vscode";
import { getState } from "../binary/requests/requests";
import { sendEvent } from "../binary/requests/sendEvent";
import { chatEventRegistry } from "./chatEventRegistry";
import { insertTextAtCursor } from "./handlers/insertAtCursor";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import { resolveSymbols } from "./handlers/resolveSymbols";
import { peekDefinition } from "./handlers/peekDefinition";
import { ServiceLevel } from "../binary/state";
import {
  BasicContext,
  getBasicContext,
} from "./handlers/context/basicContextHandler";
import {
  EnrichingContextRequestPayload,
  EnrichingContextResponsePayload,
  getEnrichingContext,
} from "./handlers/context/enrichingContextHandler";

type GetUserResponse = {
  token: string;
  username: string;
  serviceLevel: ServiceLevel;
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
  serverUrl?: string;
};

type ChatSettings = {
  isTelemetryEnabled?: boolean;
};

const CHAT_CONVERSATIONS_KEY = "CHAT_CONVERSATIONS";
const CHAT_SETTINGS_KEY = "CHAT_SETTINGS";

export function initChatApi(
  context: vscode.ExtensionContext,
  serverUrl?: string
) {
  chatEventRegistry.registerEvent<void, InitResponse>("init", async () =>
    Promise.resolve({
      ide: "vscode",
      isDarkTheme: [ColorThemeKind.HighContrast, ColorThemeKind.Dark].includes(
        vscode.window.activeColorTheme.kind
      ),
      isTelemetryEnabled: isCapabilityEnabled(Capability.ALPHA_CAPABILITY),
      serverUrl,
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
        serviceLevel: state.service_level,
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

  chatEventRegistry.registerEvent<void, BasicContext>(
    "get_basic_context",
    getBasicContext
  );

  chatEventRegistry.registerEvent<
    EnrichingContextRequestPayload,
    EnrichingContextResponsePayload
  >("get_enriching_context", getEnrichingContext);

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
      const chatState = context.globalState.get(CHAT_CONVERSATIONS_KEY, {
        conversations: {},
      }) as ChatState;
      chatState.conversations[conversation.id] = {
        id: conversation.id,
        messages: conversation.messages,
      };
      await context.globalState.update(CHAT_CONVERSATIONS_KEY, chatState);
    }
  );

  chatEventRegistry.registerEvent<void, ChatState>(
    "get_chat_state",
    () =>
      context.globalState.get(CHAT_CONVERSATIONS_KEY, {
        conversations: {},
      }) as ChatState
  );

  chatEventRegistry.registerEvent<void, void>(
    "clear_all_chat_conversations",
    async () =>
      context.globalState.update(CHAT_CONVERSATIONS_KEY, {
        conversations: {},
      })
  );

  chatEventRegistry.registerEvent<void, ChatSettings>(
    "get_settings",
    () => context.globalState.get(CHAT_SETTINGS_KEY, {}) as ChatSettings
  );

  chatEventRegistry.registerEvent<ChatSettings, void>(
    "update_settings",
    async (chatSettings) => {
      await context.globalState.update(CHAT_SETTINGS_KEY, chatSettings);
    }
  );
}
