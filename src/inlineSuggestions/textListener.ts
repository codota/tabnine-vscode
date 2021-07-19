import { Position, TextDocumentChangeEvent } from "vscode";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "./inlineSuggestionState";
import runCompletion from "../runCompletion";
import setInlineSuggestion from "./setInlineSuggestion";

export default async function textListener(
  data: TextDocumentChangeEvent
): Promise<void> {
  if (data.contentChanges.length > 0) {
    const currentTextPosition = getCurrentPosition(data);
    const { document } = data;

    const autocompleteResult = await runCompletion(
      document,
      currentTextPosition
    );
    await setSuggestionsState(autocompleteResult);
    const currentSuggestion = getCurrentSuggestion();
    if (currentSuggestion) {
      setInlineSuggestion(document, currentTextPosition, currentSuggestion);
    }
  }
}

export function getCurrentPosition(data: TextDocumentChangeEvent): Position {
  return data.contentChanges[0].range.start.translate(
    undefined,
    data.contentChanges[0].text.length
  );
}
