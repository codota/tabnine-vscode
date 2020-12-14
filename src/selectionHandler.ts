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
  DecorationOptions,
  window,
  MarkdownString,
} from "vscode";
import findImports from "./findImports";
import CompletionOrigin from "./CompletionOrigin";
import { DELAY_FOR_CODE_ACTION_PROVIDER } from "./consts";
import { ResultEntry } from "./binary/requests/requests";
import setState, {
  SelectionStateRequest,
  SetStateSuggestion,
} from "./binary/requests/setState";
import { CompletionArguments } from "./CompletionArguments";
export const COMPLETION_IMPORTS = "tabnine-completion-imports";

export function selectionHandler(
  editor: TextEditor,
  edit: TextEditorEdit,
  { currentCompletion, completions, position }: CompletionArguments
): void {
  decorateLimit(position.line)
  try {
    const eventData = eventDataOf(
      completions,
      currentCompletion,
      editor,
      position
    );
    void setState(eventData);

    void handleImports(editor, currentCompletion);
  } catch (error) {
    console.error(error);
  }
}
let decoration: DecorationOptions;

function decorateLimit(line: number) {
  
  const message = `visit [tabnine](https://www.tabnine.com/pricing/lp) to unlock`;
  decoration = {
    renderOptions: {after: {contentText: `🔒 daily selection limit reached`, color: "gray"}},
    range: new Range(new Position(line, 1024), new Position(line, 1024)),
    hoverMessage: new MarkdownString(message, true),
  };
  refreshDecorations();
}

export const decorationType = window.createTextEditorDecorationType({after: {margin: '0 0 0 1rem'}});
let decorationsDebounce: NodeJS.Timeout;
function refreshDecorations(delay = 10) {
  clearTimeout(decorationsDebounce);
  decorationsDebounce = setTimeout(
    () =>
      window.activeTextEditor?.setDecorations(
        decorationType,
        [decoration]
      ),
    delay
  );
}
workspace.onDidChangeTextDocument(() => {
  window.activeTextEditor?.setDecorations(
    decorationType,
    []
  )
});



function eventDataOf(
  completions: ResultEntry[],
  currentCompletion: string,
  editor: TextEditor,
  position: Position
) {
  const index = completions.findIndex(
    ({ new_prefix: newPrefix }) => newPrefix === currentCompletion
  );

  let numOfVanillaSuggestions = 0;
  let numOfDeepLocalSuggestions = 0;
  let numOfDeepCloudSuggestions = 0;
  let numOfLspSuggestions = 0;
  const currInCompletions = completions[index];

  const suggestions: SetStateSuggestion[] = completions.map((c) => {
    if (c.origin === CompletionOrigin.VANILLA) {
      numOfVanillaSuggestions += 1;
    } else if (c.origin === CompletionOrigin.LOCAL) {
      numOfDeepLocalSuggestions += 1;
    } else if (c.origin === CompletionOrigin.CLOUD) {
      numOfDeepCloudSuggestions += 1;
    } else if (c.origin === CompletionOrigin.LSP) {
      numOfLspSuggestions += 1;
    }

    return {
      length: c.new_prefix.length,
      strength: resolveDetailOf(c),
      origin: c.origin ?? CompletionOrigin.UNKNOWN,
    };
  });

  const { length } = currentCompletion;
  const netLength = editor.selection.anchor.character - position.character;
  const strength = resolveDetailOf(currInCompletions);
  const { origin } = currInCompletions;
  const prefixLength = editor.document
    .getText(new Range(new Position(position.line, 0), position))
    .trimLeft().length;
  const netPrefixLength = prefixLength - (currentCompletion.length - netLength);
  const suffixLength =
    editor.document.lineAt(position).text.trim().length -
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
      suggestions,
    },
  };

  return eventData;
}

function resolveDetailOf(completion: ResultEntry): string | undefined {
  if (completion.origin === CompletionOrigin.LSP) {
    return "";
  }

  return completion.detail;
}

function extractLanguage(editor: TextEditor) {
  const fileNameElements = editor.document.fileName.split(".");

  return (
    fileNameElements[Math.max(1, fileNameElements.length - 1)] ?? "undefined"
  );
}

function handleImports(editor: TextEditor, completion: string) {
  const { selection } = editor;
  const completionSelection = new Selection(
    selection.active.translate(0, -completion.length),
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
      CodeActionKind.QuickFix
    );
    const importCommand = findImports(codeActionCommands)[0];

    if (importCommand && importCommand.edit) {
      await workspace.applyEdit(importCommand.edit);
      await commands.executeCommand(COMPLETION_IMPORTS, { completion });
    }
  } catch (error) {
    console.error(error);
  }
}
