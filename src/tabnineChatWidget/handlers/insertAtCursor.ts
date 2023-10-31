import * as vscode from "vscode";

type CodeDiffHunk = {
  newCode: string;
  oldCode?: string;
};

type Diff = {
  diffHunks: CodeDiffHunk[];
  comparableCode: string;
};

export type InserCode = {
  code: string;
  diff?: Diff;
};

export async function insertTextAtCursor({
  code,
  diff,
}: InserCode): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    vscode.window.showErrorMessage("No active text editor found.");
    return;
  }

  if (!diff) {
    if (!editor.selection.isEmpty) {
      void editor.edit((editBuilder) => {
        editBuilder.replace(editor.selection, code);
      });
    } else {
      const position = editor.selection.active;
      void editor.insertSnippet(new vscode.SnippetString(code), position);
    }
    return;
  }

  const { diffHunks, comparableCode } = diff;
  const document = editor.document;
  const entireText = document.getText();

  const startOffset = entireText.indexOf(comparableCode);
  if (startOffset === -1) {
    vscode.window.showWarningMessage("Could not insert the selected diff");
    return;
  }
  const endOffset = startOffset + comparableCode.length;

  const startPosition = document.positionAt(startOffset);
  const endPosition = document.positionAt(endOffset);
  const replaceRange = new vscode.Range(startPosition, endPosition);

  await editor.edit((editBuilder) => {
    editBuilder.replace(replaceRange, buildCodeDiff(diffHunks));
  });
}

function buildCodeDiff(diffHunks: CodeDiffHunk[]): string {
  return diffHunks
    .map(({ newCode, oldCode }) => {
      if (oldCode !== undefined) {
        return applyConflictMarker(oldCode, newCode);
      }
      return newCode;
    })
    .join("");
}

function applyConflictMarker(before: string, after: string): string {
  let output = "";
  output += "<<<<<<< Current\n";
  output += before;
  output += `${output.endsWith("\n") ? "" : "\n"}=======\n`;
  output += after;
  output += `${
    output.endsWith("\n") ? "" : "\n"
  }>>>>>>> Suggested by Tabnine\n`;
  return output;
}
