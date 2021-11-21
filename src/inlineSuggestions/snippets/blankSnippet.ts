import { EOL } from "os";
import { commands, Position, Range, SnippetString, window } from "vscode";

let snippetBlankRange: Range | undefined;

export function isInSnippetInsertion(): boolean {
  return !!snippetBlankRange;
}

// for tests only
export function getSnippetBlankRange(): Range | undefined {
  return snippetBlankRange;
}

export async function insertBlankSnippet(
  lines: string[],
  position: Position
): Promise<void> {
  snippetBlankRange = undefined;
  const currentLineText = window.activeTextEditor?.document.lineAt(position)
    .text;
  const isCurrentLineEmpty = currentLineText?.trim().length === 0;

  if (isCurrentLineEmpty) {
    await insertBlankSnippetAtEmptyLine(lines, position);
  } else {
    await insertBlankSnippetAtNonEmptyLine(lines, position);
  }
}

async function insertBlankSnippetAtEmptyLine(
  lines: string[],
  position: Position
): Promise<void> {
  const snippet = new SnippetString(" ".repeat(position.character));
  snippet.appendTabstop(0);
  snippet.appendText(EOL.repeat(lines.length - 1));
  snippetBlankRange = new Range(
    position,
    position.translate(lines.length - 1, -position.character)
  );

  await window.activeTextEditor?.insertSnippet(
    snippet,
    position.with(position.line, 0)
  );
}

async function insertBlankSnippetAtNonEmptyLine(
  lines: string[],
  position: Position
): Promise<void> {
  const snippet = new SnippetString();

  snippet.appendTabstop(0);
  snippet.appendText(EOL.repeat(lines.length - 1));
  snippetBlankRange = new Range(
    position,
    position.translate(lines.length - 1, -position.character)
  );

  await window.activeTextEditor?.insertSnippet(
    snippet,
    position.with(position.line + 1, 0)
  );

  await moveCursorBackTo(position);
}

async function moveCursorBackTo(position: Position) {
  await commands.executeCommand("cursorMove", { to: "up", by: "line" });
  await commands.executeCommand("cursorMove", {
    to: "right",
    by: "character",
    value: position.character,
  });
}

export async function removeBlankSnippet(): Promise<void> {
  if (snippetBlankRange) {
    const fixedRange = calculateStartAfterUserInput(snippetBlankRange);

    const rangeToRemove = fixedRange || snippetBlankRange;
    // a workaround to the issue where `insertSnippet` inserts extra indentation
    // to the last line: https://github.com/microsoft/vscode/issues/20112
    const lastLineText = window.activeTextEditor?.document.lineAt(
      rangeToRemove.end
    ).text;
    const lastLineLength = lastLineText?.length;
    await window.activeTextEditor?.edit((editBuilder) => {
      editBuilder.delete(
        new Range(
          rangeToRemove.start,
          rangeToRemove.end.translate(0, lastLineLength)
        )
      );
    });

    snippetBlankRange = undefined;
  }
}

function calculateStartAfterUserInput(range: Range): Range | undefined {
  const currentPosition = window.activeTextEditor?.selection.active;
  const textInsideSnippetBlankRange = window.activeTextEditor?.document.getText(
    range
  );
  // a space is considered a text too, so trimming all whitespaces yields the wrong result here.
  const blankRangeContainsText =
    textInsideSnippetBlankRange?.replace(new RegExp(EOL, "g"), "") !== "";

  if (currentPosition && blankRangeContainsText) {
    const linesDiff = currentPosition.line - range.start.line;
    const charsDiff = currentPosition.character - range.start.character;
    return new Range(
      range.start.translate(linesDiff, charsDiff),
      range.end.translate(linesDiff)
    );
  }

  return undefined;
}
