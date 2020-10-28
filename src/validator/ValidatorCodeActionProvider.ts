/* eslint-disable */
import * as vscode from "vscode";
import { TABNINE_DIAGNOSTIC_CODE, TabNineDiagnostic } from "./diagnostics";
import { Completion } from "./ValidatorClient";
import { getValidatorMode, ValidatorMode } from "./ValidatorMode";
import {
  VALIDATOR_SELECTION_COMMAND,
  VALIDATOR_IGNORE_COMMAND,
} from "./commands";

export default class ValidatorCodeActionProvider
  implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
  ];

  // This method implements vscode.CodeActionProvider
  // eslint-disable-next-line class-methods-use-this
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {
    const codeActions: vscode.CodeAction[] = [];
    const diagnostics = context.diagnostics as TabNineDiagnostic[];
    diagnostics
      .filter((diagnostic) => diagnostic.code === TABNINE_DIAGNOSTIC_CODE)
      .forEach((diagnostic) => {
        diagnostic.choices.forEach((choice) => {
          codeActions.push(createCodeAction(document, diagnostic, choice));
        });
        // register ignore action
        const title = "Ignore TabNine Validator suggestions at this spot";
        const action = new vscode.CodeAction(
          title,
          vscode.CodeActionKind.QuickFix
        );
        action.command = {
          arguments: [
            {
              allSuggestions: diagnostic.choices,
              reference: diagnostic.reference,
              threshold: diagnostic.threshold,
              responseId: diagnostic.responseId,
            },
          ],
          command: VALIDATOR_IGNORE_COMMAND,
          title: "ignore replacement",
        };
        codeActions.push(action);
      });
    return codeActions;
  }
}

function createCodeAction(
  document: vscode.TextDocument,
  diagnostic: TabNineDiagnostic,
  choice: Completion
): vscode.CodeAction {
  const { range } = diagnostic;
  const title = `Replace with '${choice.value}'`;
  const action = new vscode.CodeAction(title, vscode.CodeActionKind.QuickFix);
  action.edit = new vscode.WorkspaceEdit();
  action.edit.replace(
    document.uri,
    new vscode.Range(range.start, range.end),
    choice.value
  );
  if (getValidatorMode() === ValidatorMode.Paste) {
    diagnostic.references.forEach((r) =>
      action.edit?.replace(document.uri, r, choice.value)
    );
  }
  action.diagnostics = [diagnostic];
  action.command = {
    arguments: [
      {
        currentSuggestion: choice,
        allSuggestions: diagnostic.choices,
        reference: diagnostic.reference,
        threshold: diagnostic.threshold,
      },
    ],
    command: VALIDATOR_SELECTION_COMMAND,
    title: "accept replacement",
  };
  return action;
}
