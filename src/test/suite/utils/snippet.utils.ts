import { expect } from "chai";
import * as vscode from "vscode";
import { requestResponseItems } from "../../../binary/mockedRunProcess";
import { AutocompleteSnippetRequest } from "./completion.utils";
import { anAutocompleteResponse } from "./testData";
import { sleep } from "../../../utils/utils";
import {
  ACCEPT_INLINE_COMMAND,
  SNIPPET_COMMAND,
} from "../../../globals/consts";

const A_SNIPPET_SUGGESTION = "line1\n    line2\nline3";

export function prepareSnippetSuggestionResponse(): void {
  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(
        request
      ) as AutocompleteSnippetRequest;

      return !!completionRequest?.request?.AutocompleteSnippet;
    },
    result: anAutocompleteResponse("", A_SNIPPET_SUGGESTION),
  });
}

export async function acceptTheSuggestion(): Promise<void> {
  await vscode.commands.executeCommand(`${ACCEPT_INLINE_COMMAND}`);

  await sleep(1000);
}
export async function requestSnippet(): Promise<void> {
  await vscode.commands.executeCommand(`${SNIPPET_COMMAND}`);
  await sleep(1000);
}
export function assertTextIncludesTheSuggestion(
  editor: vscode.TextEditor
): void {
  // On windows its \r\n and its fine, so we assert the text ignoring the \r's
  expect(editor.document.getText().replace(/\r\n/g, "\n")).to.equal(
    A_SNIPPET_SUGGESTION
  );
}
