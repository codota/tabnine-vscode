import {
  commands,
  Disposable,
  InlineCompletionList,
  Position,
  SelectedCompletionInfo,
  TextDocument,
  TextEditor,
  TextEditorEdit,
} from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import getAutoImportCommand from "./getAutoImportCommand";
import { TAB_OVERRIDE_COMMAND } from "./globals/consts";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import runCompletion from "./runCompletion";
import retry from "./utils/retry";

// this will track only the suggestion which is "extending" the completion popup selected item,
// i.e. it is relevant only for case where both are presented popup and inline
let currentLookAheadSuggestion: TabnineInlineCompletionItem | undefined | null;

export function clearCurrentLookAheadSuggestion(): void {
  currentLookAheadSuggestion = undefined;
}
export async function initTabOverrideForAlpha(
  subscriptions: Disposable[]
): Promise<void> {
  if (isCapabilityEnabled(Capability.ALPHA_CAPABILITY)) {
    console.log("initTabOverrideForAlpha");
    subscriptions.push(await enableTabOverrideContext(), registerTabOverride());
  }
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
      result.new_prefix.replace(response.old_prefix, completionInfo.text),
      completionInfo.range,
      getAutoImportCommand(result, response, position),
      result.completion_kind,
      result.is_cached,
      response.snippet_intent
    );

  currentLookAheadSuggestion = completion;

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
      const { range, insertText } = currentLookAheadSuggestion ?? {
        range: undefined,
        insertTex: undefined,
      };
      if (range && insertText) {
        console.log(
          `range: ${JSON.stringify(range)}, insertText: ${insertText}`
        );
        edit.replace(range, insertText);
      } else {
        void commands.executeCommand("acceptSelectedSuggestion");
      }
    }
  );
}
async function enableTabOverrideContext(): Promise<Disposable> {
  const res = await commands.executeCommand(
    "setContext",
    "tabnine.tab-override",
    true
  );

  console.log("res after enableTabOverrideContext: ", res);

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
