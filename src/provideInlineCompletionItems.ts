import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { completionIsAllowed } from "./provideCompletionItems";
import runCompletion from "./runCompletion";
import { COMPLETION_IMPORTS } from "./selectionHandler";


const INLINE_REQUEST_TIMEOUT = 3000;

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext
): Promise<vscode.InlineCompletionList> {
  if (context.triggerKind === vscode.InlineCompletionTriggerKind.Explicit){
    throw new Error("empty trigger");
  }
  try {
    // console.log("in provideInlineCompletionItems",context.triggerKind);
    if (
      !completionIsAllowed(document, position) ||
      isInTheMiddleOfWord(document, position)  // ||
      // !getShouldComplete()
    ) {
      return new vscode.InlineCompletionList([]);
    }
    // console.log("in provideInlineCompletionItems not empty");
    const completionInfo = context.selectedCompletionInfo;
    if (completionInfo) {
      return await getCompletionsExtendingSelectedItem(
        document,
        completionInfo,
        position
      );
    }

    return await getInlineCompletionItems(document, position);
  } catch (e) {
    console.error(`Error setting up request: ${e}`);

    return new vscode.InlineCompletionList([]);
  }
}

async function getInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const isEmptyLine = document.lineAt(position.line).text.trim().length === 0;

  const response = await runCompletion(
    document,
    position,
    isEmptyLine ? INLINE_REQUEST_TIMEOUT : undefined
  );

  const completions = response?.results.map(
    (result) =>
      new vscode.InlineCompletionItem(
        result.new_prefix,
        calculateRange(position, response, result),
        getAutoImportCommand(result, response, position)
      )
  );

  return new vscode.InlineCompletionList(completions || []);
}

async function getCompletionsExtendingSelectedItem(
  document: vscode.TextDocument,
  completionInfo: vscode.SelectedCompletionInfo,
  position: vscode.Position
) {
  let res = await runCompletion(
    document,
    completionInfo.range.start,
    undefined,
    completionInfo.text
  );
  if (!res?.results.length) {
    res = await runCompletion(
      document,
      completionInfo.range.start,
      undefined,
      completionInfo.text
    );
  }
  const response = res;

  if (!res?.results.length) {
    console.log("empty");
  }

  const completions = response?.results.map(
    (result) =>
      new vscode.InlineCompletionItem(
        result.new_prefix.replace(response.old_prefix, completionInfo.text),
        completionInfo.range,
        getAutoImportCommand(result, response, position)
      )
  );

  return new vscode.InlineCompletionList(completions || []);
}

function getAutoImportCommand(
  result: ResultEntry,
  response: AutocompleteResult,
  position: vscode.Position
): vscode.Command {
  return {
    arguments: [
      {
        currentCompletion: result.new_prefix,
        completions: response.results,
        position,
        limited: response?.is_locked,
      },
    ],
    command: COMPLETION_IMPORTS,
    title: "accept completion",
  };
}

function calculateRange(
  position: vscode.Position,
  response: AutocompleteResult,
  result: ResultEntry
): vscode.Range {
  return new vscode.Range(
    position.translate(0, -response.old_prefix.length),
    position.translate(0, result.old_suffix.length)
  );
}

function isInTheMiddleOfWord(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const nextCharacter = document.getText(
    new vscode.Range(position, position.translate(0, 1))
  );
  return !isClosingCharacter(nextCharacter) && !!nextCharacter.trim();
}

function isClosingCharacter(nextCharacter: string) {
  const closingCharacters = ['"', "'", "`", "]", ")", "}", ">"];
  return closingCharacters.includes(nextCharacter);
}
