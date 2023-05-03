import { expect } from "chai";
import * as vscode from "vscode";
import { requestResponseItems } from "../../../binary/mockedRunProcess";
import { AutocompleteRequest } from "./completion.utils";
import { anAutocompleteResponse, A_SUGGESTION } from "./testData";
import { sleep } from "../../../utils/utils";

export function prepareSuggestionResponse(): void {
  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(request) as AutocompleteRequest;

      return !!completionRequest?.request?.Autocomplete;
    },
    result: anAutocompleteResponse(),
  });
}
export async function makeAChangeInDocument(
  editor: vscode.TextEditor,
  text?: string,
  range?: vscode.Range
): Promise<void> {
  await editor.insertSnippet(
    new vscode.SnippetString(text || "a"),
    range || new vscode.Range(0, 5, 0, 6)
  );
  await sleep(1000);
}

export async function clearDocument(editor: vscode.TextEditor): Promise<void> {
  const startPosition = new vscode.Position(0, 0);
  await editor.edit((editBuilder) =>
    editBuilder.delete(
      new vscode.Range(
        startPosition,
        startPosition.translate(editor.document.lineCount)
      )
    )
  );
}

export function assertTextIncludesTheSuggestion(
  editor: vscode.TextEditor
): void {
  expect(
    editor.document.getText(new vscode.Range(0, 0, 0, A_SUGGESTION.length))
  ).to.equal(A_SUGGESTION);
}
