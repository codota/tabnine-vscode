import * as vscode from "vscode";
import { CodeAction, Command, ExtensionContext, ProviderResult } from "vscode";
import ChatViewProvider from "../ChatViewProvider";

export function registerChatQuickFix(
  context: ExtensionContext,
  chatProvider: ChatViewProvider
) {
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      "*",
      {
        provideCodeActions(
          _document,
          _range,
          codeActionContext
        ): ProviderResult<(CodeAction | Command)[]> {
          const fixAction = new vscode.CodeAction(
            "Fix with Tabnine",
            vscode.CodeActionKind.QuickFix
          );

          fixAction.command = {
            title: fixAction.title,
            command: "tabnine.chat.commands.fix-inline-code",
            arguments: [codeActionContext.diagnostics[0].range],
          };

          return [fixAction];
        },
      },
      {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }
    ),
    vscode.commands.registerCommand(
      "tabnine.chat.commands.fix-inline-code",
      (range: vscode.Range) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const newPosition = range.start;
          const newSelection = new vscode.Selection(
            newPosition.line,
            0,
            newPosition.line,
            editor.document.lineAt(newPosition.line).text.length
          );
          editor.selection = newSelection;
        }
        void chatProvider.handleMessageSubmitted("/fix-code");
      }
    )
  );
}
