import * as vscode from "vscode";
import CompletionOrigin from "../../CompletionOrigin";
import Binary from "../Binary";
import { State } from "../state";
import { StateType } from "../../globals/consts";
import { Logger } from "../../utils/logger";

export const tabNineProcess = new Binary();

export type MarkdownStringSpec = {
  kind: string;
  value: string;
};

export enum CompletionKind {
  Classic = "Classic",
  Line = "Line",
  Snippet = "Snippet",
}

enum UserIntent {
  Comment,
  Block,
  FunctionDeclaration,
  NoScope,
  NewLine,
  CustomTriggerPoints,
}

type SnippetIntentMetadata = {
  current_line_indentation?: number;
  previous_line_indentation?: number;
  triggered_after_character?: string;
};

export interface SnippetContext extends Record<string, unknown> {
  snippet_id?: string;
  user_intent: UserIntent;
  intent_metadata?: SnippetIntentMetadata;
}

export type CompletionMetadata = {
  kind?: vscode.CompletionItemKind;
  origin?: CompletionOrigin;
  detail?: string;
  documentation?: string | MarkdownStringSpec;
  deprecated?: boolean;
  completion_kind?: CompletionKind;
  is_cached?: boolean;
  snippet_context?: SnippetContext;
};

export type ResultEntry = {
  new_prefix: string;
  old_suffix: string;
  new_suffix: string;
  completion_metadata?: CompletionMetadata;
};

export type AutocompleteResult = {
  old_prefix: string;
  results: ResultEntry[];
  user_message: string[];
  is_locked: boolean;
};

export function initBinary(processRunArgs: string[] = []): Promise<void> {
  return tabNineProcess.init(processRunArgs);
}

export function resetBinaryForTesting(): void {
  void tabNineProcess.resetBinaryForTesting();
}

export type AutocompleteParams = {
  filename: string;
  before: string;
  after: string;
  region_includes_beginning: boolean;
  region_includes_end: boolean;
  max_num_results: number;
  offset: number;
  line: number;
  character: number;
  indentation_size: number;
  cached_only?: boolean;
};

export function autocomplete(
  requestData: AutocompleteParams,
  timeout?: number
): Promise<AutocompleteResult | undefined | null> {
  return tabNineProcess.request<AutocompleteResult | undefined | null>(
    {
      Autocomplete: requestData,
    },
    timeout
  );
}

export function configuration(body: {
  quiet?: boolean;
  source: StateType;
}): Promise<{ message: string } | null | undefined> {
  return tabNineProcess.request(
    {
      Configuration: body,
    },
    5000
  );
}

export function getState(
  content: Record<string | number | symbol, unknown> = {}
): Promise<State | null | undefined> {
  return tabNineProcess.request<State>({ State: content });
}

interface Event extends Record<string, unknown> {
  name: string;
}

type EventResponse = Record<string, never>;

export function fireEvent(
  content: Event
): Promise<EventResponse | null | undefined> {
  return tabNineProcess.request<EventResponse>({
    Event: content,
  });
}

export function deactivate(): Promise<unknown> {
  if (tabNineProcess) {
    return tabNineProcess.request({ Deactivate: {} });
  }

  Logger.error("No TabNine process");

  return Promise.resolve(null);
}

export function uninstalling(): Promise<unknown> {
  return tabNineProcess.request({ Uninstalling: {} });
}

export enum ExperimentSource {
  API = "API",
  APIErrorResponse = "APIErrorResponse",
  Hardcoded = "Hardcoded",
  Unknown = "Unknown",
}

type CapabilitiesResponse = {
  enabled_features: string[];
  experiment_source?: ExperimentSource;
};

export async function getCapabilities(): Promise<
  CapabilitiesResponse | undefined | null
> {
  try {
    const result = await tabNineProcess.request<CapabilitiesResponse>(
      { Features: {} },
      20000
    );

    if (!Array.isArray(result?.enabled_features)) {
      throw new Error("Could not get enabled capabilities");
    }

    return result;
  } catch (error) {
    Logger.error(error);

    return { enabled_features: [] };
  }
}

export enum ChatCommunicationKind {
  Forward = "forward",
  Root = "root",
}

export type ChatCommunicationAddressResponse = {
  address: string;
};

export async function getChatCommunicatorAddress(
  kind: ChatCommunicationKind
): Promise<string> {
  const request = {
    ChatCommunicatorAddress: { kind },
  };

  let response = await tabNineProcess.request<ChatCommunicationAddressResponse>(
    request
  );

  // retry. Could happen in case of binary restart
  if (response === null) {
    response = await tabNineProcess.request<ChatCommunicationAddressResponse>(
      request
    );
  }

  if (!response?.address) {
    throw new Error("Could not get chat communication address");
  }

  return response.address;
}
