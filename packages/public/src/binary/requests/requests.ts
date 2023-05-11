import * as vscode from "vscode";
import CompletionOrigin from "../../CompletionOrigin";
import { StateType } from "../../globals/consts";
import { tabNineProcess } from "tabnine-vscode-common";

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

export function uninstalling(): Promise<unknown> {
  return tabNineProcess.request({ Uninstalling: {} });
}

type CapabilitiesResponse = {
  enabled_features: string[];
};

export async function getCapabilities(): Promise<
  CapabilitiesResponse | undefined | null
> {
  try {
    const result = await tabNineProcess.request<CapabilitiesResponse>(
      { Features: {} },
      7000
    );

    if (!Array.isArray(result?.enabled_features)) {
      throw new Error("Could not get enabled capabilities");
    }

    return result;
  } catch (error) {
    console.error(error);

    return { enabled_features: [] };
  }
}
