import { DecorationOptions, Position, Range } from "vscode";
import { insertBlankSnippet, removeBlankSnippet } from "./blankSnippet";

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
  const endOfCurrentLine = Math.max(0, -startPosition.character) + line.length;
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
      startPosition.translate(index, 0),
      startPosition.translate(index, index === 0 ? 0 : endOfCurrentLine)
    ),
  };
}

export async function handleClearSnippetDecoration(): Promise<void> {
  await removeBlankSnippet();
}
