import {
  commands,
  Disposable,
  ExtensionContext,
  TextEditor,
  TextEditorSelectionChangeEvent,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import {
  ACCEPT_INLINE_COMMAND,
  ESCAPE_INLINE_COMMAND,
  NEXT_INLINE_COMMAND,
  PREV_INLINE_COMMAND,
  SNIPPET_COMMAND,
} from "../globals/consts";
import acceptInlineSuggestion from "./acceptInlineSuggestion";
import clearInlineSuggestionsState from "./clearDecoration";
import { getNextSuggestion, getPrevSuggestion } from "./inlineSuggestionState";
import setInlineSuggestion from "./setInlineSuggestion";
import requestSnippet from "./snippetProvider";
import textListener from "./textListener";

export const decorationType = window.createTextEditorDecorationType({});

export default async function registerHandlers(
  context: ExtensionContext
): Promise<void> {
  await enableInlineSuggestionsContext();
  context.subscriptions.push(
    registerAcceptHandler(),
    registerEscapeHandler(),
    registerNextHandler(),
    registerPrevHandler(),
    registerSnippetHandler()
  );

  registerTextChangeHandler();

  registerCursorChangeHandler();
}
function registerCursorChangeHandler() {
  window.onDidChangeTextEditorSelection((e: TextEditorSelectionChangeEvent) => {
    if (e.kind !== undefined && e.kind !== TextEditorSelectionChangeKind.Command) {
      void clearInlineSuggestionsState();
    }
  });
}

function registerTextChangeHandler() {
  workspace.onDidChangeTextDocument(textListener);
}
function registerSnippetHandler(): Disposable {
  return commands.registerTextEditorCommand(
    `${SNIPPET_COMMAND}`,
    ({document, selection}: TextEditor) =>
      void requestSnippet(document, selection.active)
  );
}

function registerPrevHandler(): Disposable {
  return commands.registerTextEditorCommand(
    `${PREV_INLINE_COMMAND}`,
    ({ document, selection }: TextEditor) => {
      const prevSuggestion = getPrevSuggestion();
      if (prevSuggestion) {
        setInlineSuggestion(document, selection.active, prevSuggestion);
      }
    }
  );
}

function registerNextHandler(): Disposable {
  return commands.registerTextEditorCommand(
    `${NEXT_INLINE_COMMAND}`,
    ({ document, selection }: TextEditor) => {
      const nextSuggestion = getNextSuggestion();
      if (nextSuggestion) {
        setInlineSuggestion(document, selection.active, nextSuggestion);
      }
    }
  );
}

function registerEscapeHandler(): Disposable {
  return commands.registerTextEditorCommand(`${ESCAPE_INLINE_COMMAND}`, () => {
    void clearInlineSuggestionsState();
  });
}

function registerAcceptHandler(): Disposable {
  return commands.registerTextEditorCommand(
    `${ACCEPT_INLINE_COMMAND}`,
    (editor: TextEditor) => {
      void acceptInlineSuggestion(editor);
    }
  );
}

async function enableInlineSuggestionsContext() {
  await commands.executeCommand(
    "setContext",
    "tabnine.inline-suggestion:enabled",
    true
  );
}
