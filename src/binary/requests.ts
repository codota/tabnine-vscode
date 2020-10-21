import * as vscode from "vscode";
import CompletionOrigin from "../CompletionOrigin";
import Binary from "./Binary";
import { State } from "./state";

export const tabNineProcess = new Binary();

export type AutocompleteResult = {
  old_prefix: string;
  results: ResultEntry[];
  user_message: string[];
};

export type ResultEntry = {
  new_prefix: string;
  old_suffix: string;
  new_suffix: string;

  kind?: vscode.CompletionItemKind;
  origin?: CompletionOrigin;
  detail?: string;
  documentation?: string | MarkdownStringSpec;
  deprecated?: boolean;
};

export type MarkdownStringSpec = {
  kind: string;
  value: string;
};

export function autocomplete(requestData: {
  filename: string;
  before: string;
  after: string;
  region_includes_beginning: boolean;
  region_includes_end: boolean;
  max_num_results: number;
}): Promise<AutocompleteResult> {
  return tabNineProcess.request({
    Autocomplete: requestData,
  });
}

export function configuration(
  body: { quiet?: boolean } = {}
): Promise<{ message: string }> {
  return tabNineProcess.request(
    {
      Configuration: body,
    },
    5000
  );
}

export function setState(state) {
  return tabNineProcess.request({ SetState: { state_type: state } });
}

export function getState(content: Record<any, any> = {}) {
  return tabNineProcess.request<State>({ State: content });
}

export function deactivate() {
  if (tabNineProcess) {
    return tabNineProcess.request({ Deactivate: {} });
  }

  console.error("No TabNine process");
}

export function uninstalling() {
  return tabNineProcess.request({ Uninstalling: {} });
}

type CapabilitiesResponse = {
  enabled_features: string[];
};
export async function getCapabilities(): Promise<CapabilitiesResponse> {
  try {
    let result = await tabNineProcess.request<CapabilitiesResponse>(
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
