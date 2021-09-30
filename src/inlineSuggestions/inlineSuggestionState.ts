import { commands } from "vscode";
import { AutocompleteResult, ResultEntry } from "../binary/requests/requests";
import { rotate } from "../utils/rotate";

type ResultEntryState = ResultEntry & {
  shownTimeMS?: number;
};

export type AutocompleteResultState = Omit<AutocompleteResult, "results"> & {
  results: ResultEntryState[];
  onStateChange?: (index?: number) => void;
  previousIndex?: number;
};

let autocompleteResult: AutocompleteResultState | undefined | null;

let iterator = rotate(0);

export async function setSuggestionsState(
  autocompleteResults: AutocompleteResult | undefined | null
): Promise<void> {
  if (autocompleteResult?.onStateChange)
    autocompleteResult.onStateChange(autocompleteResult.previousIndex);

  autocompleteResult = autocompleteResults;
  if (autocompleteResult?.results?.length) {
    iterator = rotate(autocompleteResult.results.length - 1);
    await toggleInlineState(true);
  } else {
    iterator = rotate(0);
    await toggleInlineState(false);
  }
}
export async function clearState(): Promise<void> {
  if (autocompleteResult?.onStateChange)
    autocompleteResult.onStateChange(autocompleteResult.previousIndex);

  autocompleteResult = null;
  iterator = rotate(0);
  await toggleInlineState(false);
}
async function toggleInlineState(withinSuggestion: boolean): Promise<void> {
  await commands.executeCommand(
    "setContext",
    "tabnine.in-inline-suggestions",
    withinSuggestion
  );
}

export function onCurrentResultShown(): void {
  const currentSuggestion = getCurrentSuggestion();
  if (autocompleteResult && currentSuggestion) {
    if (
      autocompleteResult?.onStateChange &&
      autocompleteResult?.previousIndex !== undefined
    )
      autocompleteResult.onStateChange(autocompleteResult.previousIndex);

    currentSuggestion.shownTimeMS = new Date().getTime();
    autocompleteResult.previousIndex = iterator.current();
  }
}

export function getNextSuggestion(): ResultEntryState | undefined {
  return results()?.[iterator.next()];
}

export function getPrevSuggestion(): ResultEntryState | undefined {
  return results()?.[iterator.prev()];
}
export function getCurrentSuggestion(): ResultEntryState | undefined {
  return results()?.[iterator.current()];
}

export function getCurrentPrefix(): string {
  return autocompleteResult?.old_prefix || "";
}

export function getAllSuggestions(): ResultEntryState[] | undefined {
  return results();
}

function results(): ResultEntryState[] | undefined {
  return autocompleteResult?.results;
}
