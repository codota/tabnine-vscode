import {
  commands,
  ExtensionContext,
  MarkdownString,
  Position,
  Range,
  SnippetString,
  TextDocument,
  TextDocumentChangeEvent,
  TextEditor,
  window,
  workspace,
} from "vscode";
import { autocomplete, AutocompleteResult } from "./binary/requests/requests";
import { CompletionArguments } from "./CompletionArguments";
import { CHAR_LIMIT, MAX_NUM_RESULTS } from "./globals/consts";
import { COMPLETION_IMPORTS } from "./selectionHandler";

let suggestedCompletion: CompletionArguments | null = null;
let autocompleteResult: AutocompleteResult | null | undefined = null;
let currentSuggestionIndex = 0;
let currentTextPosition: Position | null = null;
let iterator : { next: ()=> number, prev: ()=> number} | null = null;

const decorationType = window.createTextEditorDecorationType({});

function rotate(value: number) {
  let current = 0;
  return {
    next(){
      current += 1;
      if (current >= value) {
        current = 0;
      }
      return current;
    },
    prev() {
      current -= 1;
      if (current <= 0) {
        current = value;
      }
      return current;

    }
  }
}

export default async function inlineSuggestions(
  context: ExtensionContext
): Promise<void> {
  await commands.executeCommand(
    "setContext",
    "tabnine.inline-suggestion:enabled",
    true
  );
  context.subscriptions.push(
    commands.registerTextEditorCommand(
      "tabnine.accept-inline-suggestion",
      (editor: TextEditor) => {
        void acceptInlineSuggestion(editor);
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.escape-inline-suggestion",
      () => {
        clearDecoration();
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.next-inline-suggestion",
      (editor: TextEditor) => {
        if (iterator) {
          currentSuggestionIndex = iterator.next();
          setSuggestion(editor.document);
        }
      }
    ),
    commands.registerTextEditorCommand(
      "tabnine.prev-inline-suggestion",
      (editor: TextEditor) => {
        if (iterator) {
          currentSuggestionIndex = iterator.prev();
          setSuggestion(editor.document);
        }
      }
    )
  );
  initTextListener();
}
function initTextListener() {
  workspace.onDidChangeTextDocument(async (data: TextDocumentChangeEvent) => {
    clearDecoration();
    if (data.contentChanges.length > 0) {
      currentTextPosition = data.contentChanges[0].range.end.translate(
        undefined,
        data.contentChanges[0].text.length
      );
      const { document } = data;

      currentSuggestionIndex = 0;
      autocompleteResult = await runCompletion(document, currentTextPosition);
      if (autocompleteResult?.results?.length) {
        iterator = rotate(autocompleteResult.results.length);
        setSuggestion(document);
      }
    }
  });
}

function setSuggestion(document: TextDocument) {
  const newSuggestion = autocompleteResult?.results?.[currentSuggestionIndex];

  if (autocompleteResult && newSuggestion && currentTextPosition) {
    if (
      autocompleteResult.old_prefix &&
      !newSuggestion.new_prefix?.includes(autocompleteResult.old_prefix)
    ) {
      return;
    }
    const suggestedHint = clearPrefixFromSuggestion(
      newSuggestion?.new_prefix || "",
      autocompleteResult?.old_prefix || ""
    );

    const suffix = document.getText(
      new Range(
        currentTextPosition,
        document.lineAt(currentTextPosition.line).range.end
      )
    );

    showTextDecoration(
      currentTextPosition,
      suggestedHint.replace(new RegExp(`${escapeRegExp(suffix)}$`), "")
    );
    suggestedCompletion = {
      currentCompletion: newSuggestion?.new_prefix,
      completions: autocompleteResult.results,
      position: currentTextPosition,
      limited: false,
      oldPrefix: autocompleteResult.old_prefix,
      suffix: newSuggestion.new_suffix,
      oldSuffix: newSuggestion.old_suffix,
    };
  }
}

async function runCompletion(
  document: TextDocument,
  position: Position
): Promise<AutocompleteResult | null | undefined> {
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  const afterEnd = document.positionAt(afterEndOffset);
  return autocomplete({
    filename: document.fileName,
    before: document.getText(new Range(beforeStart, position)),
    after: document.getText(new Range(position, afterEnd)),
    region_includes_beginning: beforeStartOffset === 0,
    region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
    max_num_results: MAX_NUM_RESULTS,
  });
}
function showTextDecoration(position: Position, hover: string) {
  const message = new MarkdownString(
    `[Next \\(alt+\\]\\)](command:tabnine.next-inline-suggestion)&nbsp;&nbsp;[Prev \\(alt+\\[\\)](command:tabnine.prev-inline-suggestion)&nbsp;&nbsp;[Accept \\(tab\\)](command:tabnine.accept-inline-suggestion)&nbsp;&nbsp;[Escape \\(esc\\)](command:tabnine.escape-inline-suggestion)&nbsp;&nbsp;tabnine`,
    true
  );
  message.isTrusted = true;
  const decoration = {
    renderOptions: {
      after: {
        color: "gray",
        contentText: hover,
      },
    },
    hoverMessage: message,
    range: new Range(
      new Position(position.line, position.character),
      new Position(position.line, position.character)
    ),
  };

  window.activeTextEditor?.setDecorations(decorationType, [decoration]);
}

async function acceptInlineSuggestion(editor: TextEditor): Promise<void> {
  if (suggestedCompletion) {
    const range = new Range(
      suggestedCompletion.position.translate(
        undefined,
        -suggestedCompletion.oldPrefix.length
      ),
      suggestedCompletion.position.translate(
        undefined,
        suggestedCompletion.oldSuffix.length
      )
    );
    const insertText = new SnippetString(
      escapeTabStopSign(suggestedCompletion.currentCompletion)
    );

    if (suggestedCompletion.suffix) {
      insertText
        .appendTabstop(0)
        .appendText(escapeTabStopSign(suggestedCompletion.suffix));
    }

    const completion = suggestedCompletion;
    await editor.insertSnippet(insertText, range);
    clearDecoration();

    void commands.executeCommand(COMPLETION_IMPORTS, completion);
  }
}
function clearPrefixFromSuggestion(currentCompletion: string, prefix: string) {
  return currentCompletion?.replace(prefix, "");
}
function escapeTabStopSign(value: string) {
  return value.replace(new RegExp("\\$", "g"), "\\$");
}
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clearDecoration(): void {
  suggestedCompletion = null;
  window.activeTextEditor?.setDecorations(decorationType, []);
}
