import { EOL } from "os";
import { Position, TextDocumentContentChangeEvent } from "vscode";

export default function getCurrentPosition(
  change: TextDocumentContentChangeEvent
): Position {
  const {
    linesDelta,
    characterDelta,
    lastLineLength,
  } = calculateChangeDimensions(change);

  return change.range.start.translate(
    linesDelta,
    linesDelta === 0
      ? characterDelta
      : -change.range.start.character + lastLineLength
  );
}

function calculateChangeDimensions(
  change: TextDocumentContentChangeEvent
): {
  linesDelta: number;
  characterDelta: number;
  lastLineLength: number;
} {
  const lines = getLines(change.text);
  let linesDelta = lines.length - 1;
  // handle auto inserting of newlines, for example when the closing bracket
  // of a function is being inserted automatically by vscode.
  if (isEmptyLinesWithNewlineAutoInsert(change)) linesDelta -= 1;
  const characterDelta = change.text.length;
  const lastLineLength = lines[linesDelta].length;

  return {
    linesDelta,
    characterDelta,
    lastLineLength,
  };
}

export function isOnlyWhitespaces(text: string): boolean {
  return text.trim() === "";
}

export function isEmptyLinesWithNewlineAutoInsert(
  change: TextDocumentContentChangeEvent
): boolean {
  return getLines(change.text).length > 2 && isOnlyWhitespaces(change.text);
}

function getLines(text: string) {
  return text.split(EOL);
}
