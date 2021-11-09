import { Position, TextDocument, window } from "vscode";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "../inlineSuggestionState";
import runCompletion from "../../runCompletion";
import setInlineSuggestion from "../setInlineSuggestion";
import { SnippetRequestTrigger } from "../../binary/requests/requests";

export default async function requestSnippet(
  document: TextDocument,
  position: Position,
  trigger: SnippetRequestTrigger = SnippetRequestTrigger.User
): Promise<void> {
  const autocompleteResult = await runCompletion(
    document,
    position,
    "snippet",
    trigger
  );

  const currentUri = window.activeTextEditor?.document.uri;
  if (currentUri !== document.uri) {
    return;
  }

  await setSuggestionsState(autocompleteResult);
  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    setInlineSuggestion(document, position, currentSuggestion);
  }
}
