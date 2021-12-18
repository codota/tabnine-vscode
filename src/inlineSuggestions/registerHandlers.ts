import {
  commands,
  Disposable,
  ExtensionContext,
  ExtensionMode,
  languages,
  TextEditor,
  TextEditorSelectionChangeEvent,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import getSuggestionMode, {
  SuggestionsMode,
} from "../capabilities/getSuggestionMode";
import {
  ACCEPT_INLINE_COMMAND,
  ESCAPE_INLINE_COMMAND,
  NEXT_INLINE_COMMAND,
  PREV_INLINE_COMMAND,
  SNIPPET_COMMAND,
} from "../globals/consts";
import enableProposed from "../globals/proposedAPI";
import provideInlineCompletionItems from "../provideInlineCompletionItems";
import acceptInlineSuggestion from "./acceptInlineSuggestion";
import clearInlineSuggestionsState from "./clearDecoration";
import { getNextSuggestion, getPrevSuggestion } from "./inlineSuggestionState";
import setInlineSuggestion, {
  isShowingDecoration,
} from "./setInlineSuggestion";
import snippetAutoTriggerHandler from "./snippets/autoTriggerHandler";
import { isInSnippetInsertion } from "./snippets/blankSnippet";
import requestSnippet from "./snippets/snippetProvider";
import textListener from "./textListener";

export const decorationType = window.createTextEditorDecorationType({});

function isInlineEnabled(context: ExtensionContext) {
  return (
    getSuggestionMode() === SuggestionsMode.INLINE ||
    context.extensionMode === ExtensionMode.Test
  );
}

function isSnippetSuggestionsEnabled(context: ExtensionContext) {
  return (
    isCapabilityEnabled(Capability.SNIPPET_SUGGESTIONS) ||
    context.extensionMode === ExtensionMode.Test
  );
}

function isSnippetAutoTriggerEnabled() {
  return isCapabilityEnabled(Capability.SNIPPET_AUTO_TRIGGER);
}

export default async function registerInlineHandlers(
  context: ExtensionContext
): Promise<void> {
  const inlineEnabled = isInlineEnabled(context);
  const snippetsEnabled = isSnippetSuggestionsEnabled(context);

  if (!inlineEnabled && !snippetsEnabled) return;

  if (
    snippetsEnabled &&
    isCapabilityEnabled(Capability.ALPHA_CAPABILITY) &&
    (await enableProposed())
  ) {
    context.subscriptions.push(
      languages.registerInlineCompletionItemProvider(
        { pattern: "**" },
        {
          provideInlineCompletionItems,
        }
      )
    );
    return;
  }

  if (inlineEnabled) {
    await enableInlineSuggestionsContext();
    registerTextChangeHandler();
  }

  if (snippetsEnabled) {
    await enableSnippetSuggestionsContext();

    if (isSnippetAutoTriggerEnabled()) {
      registerSnippetAutoTriggerHandler();
    }

    context.subscriptions.push(registerSnippetHandler());
  }

  context.subscriptions.push(
    registerAcceptHandler(),
    registerEscapeHandler(),
    registerNextHandler(),
    registerPrevHandler()
  );

  registerCursorChangeHandler();
}

function registerCursorChangeHandler() {
  window.onDidChangeTextEditorSelection((e: TextEditorSelectionChangeEvent) => {
    const inSnippetInsertion = isInSnippetInsertion();
    const showingDecoration = isShowingDecoration();
    const inTheMiddleOfConstructingSnippet =
      inSnippetInsertion && !showingDecoration;

    if (
      !inTheMiddleOfConstructingSnippet &&
      e.kind !== TextEditorSelectionChangeKind.Command
    ) {
      void clearInlineSuggestionsState();
    }
  });
}

function registerTextChangeHandler() {
  workspace.onDidChangeTextDocument(textListener);
}

function registerSnippetAutoTriggerHandler() {
  workspace.onDidChangeTextDocument(snippetAutoTriggerHandler);
}

function registerSnippetHandler(): Disposable {
  return commands.registerTextEditorCommand(
    `${SNIPPET_COMMAND}`,
    ({ document, selection }: TextEditor) =>
      void requestSnippet(document, selection.active)
  );
}

function registerPrevHandler(): Disposable {
  return commands.registerTextEditorCommand(
    `${PREV_INLINE_COMMAND}`,
    ({ document, selection }: TextEditor) => {
      const prevSuggestion = getPrevSuggestion();
      if (prevSuggestion) {
        void setInlineSuggestion(document, selection.active, prevSuggestion);
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
        void setInlineSuggestion(document, selection.active, nextSuggestion);
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

async function enableSnippetSuggestionsContext() {
  await commands.executeCommand(
    "setContext",
    "tabnine.snippet-suggestion:enabled",
    true
  );
}
