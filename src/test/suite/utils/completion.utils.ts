import * as vscode from "vscode";
import { expect, use as chaiUse } from "chai";
import {
  AutocompleteParams,
  AutocompleteResult,
} from "../../../binary/requests/requests";
import { BinaryGenericRequest, openDocument } from "./helper";
import { isProcessReadyForTest, Item } from "../../../binary/mockedRunProcess";
import { SelectionStateRequest } from "../../../binary/requests/setState";
import { CompletionArguments } from "../../../CompletionArguments";
import { sleep } from "../../../utils/utils";
import { TAB_OVERRIDE_COMMAND } from "../../../globals/consts";
import TabnineInlineCompletionItem from "../../../inlineSuggestions/tabnineInlineCompletionItem";
import provideInlineCompletionItems from "../../../provideInlineCompletionItems";

// eslint-disable-next-line @typescript-eslint/no-var-requires
chaiUse(require("chai-shallow-deep-equal"));

export type AutocompleteRequest = BinaryGenericRequest<{
  Autocomplete: AutocompleteParams;
}>;

export type SelectionRequest = BinaryGenericRequest<{
  SetState: { state_type: SelectionStateRequest };
}>;

export type StateRequest = BinaryGenericRequest<{
  State: Record<string, never>;
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
    snippetContext: result.snippet_context,
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
  await emulationUserInteraction();
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
export async function moveToStartOfLinePosition(): Promise<unknown> {
  return vscode.commands.executeCommand("cursorLineStart");
}
export async function emulationUserInteraction(): Promise<void> {
  await sleep(400);
}

export function assertTextIsCommitted(expected: string): void {
  expect(vscode.window.activeTextEditor?.document.getText()).to.equal(expected);
}

export async function triggerSelectionAcceptance(): Promise<void> {
  await emulationUserInteraction();

  await vscode.commands.executeCommand(TAB_OVERRIDE_COMMAND);

  await emulationUserInteraction();
}

export async function triggerPopupSuggestion(): Promise<void> {
  await emulationUserInteraction();
  await vscode.commands.executeCommand("editor.action.triggerSuggest");
}
export async function getInlineCompletions(
  editor: vscode.TextEditor
): Promise<vscode.InlineCompletionList<TabnineInlineCompletionItem>> {
  return provideInlineCompletionItems(
    editor.document,
    editor.selection.active,
    {
      triggerKind: vscode.InlineCompletionTriggerKind.Automatic,
      selectedCompletionInfo: undefined,
    }
  );
}

export async function openADocWith(
  content: string
): Promise<vscode.TextEditor> {
  const editor = await openDocument("javascript", content);
  await isProcessReadyForTest();
  await moveToActivePosition();
  return editor;
}

async function moveLeftBy(value: number): Promise<void> {
  await vscode.commands.executeCommand("cursorMove", {
    to: "left",
    by: "character",
    value,
  });
}
export function moveCursorToBeAfter(prefix: string): Promise<void> {
  const currentText = vscode.window.activeTextEditor?.document.getText() || "";
  return moveLeftBy(currentText.replace(prefix, "").length);
}
