import * as vscode from "vscode";
import { tabNineProcess } from "../TabNine";
import { Completion } from "./ValidatorClient";
import { CompletionOrigin } from "../extension";
import { setIgnore } from "./ValidatorClient";
import { VALIDATOR_IGNORE_REFRESH_COMMAND } from "./commands";

const ignore = "__IGNORE__";

export async function validatorSelectionHandler(
  editor: vscode.TextEditor,
  edit,
  { currentSuggestion, allSuggestions, reference }
) {
  try {
    const eventData = eventDataOf(
      editor,
      currentSuggestion,
      allSuggestions,
      reference
    );
    tabNineProcess.setState(eventData);
  } catch (error) {
    console.error(error);
  }
}

export async function validatorIgnoreHandler(
  editor: vscode.TextEditor,
  edit,
  { allSuggestions, reference, responseId }
) {
  try {
    await setIgnore(responseId);
    vscode.commands.executeCommand(VALIDATOR_IGNORE_REFRESH_COMMAND);
    const completion: Completion = {
      value: ignore,
      score: 0,
    };
    const eventData = eventDataOf(
      editor,
      completion,
      allSuggestions,
      reference
    );
    tabNineProcess.setState(eventData);
  } catch (error) {
    console.error(error);
  }
}

function eventDataOf(
  editor: vscode.TextEditor,
  currentSuggestion: Completion,
  allSuggestions: Completion[],
  reference: string
) {
  let index = allSuggestions.findIndex((sug) => sug === currentSuggestion);
  if (index === -1) {
    index = allSuggestions.length;
  }
  let suggestions = allSuggestions.map((sug) => {
    return {
      length: sug.value.length,
      strength: resolveDetailOf(sug),
      origin: CompletionOrigin.CLOUD,
    };
  });

  const length = currentSuggestion.value.length;
  const strength = resolveDetailOf(currentSuggestion);
  const origin = CompletionOrigin.CLOUD;
  const language = editor.document.fileName.split(".").pop();
  const numOfSuggestions = allSuggestions.length;

  const eventData = {
    ValidatorSelection: {
      language: language,
      length: length,
      strength: strength,
      origin: origin,
      index: index,
      num_of_suggestions: numOfSuggestions,
      suggestions: suggestions,
      reference: reference,
    },
  };

  return eventData;
}

function resolveDetailOf(completion: Completion): string {
  return `${completion.score}%`;
}
