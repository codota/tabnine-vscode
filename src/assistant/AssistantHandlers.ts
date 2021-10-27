/* eslint-disable */
import * as vscode from "vscode";
import setState, {
  AssistantSelectionStateRequest,
} from "../binary/requests/setState";
import CompletionOrigin from "../CompletionOrigin";
import { StatePayload } from "../globals/consts";
import { ASSISTANT_IGNORE_REFRESH_COMMAND } from "./commands";
import { StateType } from "./utils";
import {
  clearCache,
  Completion,
  setIgnore,
  ASSISTANT_BINARY_VERSION,
} from "./AssistantClient";

const IGNORE_VALUE = "__IGNORE__";

export async function assistantClearCacheHandler(): Promise<void> {
  await clearCache();
  setState({
    [StatePayload.STATE]: { state_type: StateType.clearCache },
  });
}

// FIXME: try to find the exact type for the 3rd parameter...
export async function assistantSelectionHandler(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  { currentSuggestion, allSuggestions, reference, threshold }: any
): Promise<void> {
  try {
    const eventData = eventDataOf(
      editor,
      currentSuggestion,
      allSuggestions,
      reference,
      threshold,
      false
    );
    setState(eventData);
  } catch (error) {
    console.error(error);
  }
}

export async function assistantIgnoreHandler(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  { allSuggestions, reference, threshold, responseId }: any
): Promise<void> {
  try {
    await setIgnore(responseId);
    vscode.commands.executeCommand(ASSISTANT_IGNORE_REFRESH_COMMAND);
    const completion: Completion = {
      value: IGNORE_VALUE,
      score: 0,
    };
    const eventData = eventDataOf(
      editor,
      completion,
      allSuggestions,
      reference,
      threshold,
      true
    );
    setState(eventData);
  } catch (error) {
    console.error(error);
  }
}

function eventDataOf(
  editor: vscode.TextEditor,
  currentSuggestion: Completion,
  allSuggestions: Completion[],
  reference: string,
  threshold: string,
  isIgnore = false
): AssistantSelectionStateRequest {
  let index = allSuggestions.findIndex((sug) => sug === currentSuggestion);
  if (index === -1) {
    index = allSuggestions.length;
  }
  const suggestions = allSuggestions.map((sug) => {
    return {
      length: sug.value.length,
      strength: resolveDetailOf(sug),
      origin: CompletionOrigin.CLOUD,
    };
  });

  const { length } = currentSuggestion.value;
  const selectedSuggestion = currentSuggestion.value;
  const strength = resolveDetailOf(currentSuggestion);
  const origin = CompletionOrigin.CLOUD;
  const language = editor.document.fileName.split(".").pop();
  const numOfSuggestions = allSuggestions.length;

  const eventData: AssistantSelectionStateRequest = {
    AssistantSelection: {
      language: language!,
      length,
      strength,
      origin,
      index,
      threshold,
      num_of_suggestions: numOfSuggestions,
      suggestions,
      selected_suggestion: selectedSuggestion,
      reference,
      reference_length: reference.length,
      is_ignore: isIgnore,
      assistant_version: ASSISTANT_BINARY_VERSION,
    },
  };

  return eventData;
}

function resolveDetailOf(completion: Completion): string {
  return `${completion.score}%`;
}
