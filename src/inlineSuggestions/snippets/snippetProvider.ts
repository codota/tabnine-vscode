import { Position, TextDocument } from "vscode";
import {
  AutocompleteResultState,
  getAllSuggestions,
  getCurrentSuggestion,
  setSuggestionsState,
} from "../inlineSuggestionState";
import runCompletion from "../../runCompletion";
import setInlineSuggestion from "../setInlineSuggestion";
import { SnippetRequestTrigger } from "../../binary/requests/requests";
import { sendEvent } from "../../binary/requests/sendEvent";

enum SnippetEvents {
  SnippetCanceledBeforeShown = "SnippetCanceledBeforeShown",
  SnippetShown = "SnippetShown",
}

export default async function requestSnippet(
  document: TextDocument,
  position: Position,
  trigger: SnippetRequestTrigger = SnippetRequestTrigger.User
): Promise<void> {
  const autocompleteResult:
    | AutocompleteResultState
    | undefined
    | null = await runCompletion(document, position, "snippet", trigger);

  if (autocompleteResult) autocompleteResult.onStateChange = onStateChange;

  await setSuggestionsState(autocompleteResult);
  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    setInlineSuggestion(document, position, currentSuggestion);
  }
}

function onStateChange(index?: number): void {
  const allSuggestions = getAllSuggestions();
  if (!allSuggestions || !allSuggestions.length) return;

  if (index === undefined) {
    void sendEvent({
      name: SnippetEvents.SnippetCanceledBeforeShown,
    });
    return;
  }

  const entry = allSuggestions[index];
  if (entry && entry.shownTimeMS) {
    const snippetDurationMS = new Date().getTime() - entry.shownTimeMS;

    void sendEvent({
      name: SnippetEvents.SnippetShown,
      snippet_hint_duration: snippetDurationMS,
      result_index: index,
    });
  }
}
