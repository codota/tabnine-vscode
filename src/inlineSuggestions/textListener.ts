import {
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
  TextLine,
} from "vscode";
import {
  getCurrentSuggestion,
  setSuggestionsState,
} from "./inlineSuggestionState";
import runCompletion from "../runCompletion";
import setInlineSuggestion from "./setInlineSuggestion";
import clearInlineSuggestionsState from "./clearDecoration";
import { isInSnippetInsertion } from "./snippets/blankSnippet";
import { URI_SCHEME_FILE } from "../globals/consts";
import { sleep } from "../utils/utils";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import getCurrentPosition, {
  isEmptyLinesWithNewlineAutoInsert,
  isOnlyWhitespaces,
} from "./positionExtracter";
import { CompletionKind } from "../binary/requests/requests";

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
    emptyLinesEnabled &&
    isEmptyLine(change, document.lineAt(currentTextPosition.line)) &&
    !isInSnippetInsertion();

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

    autocompleteResult?.results.push({
      ...autocompleteResult.results[0],
      new_prefix: "test\n  b\nc",
      completion_kind: CompletionKind.Snippet,
    });
    // autocompleteResult?.results.splice(0, autocompleteResult.results.length - 1);
    await setSuggestionsState(autocompleteResult);
    const currentSuggestion = getCurrentSuggestion();
    if (currentSuggestion) {
      await setInlineSuggestion(
        document,
        currentTextPosition,
        currentSuggestion
      );
      return;
    }
    void clearInlineSuggestionsState();
  }
}

function isEmptyLine(
  change: TextDocumentContentChangeEvent,
  currentLine: TextLine
): boolean {
  return (
    isEmptyLinesWithNewlineAutoInsert(change) ||
    isOnlyWhitespaces(currentLine.text)
  );
}

export function isSingleTypingChange(
  contentChanges: readonly TextDocumentContentChangeEvent[],
  change: TextDocumentContentChangeEvent
): boolean {
  const isSingleSelectionChange = contentChanges.length === 1;
  const isSingleCharacterChange = change.text.length === 1;
  return isSingleSelectionChange && isSingleCharacterChange;
}
