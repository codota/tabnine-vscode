import * as vscode from "vscode";
import { use as chaiUse } from "chai";
import {
  AutocompleteParams,
  AutocompleteResult,
} from "../../../binary/requests/requests";
import { BinaryGenericRequest } from "./helper";
import { isProcessReadyForTest, Item } from "../../../binary/mockedRunProcess";
import { SelectionStateRequest } from "../../../binary/requests/setState";
import { CompletionArguments } from "../../../CompletionArguments";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chaiUse(require("chai-shallow-deep-equal"));

export type AutocompleteRequest = BinaryGenericRequest<{
  Autocomplete: AutocompleteParams;
}>;

export type SelectionRequest = BinaryGenericRequest<{
  SetState: { state_type: SelectionStateRequest };
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

export function selectionCommandArgs(
  result: AutocompleteResult,
  position: vscode.Position
): CompletionArguments {
  return {
    currentCompletion: result.results[0].new_prefix,
    completions: result.results,
    position,
    limited: result.is_locked,
    snippetIntent: result.snippet_intent,
    oldPrefix: result.old_prefix,
  };
}
export function mockAutocomplete(
  requestResponseItems: Item[],
  result: AutocompleteResult
): void {
  requestResponseItems.push({
    isQualified: (request) => {
      const completionRequest = JSON.parse(request) as AutocompleteRequest;

      return (
        !!completionRequest?.request?.Autocomplete &&
        completionRequest?.request?.Autocomplete.before.endsWith(
          result.old_prefix
        )
      );
    },
    result,
  });
}
export async function acceptInline(): Promise<unknown> {
  return vscode.commands.executeCommand("editor.action.inlineSuggest.commit");
}

export async function triggerInline(): Promise<unknown> {
  return vscode.commands.executeCommand("editor.action.inlineSuggest.trigger");
}

export async function makeAChange(text: string): Promise<boolean | undefined> {
  return vscode.window.activeTextEditor?.insertSnippet(
    new vscode.SnippetString(text),
    vscode.window.activeTextEditor?.selection.active
  );
}

export async function moveToActivePosition(): Promise<unknown> {
  return vscode.commands.executeCommand("cursorMove", {
    to: "wrappedLineEnd",
  });
}
