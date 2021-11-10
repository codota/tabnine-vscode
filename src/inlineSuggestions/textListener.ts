import {
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
} from "vscode";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "./inlineSuggestionState";
import runCompletion from "../runCompletion";
import setInlineSuggestion from "./setInlineSuggestion";
import clearInlineSuggestionsState from "./clearDecoration";
import { isInSnippetInsertion } from "./snippets/snippetDecoration";
import { URI_SCHEME_FILE } from "../globals/consts";
import { sleep } from "../utils/utils";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import getCurrentPosition from "./positionExtracter";

const EMPTY_LINE_WARMUP_MILLIS = 110;

export default async function textListener({
  document,
  contentChanges,
}: TextDocumentChangeEvent): Promise<void> {
  const [change] = contentChanges;
  const currentTextPosition = getCurrentPosition(change);

  const emptyLinesEnabled = isCapabilityEnabled(
    Capability.EMPTY_LINE_SUGGESTIONS
  );
  const shouldHandleEmptyLine =
    emptyLinesEnabled && isEmptyLine(change) && !isInSnippetInsertion();

  if (shouldHandleEmptyLine) {
    await runCompletion(document, currentTextPosition);
    await sleep(EMPTY_LINE_WARMUP_MILLIS);
    await runCompletion(document, currentTextPosition);
  }

  if (
    (shouldHandleEmptyLine || isSingleTypingChange(contentChanges, change)) &&
    document.uri.scheme === URI_SCHEME_FILE
  ) {
    const autocompleteResult = await runCompletion(
      document,
      currentTextPosition
    );
    await setSuggestionsState(autocompleteResult);
    const currentSuggestion = getCurrentSuggestion();
    if (currentSuggestion) {
      setInlineSuggestion(document, currentTextPosition, currentSuggestion);
      return;
    }
    void clearInlineSuggestionsState();
  }
  if (!isInSnippetInsertion()) {
    void clearInlineSuggestionsState();
  }
}

function isEmptyLine(change: TextDocumentContentChangeEvent): boolean {
  return change.text.trim() === "";
}

export function isSingleTypingChange(
  contentChanges: readonly TextDocumentContentChangeEvent[],
  change: TextDocumentContentChangeEvent
): boolean {
  const isSingleSelectionChange = contentChanges.length === 1;
  const isSingleCharacterChange = change.text.length === 1;
  return isSingleSelectionChange && isSingleCharacterChange;
}
