import { Position, TextDocumentChangeEvent } from "vscode";
import { EOL } from "os";
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

export function getCurrentPosition({
  contentChanges,
}: TextDocumentChangeEvent): Position {
  const [change] = contentChanges;
  const lineDelta = getLinesCount(change.text);
  const characterDelta = change.text.length;
  return change.range.start.translate(lineDelta, characterDelta);
}
function getLinesCount(text: string) {
  return text.split(EOL).length - 1;
}
