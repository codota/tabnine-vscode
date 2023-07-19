import * as vscode from "vscode";
import setState, {
  AssistantSelectionStateRequest,
} from "../binary/requests/setState";
import CompletionOrigin from "../CompletionOrigin";
import { StatePayload } from "../globals/consts";
import { StateType } from "./utils";
import clearCache from "./requests/clearCache";
import { Completion } from "./Completion";
import setIgnore from "./requests/setIgnore";
import { getAssistantVersion } from "./requests/request";
import { ASSISTANT_IGNORE_REFRESH_COMMAND } from "./globals";
import { IgnoreAssistantSelection } from "./IgnoreAssistantSelection";
import { AcceptAssistantSelection } from "./AcceptAssistantSelection";
import { setDecorators } from "./diagnostics";
import { Logger } from "../utils/logger";

const IGNORE_VALUE = "__IGNORE__";

export async function assistantClearCacheHandler(): Promise<void> {
  await clearCache();
  void setState({
    [StatePayload.STATE]: { state_type: StateType.clearCache },
  });
}

export async function assistantSelectionHandler(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  {
    currentSuggestion,
    allSuggestions,
    reference,
    threshold,
  }: AcceptAssistantSelection
): Promise<void> {
  try {
    setDecorators([]);
    await vscode.commands.executeCommand(ASSISTANT_IGNORE_REFRESH_COMMAND);
    const assistantVersion = await getAssistantVersion();
    const eventData = eventDataOf(
      editor,
      currentSuggestion,
      allSuggestions,
      reference,
      threshold,
      false,
      assistantVersion
    );
    void setState(eventData);
  } catch (error) {
    Logger.error(error);
  }
}

export async function assistantIgnoreHandler(
  editor: vscode.TextEditor,
  edit: vscode.TextEditorEdit,
  { allSuggestions, reference, threshold, responseId }: IgnoreAssistantSelection
): Promise<void> {
  try {
    await setIgnore(responseId);
    setDecorators([]);
    const assistantVersion = await getAssistantVersion();

    void vscode.commands.executeCommand(ASSISTANT_IGNORE_REFRESH_COMMAND);
    const completion: Completion = {
      value: IGNORE_VALUE,
      score: 0,
      message: "",
    };
    const eventData = eventDataOf(
      editor,
      completion,
      allSuggestions,
      reference,
      threshold,
      true,
      assistantVersion
    );
    void setState(eventData);
  } catch (error) {
    Logger.error(error);
  }
}

function eventDataOf(
  editor: vscode.TextEditor,
  currentSuggestion: Completion,
  allSuggestions: Completion[],
  reference: string,
  threshold: string,
  isIgnore = false,
  assistantVersion: string
): AssistantSelectionStateRequest {
  let index = allSuggestions.findIndex((sug) => sug === currentSuggestion);
  if (index === -1) {
    index = allSuggestions.length;
  }
  const suggestions = allSuggestions.map((sug) => ({
    length: sug.value.length,
    strength: resolveDetailOf(sug),
    origin: CompletionOrigin.CLOUD,
  }));

  const { length } = currentSuggestion.value;
  const selectedSuggestion = currentSuggestion.value;
  const strength = resolveDetailOf(currentSuggestion);
  const origin = CompletionOrigin.CLOUD;
  const language = editor.document.fileName.split(".").pop() || "";
  const numOfSuggestions = allSuggestions.length;

  const eventData: AssistantSelectionStateRequest = {
    AssistantSelection: {
      language,
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
      assistant_version: assistantVersion,
    },
  };

  return eventData;
}

function resolveDetailOf(completion: Completion): string {
  return `${completion.score}%`;
}
