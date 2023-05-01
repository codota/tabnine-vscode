import {
  CodeAction,
  CodeActionKind,
  commands,
  Selection,
  TextEditor,
  TextEditorEdit,
  workspace,
  ExtensionContext,
} from "vscode";
import findImports from "./findImports";
import {
  DELAY_FOR_CODE_ACTION_PROVIDER,
} from "./globals/consts";
import { CompletionArguments } from "./CompletionArguments";

export const COMPLETION_IMPORTS = "tabnine-completion-imports";
export const HANDLE_IMPORTS = "tabnine-handle-imports";

export function getSelectionHandler(
  context: ExtensionContext
): (
  editor: TextEditor,
  edit: TextEditorEdit,
  args: CompletionArguments
) => void {
  console.log(context);
  return function selectionHandler(
    editor: TextEditor,
    _edit: TextEditorEdit,
    {
      currentCompletion,
      completions,
      position,
      limited,
      oldPrefix,
      suggestionTrigger,
    }: CompletionArguments
  ): void {
    try {
      console.log(completions,
        position,
        limited,
        oldPrefix,
        suggestionTrigger)

      void commands.executeCommand(HANDLE_IMPORTS, {
        completion: currentCompletion,
      });
    } catch (error) {
      console.error(error);
    }
  };
}

export function handleImports(
  editor: TextEditor,
  edit: TextEditorEdit,
  { completion }: { completion: string }
): void {
  const lines = completion.split("\n");

  const { selection } = editor;
  const completionSelection = new Selection(
    selection.active.translate(
      -(lines.length - 1),
      lines.length > 1 ? -selection.active.character : -completion.length
    ),
    selection.active
  );
  setTimeout(() => {
    void doAutoImport(editor, completionSelection, completion);
  }, DELAY_FOR_CODE_ACTION_PROVIDER);
}

async function doAutoImport(
  editor: TextEditor,
  completionSelection: Selection,
  completion: string
) {
  try {
    const codeActionCommands = await commands.executeCommand<CodeAction[]>(
      "vscode.executeCodeActionProvider",
      editor.document.uri,
      completionSelection,
      CodeActionKind.QuickFix.value
    );
    const importCommand = findImports(codeActionCommands)[0];

    if (importCommand && importCommand.edit) {
      await workspace.applyEdit(importCommand.edit);
      await commands.executeCommand(HANDLE_IMPORTS, { completion });
    }
  } catch (error) {
    console.error(error);
  }
}
