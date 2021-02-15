import * as vscode from "vscode";
import { use as chaiUse } from "chai";
import { AutocompleteParams } from "../../../binary/requests/requests";
import { BinaryGenericRequest } from "./helper";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chaiUse(require("chai-shallow-deep-equal"));

export type AutocompleteRequest = BinaryGenericRequest<{
  Autocomplete: AutocompleteParams;
}>;

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
