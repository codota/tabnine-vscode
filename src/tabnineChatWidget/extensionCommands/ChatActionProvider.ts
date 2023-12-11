/* eslint-disable class-methods-use-this */
import {
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  ExtensionContext,
  Range,
  TextDocument,
  languages,
  CodeActionProvider,
} from "vscode";
import { languagesFilter } from "./const";

export function registerChatActionProvider(context: ExtensionContext) {
  context.subscriptions.push(
    languages.registerCodeActionsProvider(
      languagesFilter,
      new ChatActionProvider(),
      {
        providedCodeActionKinds: [
          CodeActionKind.RefactorRewrite,
          CodeActionKind.QuickFix,
        ],
      }
    )
  );
}

class ChatActionProvider implements CodeActionProvider {
  provideCodeActions(
    document: TextDocument,
    range: Range,
    codeActionContext: CodeActionContext & {
      triggerKind: number;
    }
  ): CodeAction[] {
    if (codeActionContext.triggerKind !== 1) {
      return [];
    }
    const resultActions: CodeAction[] = [];

    if (codeActionContext.diagnostics[0]?.range) {
      const fixAction = new CodeAction(
        "Fix with Tabnine",
        CodeActionKind.QuickFix
      );

      fixAction.command = {
        title: fixAction.title,
        command: "tabnine.chat.commands.fix-code",
      };
      resultActions.push(fixAction);
    }
    const refactor = new CodeAction(
      "Ask Tabnine",
      CodeActionKind.RefactorRewrite
    );

    refactor.command = {
      title: refactor.title,
      command: "tabnine.chat.commands.inline.action",
    };
    resultActions.push(refactor);
    return resultActions;
  }
}
