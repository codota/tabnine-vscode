import * as vscode from "vscode";
import { use as chaiUse } from "chai";
import { AutocompleteParams } from "../../../binary/requests/requests";
import { BinaryGenericRequest } from "./helper";
import { isProcessReadyForTest } from "../../../binary/mockedRunProcess";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chaiUse(require("chai-shallow-deep-equal"));

export type AutocompleteRequest = BinaryGenericRequest<{
  Autocomplete: AutocompleteParams;
}>;


export async function completion(
  docUri: vscode.Uri,
  position: vscode.Position
): Promise<vscode.CompletionList<vscode.CompletionItem> | undefined> {
  await isProcessReadyForTest();
  return vscode.commands.executeCommand(
    "vscode.executeCompletionItemProvider",
    docUri,
    position
  );
}
