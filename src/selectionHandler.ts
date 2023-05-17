import {
  CodeAction,
  CodeActionKind,
  commands,
  Range,
  Position,
  Selection,
  TextEditor,
  TextEditorEdit,
  workspace,
} from "vscode";
import findImports from "./findImports";
import CompletionOrigin from "./CompletionOrigin";
import {
  DELAY_FOR_CODE_ACTION_PROVIDER,
  SuggestionTrigger,
} from "./globals/consts";
import { ResultEntry } from "./binary/requests/requests";
import setState, {
  SelectionStateRequest,
  SetStateSuggestion,
} from "./binary/requests/setState";
import { CompletionArguments } from "./CompletionArguments";

export const COMPLETION_IMPORTS = "tabnine-completion-imports";
export const HANDLE_IMPORTS = "tabnine-handle-imports";
export const SELECTION_COMPLETED = "tabnine-selection-completed";

export function selectionHandler(
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
    handleState(
      position,
      completions,
      currentCompletion,
      limited,
      editor,
      oldPrefix,
      suggestionTrigger
    );

    void commands.executeCommand(HANDLE_IMPORTS, {
      completion: currentCompletion,
    });
  } catch (error) {
    console.error(error);
  }
}

function handleState(
  position: Position,
  completions: ResultEntry[],
  currentCompletion: string,
  limited: boolean,
  editor: TextEditor,
  oldPrefix?: string,
  suggestionTrigger?: SuggestionTrigger
) {
  if (position && completions?.length) {
    const eventData = eventDataOf(
      completions,
      currentCompletion,
      limited,
      editor,
      position,
      oldPrefix,
      suggestionTrigger
    );
    void setState(eventData).then(() =>
      commands.executeCommand(SELECTION_COMPLETED)
    );
  }
}

function eventDataOf(
  completions: ResultEntry[],
  currentCompletion: string,
  limited: boolean,
  editor: TextEditor,
  position: Position,
  oldPrefix?: string,
  suggestionTrigger?: SuggestionTrigger
) {
  const index = completions.findIndex(
    ({ new_prefix: newPrefix }) => newPrefix === currentCompletion
  );
  let numOfVanillaSuggestions = 0;
  let numOfDeepLocalSuggestions = 0;
  let numOfDeepCloudSuggestions = 0;
  let numOfLspSuggestions = 0;
  let numOfVanillaKeywordSuggestions = 0;
  const currInCompletions = completions[index];
  const snippetContext = currInCompletions.completion_metadata?.snippet_context;

  const suggestions: SetStateSuggestion[] = completions.map((c) => {
    switch (c.completion_metadata?.origin) {
      case CompletionOrigin.VANILLA:
        numOfVanillaSuggestions += 1;
        break;
      case CompletionOrigin.LOCAL:
        numOfDeepLocalSuggestions += 1;
        break;
      case CompletionOrigin.CLOUD:
      case CompletionOrigin.CLOUD2:
      case CompletionOrigin.ANBU:
        numOfDeepCloudSuggestions += 1;
        break;
      case CompletionOrigin.LSP:
        numOfLspSuggestions += 1;
        break;
      case CompletionOrigin.VANILLA_KEYWORD:
        numOfVanillaKeywordSuggestions += 1;
        break;
      default:
        break;
    }

    return {
      length: c.new_prefix.length,
      strength: resolveDetailOf(c),
      origin: c.completion_metadata?.origin ?? CompletionOrigin.UNKNOWN,
    };
  });

  const { length } = currentCompletion;
  const netLength = length - (oldPrefix?.length || 0);
  const strength = resolveDetailOf(currInCompletions);
  const { origin } = currInCompletions.completion_metadata ?? {};
  const prefixLength = editor.document
    .getText(new Range(new Position(position.line, 0), position))
    .trimLeft().length;
  const netPrefixLength = prefixLength - (length - netLength);
  // suffixLength is defined to be 0 if the completion has more than 1 line.
  const suffixLength = currInCompletions.new_prefix.includes("\n")
    ? 0
    : editor.document.lineAt(position).text.trim().length -
      (prefixLength + netLength);
  const numOfSuggestions = completions.length;

  const eventData: SelectionStateRequest = {
    Selection: {
      language: extractLanguage(editor),
      length,
      net_length: netLength,
      strength,
      origin: origin ?? CompletionOrigin.UNKNOWN,
      index,
      line_prefix_length: prefixLength,
      line_net_prefix_length: netPrefixLength,
      line_suffix_length: suffixLength,
      num_of_suggestions: numOfSuggestions,
      num_of_vanilla_suggestions: numOfVanillaSuggestions,
      num_of_deep_local_suggestions: numOfDeepLocalSuggestions,
      num_of_deep_cloud_suggestions: numOfDeepCloudSuggestions,
      num_of_lsp_suggestions: numOfLspSuggestions,
      num_of_vanilla_keyword_suggestions: numOfVanillaKeywordSuggestions,
      suggestions,
      is_locked: limited,
      completion_kind: currInCompletions.completion_metadata?.completion_kind,
      snippet_context: snippetContext,
      suggestion_trigger: suggestionTrigger,
    },
  };

  return eventData;
}

function resolveDetailOf(completion: ResultEntry): string | undefined {
  if (completion.completion_metadata?.origin === CompletionOrigin.LSP) {
    return "";
  }

  return completion.completion_metadata?.detail;
}

function extractLanguage(editor: TextEditor) {
  const fileNameElements = editor.document.fileName.split(".");

  return (
    fileNameElements[Math.max(1, fileNameElements.length - 1)] ?? "undefined"
  );
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
