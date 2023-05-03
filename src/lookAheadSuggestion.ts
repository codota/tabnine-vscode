import {
  CancellationToken,
  Command,
  commands,
  Disposable,
  InlineCompletionList,
  Position,
  SelectedCompletionInfo,
  SnippetString,
  TextDocument,
  TextEditor,
  window,
} from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import getAutoImportCommand from "./getAutoImportCommand";
import { SuggestionTrigger, TAB_OVERRIDE_COMMAND } from "./globals/consts";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { escapeTabStopSign } from "./utils/utils";
import runCompletion from "./runCompletion";

// this will track only the suggestion which is "extending" the completion popup selected item,
// i.e. it is relevant only for case where both are presented popup and inline
let currentLookAheadSuggestion: TabnineInlineCompletionItem | undefined | null;

export function clearCurrentLookAheadSuggestion(): void {
  currentLookAheadSuggestion = undefined;
}
export async function initTabOverride(): Promise<Disposable> {
  return Disposable.from(
    await enableTabOverrideContext(),
    registerTabOverride()
  );
}

window.onDidChangeTextEditorSelection(clearCurrentLookAheadSuggestion);

// "look a head " suggestion
// is the suggestion witch extends te current selected intellisense popup item
// and queries tabnine with the selected item as prefix untitled-file-extension
export async function getLookAheadSuggestion(
  document: TextDocument,
  { range, text }: SelectedCompletionInfo,
  position: Position,
  cancellationToken: CancellationToken
): Promise<InlineCompletionList<TabnineInlineCompletionItem>> {
  const textAtRange = document.getText(range);
  const isContainsCompletionInfo = text.startsWith(textAtRange);

  if (!isContainsCompletionInfo) {
    return new InlineCompletionList([]);
  }
  const response = await runCompletion({
    document,
    position: range.end,
    currentSuggestionText: text.substring(textAtRange.length),
    retry: {
      cancellationToken,
    },
  });

  const result = findMostRelevantSuggestion(response, text);
  const completion =
    result &&
    response &&
    new TabnineInlineCompletionItem(
      result.new_prefix.replace(response.old_prefix, text),
      result,
      range.with({
        end: range.end.translate(0, result.old_suffix.length),
      }),
      getAutoImportCommand(
        result,
        response,
        position,
        SuggestionTrigger.LookAhead
      ),
      result.completion_metadata?.completion_kind,
      result.completion_metadata?.is_cached,
      result.completion_metadata?.snippet_context
    );

  currentLookAheadSuggestion = completion;

  return new InlineCompletionList((completion && [completion]) || []);
}

function findMostRelevantSuggestion(
  response: AutocompleteResult | null | undefined,
  currentSelectedText: string
): ResultEntry | undefined {
  return response?.results.find(({ new_prefix }) =>
    new_prefix.startsWith(
      getCompletionInfoWithoutOverlappingDot(currentSelectedText)
    )
  );
}

function getCompletionInfoWithoutOverlappingDot(currentSelectedText: string) {
  return currentSelectedText.startsWith(".")
    ? currentSelectedText.substring(1)
    : currentSelectedText;
}

function registerTabOverride(): Disposable {
  return commands.registerTextEditorCommand(
    `${TAB_OVERRIDE_COMMAND}`,
    (textEditor: TextEditor) => {
      if (!currentLookAheadSuggestion) {
        void commands.executeCommand("acceptSelectedSuggestion");
        return;
      }

      const { range, insertText, command } = currentLookAheadSuggestion;
      if (range && insertText && command) {
        void textEditor
          .insertSnippet(
            new SnippetString(escapeTabStopSign(insertText)),
            range
          )
          .then(() => executeSelectionCommand(command));
      }
    }
  );
}

function executeSelectionCommand(command: Command): void {
  void commands.executeCommand(command.command, command.arguments?.[0]);
}

async function enableTabOverrideContext(): Promise<Disposable> {
  await commands.executeCommand("setContext", "tabnine.tab-override", true);
  return {
    dispose() {
      void commands.executeCommand(
        "setContext",
        "tabnine.tab-override",
        undefined
      );
    },
  };
}
