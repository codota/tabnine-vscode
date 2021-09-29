import { Position, TextDocument } from "vscode";
import {
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
  const autocompleteResult = await runCompletion(
    document,
    position,
    "snippet",
    trigger
  );

  if (autocompleteResult) {
    await setSuggestionsState(autocompleteResult, {
      onClearState,
    });
  }

  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    setInlineSuggestion(document, position, currentSuggestion);
  }
}

function onClearState(shown?: Date) {
  if (!shown) {
    void sendEvent({
      name: SnippetEvents.SnippetCanceledBeforeShown,
    });
    return;
  }

  const shownTimeInMS = new Date().getTime() - shown?.getTime();
  console.log(`Snippet Duration: ${shownTimeInMS}`);
  void sendEvent({
    name: SnippetEvents.SnippetShown,
    snippet_hint_duration: shownTimeInMS,
  });
}
