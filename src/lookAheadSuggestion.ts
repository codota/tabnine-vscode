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
} from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import getAutoImportCommand from "./getAutoImportCommand";
import { SuggestionTrigger, TAB_OVERRIDE_COMMAND } from "./globals/consts";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import runCompletion from "./runCompletion";
import retry from "./utils/retry";
import { constructSnippetString } from "./utils/utils";

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

// "look a head " suggestion
// is the suggestion witch extends te current selected intellisense popup item
// and queries tabnine with the selected item as prefix untitled-file-extension
export async function getLookAheadSuggestion(
  document: TextDocument,
  completionInfo: SelectedCompletionInfo,
  position: Position
): Promise<InlineCompletionList<TabnineInlineCompletionItem>> {
  const response = await retry(
    () =>
      runCompletion(
        document,
        completionInfo.range.start,
        undefined,
        completionInfo.text
      ),
    (res) => !res?.results.length,
    2
  );

  const result = findMostRelevantSuggestion(response, completionInfo);
  const completion =
    result &&
    response &&
    new TabnineInlineCompletionItem(
      constructSnippetString(
        result.new_prefix.replace(response.old_prefix, completionInfo.text),
        result.new_suffix
      ),
      completionInfo.range,
      getAutoImportCommand(
        result,
        response,
        position,
        SuggestionTrigger.LookAhead
      ),
      result.completion_kind,
      result.is_cached,
      response.snippet_context
    );

  currentLookAheadSuggestion = completion;

  return new InlineCompletionList((completion && [completion]) || []);
}

function findMostRelevantSuggestion(
  response: AutocompleteResult | null | undefined,
  completionInfo: SelectedCompletionInfo
): ResultEntry | undefined {
  return response?.results
    .filter(({ new_prefix }) =>
      new_prefix.startsWith(
        getCompletionInfoWithoutOverlappingDot(completionInfo)
      )
    )
    .sort(
      (a, b) => parseInt(b.detail || "", 10) - parseInt(a.detail || "", 10)
    )[0];
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
        const value =
          typeof insertText === "string"
            ? new SnippetString(insertText)
            : insertText;
        void textEditor
          .insertSnippet(value, range)
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
