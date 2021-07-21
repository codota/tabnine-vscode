import { expect } from "chai";
import * as vscode from "vscode";
import { requestResponseItems } from "../../../binary/mockedRunProcess";
import { AutocompleteRequest } from "./completion.utils";
import { anAutocompleteResponse, A_SUGGESTION } from "./testData";
import { sleep } from "../../../utils/utils";
import { ACCEPT_INLINE_COMMAND } from "../../../globals/consts";

export function prepareSuggestionResponse(): void {
  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(request) as AutocompleteRequest;

      return !!completionRequest?.request?.Autocomplete;
    },
    result: anAutocompleteResponse(),
  });
}
export async function acceptTheSuggestion(): Promise<void> {
  await vscode.commands.executeCommand(`${ACCEPT_INLINE_COMMAND}`);

  await sleep(500);
}
export async function makeAChangeInDocument(
  editor: vscode.TextEditor
): Promise<void> {
  await editor.insertSnippet(
    new vscode.SnippetString("a"),
    new vscode.Range(0, 5, 0, 6)
  );
  await sleep(100);
}
export function assertTextIncludesTheSuggestion(
  editor: vscode.TextEditor
): void {
  expect(
    editor.document.getText(new vscode.Range(0, 0, 0, A_SUGGESTION.length))
  ).to.equal(A_SUGGESTION);
}
