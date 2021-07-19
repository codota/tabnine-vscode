import {
  commands,
  Disposable,
  ExtensionContext,
  TextEditor,
  window,
  workspace,
} from "vscode";
import acceptInlineSuggestion from "./acceptInlineSuggestion";
import clearInlineSuggestionsState from "./clearDecoration";
import { getNextSuggestion, getPrevSuggestion } from "./inlineSuggestionState";
import setInlineSuggestion from "./setInlineSuggestion";
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
    registerPrevHandler()
  );

  registerTextChangeHandler();

  registerCursorChangeHandler();
}
function registerCursorChangeHandler() {
  window.onDidChangeTextEditorSelection(() => clearInlineSuggestionsState());
}

function registerTextChangeHandler() {
  workspace.onDidChangeTextDocument(textListener);
}

function registerPrevHandler(): Disposable {
  return commands.registerTextEditorCommand(
    "tabnine.prev-inline-suggestion",
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
    "tabnine.next-inline-suggestion",
    ({ document, selection }: TextEditor) => {
      const nextSuggestion = getNextSuggestion();
      if (nextSuggestion) {
        setInlineSuggestion(document, selection.active, nextSuggestion);
      }
    }
  );
}

function registerEscapeHandler(): Disposable {
  return commands.registerTextEditorCommand(
    "tabnine.escape-inline-suggestion",
    () => {
      void clearInlineSuggestionsState();
    }
  );
}

function registerAcceptHandler(): Disposable {
  return commands.registerTextEditorCommand(
    "tabnine.accept-inline-suggestion",
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
