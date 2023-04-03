import {
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
import runCompletion from "./runCompletion";
import retry from "./utils/retry";
import { escapeTabStopSign } from "./utils/utils";

// this will track only the suggestion which is "extending" the completion popup selected item,
// i.e. it is relevant only for case where both are presented popup and inline
let currentLookAheadSuggestion: TabnineInlineCompletionItem | undefined | null;

export function clearCurrentLookAheadSuggestion(): void {
  currentLookAheadSuggestion = undefined;
}
export async function initTabOverride(
  subscriptions: Disposable[]
): Promise<void> {
  subscriptions.push(await enableTabOverrideContext(), registerTabOverride());
}

window.onDidChangeTextEditorSelection(clearCurrentLookAheadSuggestion);

// "look a head " suggestion
// is the suggestion witch extends te current selected intellisense popup item
// and queries tabnine with the selected item as prefix untitled-file-extension
export async function getLookAheadSuggestion(
  document: TextDocument,
  completionInfo: SelectedCompletionInfo,
  position: Position
): Promise<InlineCompletionList<TabnineInlineCompletionItem>> {
  const isContainsCompletionInfo = completionInfo.text.startsWith(
    document.getText(completionInfo.range)
  );

  if (!isContainsCompletionInfo) {
    return new InlineCompletionList([]);
  }

  const response = await retry(
    () =>
      runCompletion(
        document,
        completionInfo.range.start,
        undefined,
        completionInfo.text
      ),
    (res) => !!res?.results.length,
    2
  );

  const result = findMostRelevantSuggestion(response, completionInfo);
  const completion =
    result &&
    response &&
    new TabnineInlineCompletionItem(
      result.new_prefix.replace(response.old_prefix, completionInfo.text),
      result,
      completionInfo.range,
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
  completionInfo: SelectedCompletionInfo
): ResultEntry | undefined {
  return response?.results.find(({ new_prefix }) =>
    new_prefix.startsWith(
      getCompletionInfoWithoutOverlappingDot(completionInfo)
    )
  );
}

function getCompletionInfoWithoutOverlappingDot(
  completionInfo: SelectedCompletionInfo
) {
  return completionInfo.text.startsWith(".")
    ? completionInfo.text.substring(1)
    : completionInfo.text;
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
