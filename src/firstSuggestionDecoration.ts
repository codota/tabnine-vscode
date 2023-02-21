import {
  DecorationOptions,
  DecorationRangeBehavior,
  ExtensionContext,
  InlineCompletionList,
  Position,
  Range,
  TextDocument,
  TextEditor,
  TextEditorSelectionChangeEvent,
  window,
} from "vscode";
import {
  setFirstSuggestionFlag,
} from "./firstSuggestionDecorationFlag";
import { getTabnineExtensionContext } from "./globals/tabnineExtensionContext";
import { setDecoration } from "./vscode.api";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { MAX_SMALL_INTEGER_V8 } from "./globals/consts";
// Anchor hint to the right of the line
export const firstSuggestionDecorationType = window.createTextEditorDecorationType(
  {
    rangeBehavior: DecorationRangeBehavior.ClosedOpen,
  }
);

function getFirstSuggestionDecoration(
  document: TextDocument,
  position: Position
): DecorationOptions {
  return {
    renderOptions: {
      after: {
        color: "gray",
        contentText: "👈 Press Tab to accept Tabnine's suggestion",
        margin: "20px",
        border: "0.5px solid",
      },
    },
    range: document.validateRange(
      new Range(
        position.line,
        MAX_SMALL_INTEGER_V8,
        position.line,
        MAX_SMALL_INTEGER_V8
      )
    ),
  };
}

function displayFirstSuggestionDecoration(position: Position): void {
  const editor = window.activeTextEditor;
  if (!editor) {
    return;
  }
  setDecoration(
    firstSuggestionDecorationType,
    [getFirstSuggestionDecoration(editor.document, position)],
    editor
  );
  // for now: clear notification after 5 seconds
  setTimeout(clearFirstSuggestionDecoration, 5000, editor);
}

// message should be displayed if it has not been displayed yet,
// and if the extension has been installed within the last hour
function shouldDisplayFirstSuggestionDecoration(
  context: ExtensionContext | null
): boolean {
  console.log(context);
  return false;
}

function isEmptyCompletion(suggestion: TabnineInlineCompletionItem): boolean {
  if (!suggestion.insertText) {
    return true;
  }
  return suggestion.insertText.trim() === "";
}

export async function handleFirstSuggestionDecoration(
  position: Position,
  completions: InlineCompletionList<TabnineInlineCompletionItem> | undefined
): Promise<void> {
  if (
    !completions ||
    completions.items.length === 0 ||
    isEmptyCompletion(completions.items[0])
  ) {
    return;
  }
  const context = getTabnineExtensionContext();
  if (shouldDisplayFirstSuggestionDecoration(context)) {
    displayFirstSuggestionDecoration(position);
    await setFirstSuggestionFlag(context);
    window.onDidChangeTextEditorSelection(
      (e: TextEditorSelectionChangeEvent) => {
        if (e.selections[0].end.line !== position.line) {
          clearFirstSuggestionDecoration(e.textEditor);
        }
      }
    );
  }
}

export function clearFirstSuggestionDecoration(editor: TextEditor): void {
  setDecoration(firstSuggestionDecorationType, [], editor);
}
