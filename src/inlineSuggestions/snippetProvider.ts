import { Position, TextDocument } from "vscode";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "./inlineSuggestionState";
import runCompletion from "../runCompletion";
import setInlineSuggestion from "./setInlineSuggestion";

export default async function requestSnippet(
  document: TextDocument,
  position: Position
): Promise<void> {
  const autocompleteResult = await runCompletion(document, position, "snippet");
  await setSuggestionsState(autocompleteResult);
  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    setInlineSuggestion(document, position, currentSuggestion);
  }
}
