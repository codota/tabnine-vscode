import { EOL } from "os";
import { Position, Range, SnippetString, window } from "vscode";

let snippetBlankRange: Range | undefined;

export async function handleCreateSnippetDecoration(
  lines: string[],
  position: Position
): Promise<void> {
  snippetBlankRange = undefined;

  if (lines.length > 1) {
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
}

export function handleClearSnippetDecoration(): void {
  if (snippetBlankRange) {
    void window.activeTextEditor?.edit((editBuilder) => {
      editBuilder.delete(snippetBlankRange as Range);
    });
    snippetBlankRange = undefined;
  }
}
