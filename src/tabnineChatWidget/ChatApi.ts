import * as vscode from "vscode";
import { ColorThemeKind } from "vscode";
import {
  getState,
  getChatCommunicatorAddress,
  ChatCommunicationKind,
  getCapabilities,
} from "../binary/requests/requests";
import { sendEvent } from "../binary/requests/sendEvent";
import { InserCode, insertTextAtCursor } from "./handlers/insertAtCursor";
import { resolveSymbols } from "./handlers/resolveSymbols";
import { peekDefinition } from "./handlers/peekDefinition";
import { ServiceLevel } from "../binary/state";
import { GET_CHAT_STATE_COMMAND } from "../globals/consts";
import {
  BasicContext,
  getBasicContext,
} from "./handlers/context/basicContextHandler";
import {
  EnrichingContextRequestPayload,
  EnrichingContextResponsePayload,
  getEnrichingContext,
} from "./handlers/context/enrichingContextHandler";
import {
  SelectedCodeResponsePayload,
  getSelectedCode,
} from "./handlers/context/editorContext";
import {
  NavigateToLocationPayload,
  navigateToLocation,
} from "./handlers/navigateToLocation";
import { getWorkspaceRootPaths } from "../utils/workspaceFolders";
import { EventRegistry } from "./EventRegistry";

type GetUserResponse = {
  token: string;
  username: string;
  serviceLevel: ServiceLevel;
  avatarUrl?: string;
};

type GetCapabilitiesResponse = {
  enabledFeatures: string[];
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

type InitResponse = {
  ide: string;
  isDarkTheme: boolean;
  isTelemetryEnabled?: boolean;
  serverUrl?: string;
  isSelfHosted: boolean;
};

type ChatSettings = {
  isTelemetryEnabled?: boolean;
};

type ServerUrl = {
  serverUrl: string;
};

type ServerUrlRequest = {
  kind: ChatCommunicationKind;
};

type WorkspaceFolders = {
  rootPaths: string[];
};

const CHAT_CONVERSATIONS_KEY = "CHAT_CONVERSATIONS";
const CHAT_SETTINGS_KEY = "CHAT_SETTINGS";

type APIConfig = {
  serverUrl?: string | undefined;
  isSelfHosted: boolean;
  isTelemetryEnabled: boolean;
};

export class ChatAPI {
  private ready = new vscode.EventEmitter<void>();

  private chatEventRegistry = new EventRegistry();

  public onReady = new Promise((resolve) => {
    this.ready.event(resolve);
  });

  constructor(context: vscode.ExtensionContext, config: APIConfig) {
    if (process.env.IS_EVAL_MODE === "true") {
      context.subscriptions.push(
        vscode.commands.registerCommand(
          GET_CHAT_STATE_COMMAND,
          () =>
            context.globalState.get(CHAT_CONVERSATIONS_KEY, {
              conversations: {},
            }) as ChatState
        )
      );
    }

    this.chatEventRegistry
      .registerEvent<void, InitResponse>("init", async () => {
        this.ready.fire();
        return Promise.resolve({
          ide: "vscode",
          isDarkTheme: [
            ColorThemeKind.HighContrast,
            ColorThemeKind.Dark,
          ].includes(vscode.window.activeColorTheme.kind),
          ...config,
        });
      })
      .registerEvent<void, GetUserResponse>("get_user", async () => {
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
      })
      .registerEvent<void, GetCapabilitiesResponse>(
        "get_capabilities",
        async () => {
          const capabilitiesResponse = await getCapabilities();
          if (!capabilitiesResponse) {
            throw new Error("capabilities response is undefined");
          }
          return {
            enabledFeatures: capabilitiesResponse.enabled_features,
          };
        }
      )
      .registerEvent<SendEventRequest, void>(
        "send_event",
        async (req: SendEventRequest) => {
          await sendEvent({
            name: req.eventName,
            properties: req.properties,
          });
        }
      )
      .registerEvent<void, BasicContext>("get_basic_context", getBasicContext)
      .registerEvent<
        EnrichingContextRequestPayload,
        EnrichingContextResponsePayload
      >("get_enriching_context", getEnrichingContext)
      .registerEvent<void, SelectedCodeResponsePayload>(
        "get_selected_code",
        getSelectedCode
      )
      .registerEvent<InserCode, void>("insert_at_cursor", insertTextAtCursor)
      .registerEvent<
        { symbol: string },
        vscode.SymbolInformation[] | undefined
      >("resolve_symbols", resolveSymbols)
      .registerEvent<{ symbols: vscode.SymbolInformation[] }, void>(
        "peek_definition",
        peekDefinition
      )
      .registerEvent<NavigateToLocationPayload, void>(
        "navigate_to_location",
        navigateToLocation
      )
      .registerEvent<ChatConversation, void>(
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
      )
      .registerEvent<void, ChatState>(
        "get_chat_state",
        () =>
          context.globalState.get(CHAT_CONVERSATIONS_KEY, {
            conversations: {},
          }) as ChatState
      )
      .registerEvent<void, void>("clear_all_chat_conversations", async () =>
        context.globalState.update(CHAT_CONVERSATIONS_KEY, {
          conversations: {},
        })
      )
      .registerEvent<void, ChatSettings>(
        "get_settings",
        () => context.globalState.get(CHAT_SETTINGS_KEY, {}) as ChatSettings
      )
      .registerEvent<ChatSettings, void>(
        "update_settings",
        async (chatSettings) => {
          await context.globalState.update(CHAT_SETTINGS_KEY, chatSettings);
        }
      )
      .registerEvent<ServerUrlRequest, ServerUrl>(
        "get_server_url",
        async (request) => {
          const serverUri = vscode.Uri.parse(
            await getChatCommunicatorAddress(request.kind)
          );

          let externalServerUrl = (
            await vscode.env.asExternalUri(serverUri)
          ).toString();

          if (externalServerUrl.endsWith("/")) {
            externalServerUrl = externalServerUrl.slice(0, -1);
          }

          return {
            serverUrl: externalServerUrl,
          };
        }
      )
      .registerEvent<void, WorkspaceFolders | undefined>(
        "workspace_folders",
        () => {
          const rootPaths = getWorkspaceRootPaths();
          if (!rootPaths) return undefined;

          return {
            rootPaths,
          };
        }
      );
  }

  async handleEvent<Req, Res>(
    event: string,
    requestPayload: Req
  ): Promise<Res> {
    return this.chatEventRegistry.handleEvent(event, requestPayload);
  }
}
