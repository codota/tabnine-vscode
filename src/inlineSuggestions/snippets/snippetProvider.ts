import { Position, TextDocument, window } from "vscode";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "../inlineSuggestionState";
import runCompletion from "../../runCompletion";
import setInlineSuggestion from "../setInlineSuggestion";

export default async function requestSnippet(
  document: TextDocument,
  position: Position
): Promise<void> {
  const autocompleteResult = await runCompletion({ document, position });

  const currentUri = window.activeTextEditor?.document.uri;
  if (currentUri !== document.uri) {
    return;
  }

  await setSuggestionsState(autocompleteResult);
  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    await setInlineSuggestion(document, position, currentSuggestion);
  }
}
