import { EOL } from "os";
import {
  DecorationOptions,
  Position,
  Range,
  SnippetString,
  window,
} from "vscode";
import hoverPopup from "../hoverPopup";

let snippetBlankRange: Range | undefined;

export function isInSnippetInsertion(): boolean {
  return !!snippetBlankRange;
}

export async function getSnippetDecorations(
  position: Position,
  suggestion: string
): Promise<DecorationOptions[]> {
  const lines = suggestion.split("\n");
  const lastLineLength = lines[lines.length - 1].length;

  await insertBlankSnippet(lines, position);

  const decorations = lines.map((line, index) =>
    getDecorationFor(line, position, index)
  );

  decorations.push({
    hoverMessage: hoverPopup,
    range: new Range(
      position,
      position.translate(lines.length, lastLineLength)
    ),
  });

  return decorations;
}

function getDecorationFor(
  line: string,
  startPosition: Position,
  index: number
): DecorationOptions {
  const endOfCurrentLine = -startPosition.character + line.length;
  const startOfCurrentLine = -startPosition.character;
  return {
    renderOptions: {
      after: {
        color: "gray",
        contentText: line,
        margin: `0 0 0 0`,
        textDecoration: "none; white-space: pre;",
      },
    },
    // The range of the first line should not change the character position
    range: new Range(
      startPosition.translate(index, index === 0 ? 0 : startOfCurrentLine),
      startPosition.translate(index, index === 0 ? 0 : endOfCurrentLine)
    ),
  };
}

async function insertBlankSnippet(
  lines: string[],
  position: Position
): Promise<void> {
  snippetBlankRange = undefined;

  const snippet = new SnippetString(" ".repeat(position.character));
  snippet.appendTabstop(0);
  snippet.appendText(EOL.repeat(lines.length - 1));
  snippetBlankRange = new Range(
    position,
    position.translate(lines.length - 1, undefined)
  );

  await window.activeTextEditor?.insertSnippet(
    snippet,
    position.with(undefined, 0)
  );
}

export function handleClearSnippetDecoration(): void {
  if (snippetBlankRange) {
    const fixedRange = calculateStartAfterUserInput(snippetBlankRange);

    if (fixedRange) snippetBlankRange = fixedRange;

    void window.activeTextEditor?.edit((editBuilder) => {
      editBuilder.delete(snippetBlankRange as Range);
    });
    snippetBlankRange = undefined;
  }
}

function calculateStartAfterUserInput(range: Range): Range | undefined {
  const currentPosition = window.activeTextEditor?.selection.active;

  if (currentPosition) {
    const linesDiff = currentPosition.line - range.start.line;
    const charsDiff = currentPosition.character - range.start.character;
    return new Range(
      range.start.translate(linesDiff, charsDiff),
      range.end.translate(linesDiff)
    );
  }

  return undefined;
}
