import * as vscode from "vscode";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { completionIsAllowed } from "./provideCompletionItems";
import { getShouldComplete } from "./inlineSuggestions/documentChangesTracker";
import getInlineCompletionItems from "./getInlineCompletionItems";

const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");
const DEBOUNCE_DELAY = 300;

function debounce<T extends unknown[], R>(
  callback: (...rest: T) => R,
  limit: number
): (...rest: T) => Promise<R | undefined> {
  let timer: ReturnType<typeof setTimeout>;

  return function (...rest): Promise<R | undefined> {
    return new Promise((resolve) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        resolve(callback(...rest));
      }, limit);
    });
  };
}

const debounceCompletions = debounce(getInlineCompletionItems, DEBOUNCE_DELAY);

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  _context: vscode.InlineCompletionContext,
  _token: vscode.CancellationToken
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  try {
    if (
      !completionIsAllowed(document, position) ||
      !isValidMidlinePosition(document, position) ||
      !getShouldComplete()
    ) {
      return undefined;
    }

    const completions = await debounceCompletions(document, position);
    return completions;
  } catch (e) {
    console.error(`Error setting up request: ${e}`);

    return undefined;
  }
}

function isValidMidlinePosition(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const lineSuffix = document.getText(
    new vscode.Range(position, document.lineAt(position.line).range.end)
  );
  return END_OF_LINE_VALID_REGEX.test(lineSuffix);
}
