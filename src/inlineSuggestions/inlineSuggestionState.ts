import { commands } from "vscode";
import { AutocompleteResult, ResultEntry } from "../binary/requests/requests";
import { rotate } from "../utils/rotate";

export type StateOptions = {
  shown?: Date;
  onClearState?: (index: number, shown?: Date) => void;
};

let autocompleteResult: AutocompleteResult | undefined | null;
let stateOptions: Partial<StateOptions> | undefined | null;
let iterator = rotate(0);

export async function setSuggestionsState(
  autocompleteResults: AutocompleteResult | undefined | null,
  options?: Partial<StateOptions>
): Promise<void> {
  autocompleteResult = autocompleteResults;
  stateOptions = options;

  if (autocompleteResult?.results?.length) {
    iterator = rotate(autocompleteResult.results.length - 1);
    await toggleInlineState(true);
  } else {
    iterator = rotate(0);
    await toggleInlineState(false);
  }
}

export async function clearState(): Promise<void> {
  if (!!autocompleteResult && stateOptions?.onClearState) {
    stateOptions.onClearState(iterator.current(), stateOptions.shown);
  }

  autocompleteResult = null;
  stateOptions = null;
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

export function setResultShown(): void {
  if (stateOptions) {
    stateOptions.shown = new Date();
  }
}

export function getNextSuggestion(): ResultEntry | undefined {
  return results()?.[iterator.next()];
}

export function getPrevSuggestion(): ResultEntry | undefined {
  return results()?.[iterator.prev()];
}
export function getCurrentSuggestion(): ResultEntry | undefined {
  return results()?.[iterator.current()];
}

export function getCurrentPrefix(): string {
  return autocompleteResult?.old_prefix || "";
}

export function getAllSuggestions(): ResultEntry[] | undefined {
  return results();
}

function results(): ResultEntry[] | undefined {
  return autocompleteResult?.results;
}
