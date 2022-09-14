import { Position, Range, TextDocument } from "vscode";
import { autocomplete, AutocompleteResult } from "./binary/requests/requests";
import getTabSize from "./binary/requests/tabSize";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import { CHAR_LIMIT, MAX_NUM_RESULTS } from "./globals/consts";
import languages from "./globals/languages";

export type CompletionType = "normal" | "snippet";

export default async function runCompletion(
  document: TextDocument,
  position: Position,
  timeout?: number,
  currentSuggestionText = ""
): Promise<AutocompleteResult | null | undefined> {
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  const afterEnd = document.positionAt(afterEndOffset);
  const requestData = {
    filename: getFileNameWithExtension(document),
    before:
      document.getText(new Range(beforeStart, position)) +
      currentSuggestionText,
    after: document.getText(new Range(position, afterEnd)),
    region_includes_beginning: beforeStartOffset === 0,
    region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
    max_num_results: getMaxResults(),
    offset,
    line: position.line,
    character: position.character,
    indentation_size: getTabSize(),
  };

  const result = await autocomplete(requestData, timeout);

  return result;
}

function getMaxResults(): number {
  if (isCapabilityEnabled(Capability.SUGGESTIONS_SINGLE)) {
    return 1;
  }

  if (isCapabilityEnabled(Capability.SUGGESTIONS_TWO)) {
    return 2;
  }

  return MAX_NUM_RESULTS;
}

export type KnownLanguageType = keyof typeof languages;

export function getLanguageFileExtension(
  languageId: string
): string | undefined {
  return languages[languageId as KnownLanguageType];
}

export function getFileNameWithExtension(document: TextDocument): string {
  const { languageId, fileName } = document;
  if (!document.isUntitled) {
    return fileName;
  }
  const extension = getLanguageFileExtension(languageId);
  if (extension) {
    return fileName.concat(extension);
  }
  return fileName;
}
