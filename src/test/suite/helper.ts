/* eslint-disable import/no-mutable-exports */
import * as vscode from "vscode";
import { TextDocument, TextEditor } from "vscode";
import * as path from "path";
import * as TypeMoq from "typemoq";
import { use as chaiUse } from "chai";
import {
  AutocompleteParams,
  AutocompleteResult,
} from "../../binary/requests/requests";
import { readLineMock, stdinMock } from "../../binary/mockedRunProcess";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chaiUse(require("chai-shallow-deep-equal"));

/**
 * Activates the vscode.lsp-sample extension
 */
export async function activate(
  docUri: vscode.Uri
): Promise<{ editor: TextEditor; doc: TextDocument } | null> {
  try {
    const doc = await vscode.workspace.openTextDocument(docUri);
    const editor = await vscode.window.showTextDocument(doc);
    await sleep(1); // Wait for server activation

    return { editor, doc };
  } catch (e) {
    console.error(e);

    return null;
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getDocPath(p: string): string {
  return path.resolve(__dirname, "../fixture", p);
}

export function getDocUri(p: string): vscode.Uri {
  return vscode.Uri.file(getDocPath(p));
}

export async function setTestContent(
  doc: TextDocument,
  editor: TextEditor,
  content: string
): Promise<boolean> {
  const all = new vscode.Range(
    doc.positionAt(0),
    doc.positionAt(doc.getText().length)
  );
  return editor.edit((eb) => eb.replace(all, content));
}

export type BinaryRequest = {
  version: string;
  request: {
    Autocomplete: AutocompleteParams;
  };
};

export function setCompletionResult(
  response: AutocompleteResult
  // autocompleteRequest?: AutocompleteParams
): void {
  let requestHappened: boolean | null = null;

  stdinMock.setup((x) =>
    x.write(
      TypeMoq.It.is<string>((request) => {
        const completionRequest = JSON.parse(request) as BinaryRequest;

        // TODO: match exact request
        if (
          completionRequest?.request?.Autocomplete !== null &&
          requestHappened === null
        ) {
          requestHappened = true;

          return true;
        }

        return false;
      }),
      "utf8"
    )
  );
  readLineMock
    .setup((x) => x.once("line", TypeMoq.It.isAny()))
    .callback((x, callback: (line: string) => void) => {
      if (!requestHappened) {
        callback("null");
      } else {
        callback(JSON.stringify(response));
      }
    });
}

export function completion(
  docUri: vscode.Uri,
  position: vscode.Position
): Thenable<vscode.CompletionList<vscode.CompletionItem> | undefined> {
  return vscode.commands.executeCommand(
    "vscode.executeCompletionItemProvider",
    docUri,
    position
  );
}
