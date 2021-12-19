import * as vscode from "vscode";
import CompletionOrigin from "../../CompletionOrigin";
import Binary from "../Binary";
import { State } from "../state";
import { StateType } from "../../globals/consts";

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

export type ResultEntry = {
  new_prefix: string;
  old_suffix: string;
  new_suffix: string;

  kind?: vscode.CompletionItemKind;
  origin?: CompletionOrigin;
  detail?: string;
  documentation?: string | MarkdownStringSpec;
  deprecated?: boolean;
  completion_kind?: CompletionKind;
};

export type AutocompleteResult = {
  old_prefix: string;
  results: ResultEntry[];
  user_message: string[];
  is_locked: boolean;
};

export function initBinary(): Promise<void> {
  return tabNineProcess.init();
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
};

export enum SnippetRequestTrigger {
  Auto = "Auto",
  User = "User",
}

export type SnippetAutocompleteParams = AutocompleteParams & {
  trigger: SnippetRequestTrigger;
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

  console.error("No TabNine process");

  return Promise.resolve(null);
}

export function uninstalling(): Promise<unknown> {
  return tabNineProcess.request({ Uninstalling: {} });
}

export type CapabilitiesResponse = {
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
