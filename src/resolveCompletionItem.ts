import {
  commands,
  CompletionItem,
  Position,
  Range,
  SnippetString,
  TextDocument,
  TextEditor,
  window,
  workspace,
} from "vscode";
import { autocomplete, AutocompleteResult } from "./binary/requests/requests";
import { CompletionArguments } from "./CompletionArguments";
import CompletionOrigin from "./CompletionOrigin";
import { CHAR_LIMIT, MAX_NUM_RESULTS } from "./globals/consts";
import { COMPLETION_IMPORTS } from "./selectionHandler";

let currentLookAhead: CompletionArguments | null = null;

export default function resolveCompletionItem(
  item: CompletionItem
): CompletionItem {
  clearDecoration();
  const { prefix, currentCompletion, position } = getCurrentCompletionArgs(
    item
  );

  console.log(
    `in resolveCompletionItem, prefix:${prefix} completion: ${currentCompletion}`
  );

  let suggestedHint = clearPrefixFromSuggestion(currentCompletion, prefix);

  const document = window.activeTextEditor?.document;
  if (suggestedHint && document) {
    console.log("before running the completion");
    void (async function run() {
      const completionResults = await runCompletion(
        document,
        position,
        suggestedHint
      );
      const newSuggestion = completionResults?.results?.filter(
        (r) =>
          r.origin &&
          [CompletionOrigin.CLOUD, CompletionOrigin.LOCAL].includes(r.origin) &&
          r.new_prefix.length > 3
      )?.[0];
      if (completionResults && newSuggestion?.new_prefix) {
        console.log(
          `got results - old label: ${suggestedHint}, prefix: ${prefix}, new prefix: ${newSuggestion.new_prefix}, old prefix: ${completionResults?.old_prefix}`
        );
        suggestedHint = (
          currentCompletion.replace(
            new RegExp(`${completionResults.old_prefix}$`),
            ""
          ) + newSuggestion.new_prefix
        ).replace(prefix, "");
        currentLookAhead = {
          ...getCurrentCompletionArgs(item),
          completions: completionResults.results,
          suffix:
            getCurrentCompletionArgs(item).suffix + newSuggestion.new_suffix,
          currentCompletion: suggestedHint,
        };
        suggestedHint = `${suggestedHint}          [tab][tab] to commit`;
      } else {
        currentLookAhead = null;
        console.log(
          `no results - old label: ${suggestedHint}, prefix: ${prefix}`
        );
      }
      showTextDecoration(position, suggestedHint);
    })();
  }
  return item;
}


const decorationType = window.createTextEditorDecorationType({
  after: { margin: "0 0 0 0" },
});

function clearPrefixFromSuggestion(currentCompletion: string, prefix: string) {
  return currentCompletion?.replace(prefix.trim(), "");
}

function getCurrentCompletionArgs(item: CompletionItem): CompletionArguments {
  return item.command?.arguments?.[0] as CompletionArguments;
}

function showTextDecoration(position: Position, hover: string) {
  const decoration = {
    renderOptions: {
      after: {
        contentText: hover,
        color: "gray",
      },
    },
    range: new Range(
      new Position(position.line, position.character),
      new Position(position.line, 1024)
    ),
  };

  window.activeTextEditor?.setDecorations(decorationType, [decoration]);
}
function clearDecoration(): void {
  console.log("in clearDecoration");
  currentLookAhead = null;
  window.activeTextEditor?.setDecorations(decorationType, []);
}
workspace.onDidChangeTextDocument(() => {
  console.log("in onDidChangeTextDocument");
  clearDecoration();
});

window.onDidChangeTextEditorSelection(() => {
  console.log("in onDidChangeTextEditorSelection");
  clearDecoration();
});

export function handleMenuSelectionChangedNext(): void {
  clearDecoration();
  void commands.executeCommand("selectNextSuggestion");
}
export function handleMenuSelectionChangedPrev(): void {
  clearDecoration();
  void commands.executeCommand("selectPrevSuggestion");
}

export async function lookAheadSelections(editor: TextEditor): Promise<void> {
  if (currentLookAhead) {
    const range = new Range(
      currentLookAhead.position,
      currentLookAhead.position.translate(0, currentLookAhead.suffix.length)
    );
    const insertText = new SnippetString(
      escapeTabStopSign(currentLookAhead.currentCompletion)
    );

    if (currentLookAhead.suffix) {
      insertText
        .appendTabstop(0)
        .appendText(escapeTabStopSign(currentLookAhead.suffix));
    }

    const completion = currentLookAhead;
    await editor.insertSnippet(insertText, range);

    void commands.executeCommand(COMPLETION_IMPORTS, completion);
  }
}
function escapeTabStopSign(value: string) {
  return value.replace(new RegExp("\\$", "g"), "\\$");
}

async function runCompletion(
  document: TextDocument,
  position: Position,
  lookAhead: string
): Promise<AutocompleteResult | null | undefined> {
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  const afterEnd = document.positionAt(afterEndOffset);
  return autocomplete({
    filename: document.fileName,
    before: document.getText(new Range(beforeStart, position)) + lookAhead,
    after: document.getText(new Range(position, afterEnd)),
    region_includes_beginning: beforeStartOffset === 0,
    region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
    max_num_results: MAX_NUM_RESULTS,
  });
}
