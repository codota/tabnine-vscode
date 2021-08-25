import { Position, Range, TextDocument } from "vscode";
import { autocomplete, AutocompleteResult } from "./binary/requests/requests";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import { CHAR_LIMIT, MAX_NUM_RESULTS } from "./globals/consts";

export default async function runCompletion(
  document: TextDocument,
  position: Position
): Promise<AutocompleteResult | null | undefined> {
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  const afterEnd = document.positionAt(afterEndOffset);
  return autocomplete({
    filename: document.fileName,
    before: document.getText(new Range(beforeStart, position)),
    after: document.getText(new Range(position, afterEnd)),
    region_includes_beginning: beforeStartOffset === 0,
    region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
    max_num_results: getMaxResults(),
    offset,
    line: position.line,
    character: position.character,
  });
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
