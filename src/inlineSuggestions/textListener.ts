import {
  Position,
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
} from "vscode";
import { EOL } from "os";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "./inlineSuggestionState";
import runCompletion from "../runCompletion";
import setInlineSuggestion from "./setInlineSuggestion";

export default async function textListener({
  document,
  contentChanges,
}: TextDocumentChangeEvent): Promise<void> {
  const [change] = contentChanges;
  if (isSingleTypingChange(contentChanges, change)) {
    const currentTextPosition = getCurrentPosition(change);

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

function isSingleTypingChange(contentChanges: readonly TextDocumentContentChangeEvent[], change: TextDocumentContentChangeEvent) {
  const isSingleSelectionChange = contentChanges.length === 1;
  const isSingleCharacterChange = change.text.length === 1;
  return isSingleSelectionChange && isSingleCharacterChange;
}

export function getCurrentPosition(
  change: TextDocumentContentChangeEvent
): Position {
  const lineDelta = getLinesCount(change.text);
  const characterDelta = change.text.length;
  return change.range.start.translate(lineDelta, characterDelta);
}
function getLinesCount(text: string) {
  return text.split(EOL).length - 1;
}
