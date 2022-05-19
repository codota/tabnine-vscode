import {
  Position,
  TextDocument,
  TextDocumentChangeEvent,
  TextDocumentContentChangeEvent,
  TextLine,
} from "vscode";
import { debounce } from "debounce";
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
import { AutocompleteResult } from "../binary/requests/requests";
import { completionIsAllowed } from "../provideCompletionItems";

const EMPTY_LINE_WARMUP_MILLIS = 250;
const EMPTY_LINE_DEBOUNCE = 550;

const debouncedEmptyLinesRequest = debounce(
  (document: TextDocument, currentPosition: Position) => {
    runCompletion(document, currentPosition)
      .then((autocompleteResult) =>
        setCompletion(autocompleteResult, document, currentPosition)
      )
      .catch((err) =>
        console.error("Could not request completion at empty line: ", err)
      );
  },
  EMPTY_LINE_DEBOUNCE
);

export default async function textListener({
  document,
  contentChanges,
}: TextDocumentChangeEvent): Promise<void> {
  const [change] = contentChanges;
  if (!change) {
    return;
  }
  const currentTextPosition = getCurrentPosition(change);
  if (!completionIsAllowed(document, currentTextPosition)) {
    return;
  }

  const emptyLinesEnabled = isCapabilityEnabled(
    Capability.EMPTY_LINE_SUGGESTIONS
  );
  const shouldHandleEmptyLine =
    emptyLinesEnabled &&
    isEmptyLine(change, document.lineAt(currentTextPosition.line)) &&
    !isInSnippetInsertion();

  debouncedEmptyLinesRequest.clear();
  if (shouldHandleEmptyLine) {
    await runCompletion(document, currentTextPosition);
    await sleep(EMPTY_LINE_WARMUP_MILLIS);
    debouncedEmptyLinesRequest(document, currentTextPosition);
    return;
  }

  if (
    (shouldHandleEmptyLine || isSingleTypingChange(contentChanges, change)) &&
    document.uri.scheme === URI_SCHEME_FILE
  ) {
    const autocompleteResult = await runCompletion(
      document,
      currentTextPosition
    );

    await setCompletion(autocompleteResult, document, currentTextPosition);
  }
}

async function setCompletion(
  autocompleteResult: AutocompleteResult | null | undefined,
  document: TextDocument,
  currentTextPosition: Position
): Promise<void> {
  await setSuggestionsState(autocompleteResult);
  const currentSuggestion = getCurrentSuggestion();
  if (currentSuggestion) {
    await setInlineSuggestion(document, currentTextPosition, currentSuggestion);
    return;
  }
  void clearInlineSuggestionsState();
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
