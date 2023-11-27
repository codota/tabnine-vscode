/* eslint-disable no-param-reassign */
/* eslint-disable max-classes-per-file */
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

export function registerChatActionProvider(context: ExtensionContext) {
  context.subscriptions.push(
    languages.registerCodeActionsProvider("*", new ChatActionProvider(), {
      providedCodeActionKinds: [
        CodeActionKind.RefactorRewrite,
        CodeActionKind.QuickFix,
      ],
    })
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

    // if (!window.activeTextEditor?.selection.isEmpty) {
    //   const refactor = new CodeAction(
    //     "Ask Tabnine",
    //     CodeActionKind.RefactorRewrite
    //   );

    //   refactor.command = {
    //     title: refactor.title,
    //     command: "tabnine.chat.commands.refactor-inline",
    //     arguments: [range],
    //   };

    //   resultActions.push(refactor);
    //   return resultActions;
    // }
    // if (!document.lineAt(range.start.line).text.trim()) {
    //   const refactor = new CodeAction(
    //     "Ask Tabnine",
    //     CodeActionKind.RefactorRewrite
    //   );

    //   refactor.command = {
    //     title: refactor.title,
    //     command: "tabnine.chat.commands.refactor-inline",
    //     arguments: [range],
    //   };

    //   resultActions.push(refactor);
    //   return resultActions;
    // }

    // const relevantSymbols: SymbolInformation[] = await getFuctionsSymbols(
    //   document
    // );

    // const symbolInRange = relevantSymbols?.find((s) =>
    //   s.location.range.contains(range)
    // );
    // if (symbolInRange) {
    //   const refactor = new CodeAction(
    //     "Ask Tabnine",
    //     CodeActionKind.RefactorRewrite
    //   );

    //   refactor.command = {
    //     title: refactor.title,
    //     command: "tabnine.chat.commands.refactor-inline",
    //     arguments: [symbolInRange.location.range],
    //   };

    //   resultActions.push(refactor);
    //   return resultActions;
    // }

    return resultActions;
  }
}
