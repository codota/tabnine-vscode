import * as vscode from "vscode";
import { TabnineInlineCompletionItem } from "./inlineSuggestions/tabnineInlineCompletionItem";
import { getShouldComplete } from "./inlineSuggestions/documentChangesTracker";

import debounceCompletions from "./debounceCompletions";
import {
  clearCurrentLookAheadSuggestion,
  getLookAheadSuggestion,
} from "./lookAheadSuggestion";
import reportSuggestionShown from "./reportSuggestionShown";

const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");

export async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext,
  token: vscode.CancellationToken
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  try {
    clearCurrentLookAheadSuggestion();
    if (
      !completionIsAllowed(document, position) ||
      !isValidMidlinePosition(document, position) ||
      !getShouldComplete()
    ) {
      return undefined;
    }

    const completionInfo = context.selectedCompletionInfo;
    if (completionInfo) {
      const result = await getLookAheadSuggestion(
        document,
        completionInfo,
        position,
        token
      );
      reportSuggestionShown(document, result);
      return result;
    }

    const completions = await debounceCompletions(document, position, token);
    reportSuggestionShown(document, completions);
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

function completionIsAllowed(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const configuration = vscode.workspace.getConfiguration();
  const disableLineRegex = getMisnamedConfigPropertyValue(
    "tabnine.disableLineRegex",
    "tabnine.disable_line_regex",
    configuration
  );

  const line = document.getText(
    new vscode.Range(
      position.with({ character: 0 }),
      position.with({ character: 500 })
    )
  );

  if (disableLineRegex.some((r) => new RegExp(r).test(line))) {
    return false;
  }

  const disableFileRegex = getMisnamedConfigPropertyValue(
    "tabnine.disableFileRegex",
    "tabnine.disable_file_regex",
    configuration
  );

  return !disableFileRegex.some((r) => new RegExp(r).test(document.fileName));
}
function getMisnamedConfigPropertyValue(
  properPropName: string,
  propMisname: string,
  configuration: vscode.WorkspaceConfiguration
): string[] {
  let disableLineRegex = configuration.get<string[]>(properPropName);
  if (!disableLineRegex || !disableLineRegex.length) {
    disableLineRegex = configuration.get<string[]>(propMisname);
  }

  if (disableLineRegex === undefined) {
    disableLineRegex = [];
  }

  return disableLineRegex;
}
