import * as vscode from "vscode";
import * as TypeMoq from "typemoq";
import { use as chaiUse } from "chai";
import { readLineMock, stdinMock } from "../../../binary/mockedRunProcess";
import {
  AutocompleteParams,
  AutocompleteResult,
} from "../../../binary/requests/requests";
import { BinaryGenericRequest } from "./helper";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chaiUse(require("chai-shallow-deep-equal"));

export type AutocompleteRequest = BinaryGenericRequest<{
  Autocomplete: AutocompleteParams;
}>;

export function setCompletionResult(
  ...response: AutocompleteResult[]
): void {
  let requestHappened = 0;
  let requestAnswered = 0;

  stdinMock.setup((x) =>
    x.write(
      TypeMoq.It.is<string>((request) => {
        const completionRequest = JSON.parse(request) as AutocompleteRequest;

        // TODO: match exact request
        if (
          completionRequest?.request?.Autocomplete !== null
        ) {
          requestHappened += 1;

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
        callback(JSON.stringify(response[requestAnswered] || null));
        requestAnswered += 1;
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
