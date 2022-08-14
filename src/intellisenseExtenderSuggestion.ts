/* eslint-disable class-methods-use-this */
import {
  Command,
  commands,
  Disposable,
  InlineCompletionContext,
  InlineCompletionItem,
  InlineCompletionList,
  Position,
  SelectedCompletionInfo,
  TextDocument,
  TextEditor,
  TextEditorEdit,
  languages,
} from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import getAutoImportCommand from "./getAutoImportCommand";
import { TAB_OVERRIDE_COMMAND } from "./globals/consts";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import runCompletion from "./runCompletion";
import retry from "./utils/retry";

// this will track only the suggestion which is "extending" the completion popup selected item,
// i.e. it is relevant only for case where both are presented popup and inline
let currentIntellisenseExtendedSuggestion:
  | TabnineInlineCompletionItem
  | undefined
  | null;

function clearIntellisenseExtendedSuggestion(): void {
  currentIntellisenseExtendedSuggestion = undefined;
}
async function initTabOverride(): Promise<Disposable[]> {
  return [await enableTabOverrideContext(), registerTabOverride()];
}

// "look a head " suggestion
// is the suggestion witch extends te current selected intellisense popup item
// and queries tabnine with the selected item as prefix untitled-file-extension
async function getIntellisenseExtendedSuggestion(
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
      result.new_prefix.replace(response.old_prefix, completionInfo.text),
      completionInfo.range,
      getAutoImportCommand(result, response, position),
      result.completion_kind,
      result.is_cached,
      response.snippet_context
    );

  currentIntellisenseExtendedSuggestion = completion;

  return new InlineCompletionList((completion && [completion]) || []);
}

function findMostRelevantSuggestion(
  response: AutocompleteResult | null | undefined,
  completionInfo: SelectedCompletionInfo
): ResultEntry | undefined {
  return response?.results
    .filter(({ new_prefix }) => new_prefix.startsWith(completionInfo.text))
    .sort(
      (a, b) => parseInt(b.detail || "", 10) - parseInt(a.detail || "", 10)
    )[0];
}

function registerTabOverride(): Disposable {
  return commands.registerTextEditorCommand(
    `${TAB_OVERRIDE_COMMAND}`,
    (_textEditor: TextEditor, edit: TextEditorEdit) => {
      if (!currentIntellisenseExtendedSuggestion) {
        void commands.executeCommand("acceptSelectedSuggestion");
        return;
      }

      const {
        range,
        insertText,
        command,
      } = currentIntellisenseExtendedSuggestion;
      if (range && insertText && command) {
        edit.replace(range, insertText);
        executeSelectionCommand(command);
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

async function provideInlineCompletionItems(
  document: TextDocument,
  position: Position,
  context: InlineCompletionContext
): Promise<
  InlineCompletionList<InlineCompletionItem> | InlineCompletionItem[]
> {
  try {
    clearIntellisenseExtendedSuggestion();

    const completionInfo = context.selectedCompletionInfo;
    if (completionInfo) {
      return await getIntellisenseExtendedSuggestion(
        document,
        completionInfo,
        position
      );
    }
    return new InlineCompletionList([]);
  } catch (error) {
    console.error(`Error setting up request: ${error}`);
    return new InlineCompletionList([]);
  }
}

export default async function initIntellisenseExtenderProvider(): Promise<
  Disposable[]
> {
  return [
    ...(await initTabOverride()),
    languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      { provideInlineCompletionItems }
    ),
  ];
}
