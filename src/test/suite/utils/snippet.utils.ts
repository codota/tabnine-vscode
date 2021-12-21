import { expect } from "chai";
import * as vscode from "vscode";
import { requestResponseItems } from "../../../binary/mockedRunProcess";
import { AutocompleteRequest } from "./completion.utils";
import { anAutocompleteResponse } from "./testData";
import { sleep } from "../../../utils/utils";
import {
  ACCEPT_INLINE_COMMAND,
  SNIPPET_COMMAND,
} from "../../../globals/consts";

const A_SNIPPET_SUGGESTION = "line1\n    line2\nline3";
export const A_COMMENT = "// this is a comment\n";
export const A_FUNCTION = "function getSomething() {\n";

export function prepareSnippetSuggestionResponse(): void {
  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(
        request
      ) as AutocompleteRequest;

      return !!completionRequest?.request?.Autocomplete;
    },
    result: anAutocompleteResponse("", A_SNIPPET_SUGGESTION),
  });
}

export async function acceptTheSuggestion(): Promise<void> {
  await vscode.commands.executeCommand(`${ACCEPT_INLINE_COMMAND}`);

  await sleep(1000);
}
export async function requestSnippet(
  editor?: vscode.TextEditor,
  existingText?: string
): Promise<void> {
  if (existingText && editor) {
    await editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(0, 0), existingText);
    });
  } else {
    await vscode.commands.executeCommand(`${SNIPPET_COMMAND}`);
  }

  await sleep(1000);
}
export function assertTextIncludesTheSuggestion(
  editor: vscode.TextEditor,
  existingText?: string
): void {
  // On windows its \r\n and its fine, so we assert the text ignoring the \r's
  expect(editor.document.getText().replace(/\r\n/g, "\n")).to.equal(
    (existingText || "") + A_SNIPPET_SUGGESTION
  );
}
