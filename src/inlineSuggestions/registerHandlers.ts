import {
  commands,
  Disposable,
  languages,
  TextEditor,
  TextEditorSelectionChangeEvent,
  TextEditorSelectionChangeKind,
  window,
  workspace,
} from "vscode";
import { CompletionKind } from "../binary/requests/requests";
import setState from "../binary/requests/setState";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";
import {
  ACCEPT_INLINE_COMMAND,
  ESCAPE_INLINE_COMMAND,
  NEXT_INLINE_COMMAND,
  PREV_INLINE_COMMAND,
  SNIPPET_COMMAND,
  StatePayload,
} from "../globals/consts";
import enableProposed from "../globals/proposedAPI";
import { initTracker } from "./stateTracker";
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
import { isInlineSuggestionApiSupported } from "../globals/versions";

export const decorationType = window.createTextEditorDecorationType({});

function isSnippetAutoTriggerEnabled() {
  return isCapabilityEnabled(Capability.SNIPPET_AUTO_TRIGGER);
}

async function isDefaultAPIEnabled(): Promise<boolean> {
  return (
    isCapabilityEnabled(Capability.SNIPPET_SUGGESTIONS_CONFIGURABLE) &&
    isInlineSuggestionApiSupported() &&
    (await enableProposed())
  );
}
export default async function registerInlineHandlers(
  inlineEnabled: boolean,
  snippetsEnabled: boolean
): Promise<Disposable[]> {
  const subscriptions: Disposable[] = [];

  if (!inlineEnabled && !snippetsEnabled) return subscriptions;

  if (await isDefaultAPIEnabled()) {
    const provideInlineCompletionItems = (
      await import("../provideInlineCompletionItems")
    ).default;
    const inlineCompletionsProvider = {
      provideInlineCompletionItems,
    };
    subscriptions.push(
      languages.registerInlineCompletionItemProvider(
        { pattern: "**" },
        inlineCompletionsProvider
      ),
      ...initTracker()
    );
    subscriptions.push(
      window
        .getInlineCompletionItemController(inlineCompletionsProvider)
        .onDidShowCompletionItem((e) => {
          // binary is not supporting api version ^4.0.57
          if (e.completionItem.isCached === undefined) return;

          const shouldSendSnippetShown =
            e.completionItem.completionKind === CompletionKind.Snippet &&
            !e.completionItem.isCached;

          if (shouldSendSnippetShown) {
            const filename = window.activeTextEditor?.document.fileName;
            const intent = e.completionItem.snippetIntent;

            if (!intent || !filename) {
              console.warn(
                `Could not send SnippetShown request. intent is null: ${!intent}, filename is null: ${!filename}`
              );
              return;
            }

            void setState({
              [StatePayload.SNIPPET_SHOWN]: { filename, intent },
            });
          }
        })
    );
    return subscriptions;
  }

  if (inlineEnabled) {
    subscriptions.push(await enableInlineSuggestionsContext());
    subscriptions.push(registerTextChangeHandler());
  }

  if (snippetsEnabled) {
    subscriptions.push(await enableSnippetSuggestionsContext());

    if (isSnippetAutoTriggerEnabled()) {
      subscriptions.push(registerSnippetAutoTriggerHandler());
    }

    subscriptions.push(registerSnippetHandler());
  }

  subscriptions.push(
    registerAcceptHandler(),
    registerEscapeHandler(),
    registerNextHandler(),
    registerPrevHandler()
  );

  subscriptions.push(registerCursorChangeHandler());

  return subscriptions;
}

function registerCursorChangeHandler(): Disposable {
  return window.onDidChangeTextEditorSelection(
    (e: TextEditorSelectionChangeEvent) => {
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
    }
  );
}

function registerTextChangeHandler(): Disposable {
  return workspace.onDidChangeTextDocument(textListener);
}

function registerSnippetAutoTriggerHandler(): Disposable {
  return workspace.onDidChangeTextDocument(snippetAutoTriggerHandler);
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

async function enableInlineSuggestionsContext(): Promise<Disposable> {
  await commands.executeCommand(
    "setContext",
    "tabnine.inline-suggestion:enabled",
    true
  );

  return {
    dispose() {
      void commands.executeCommand(
        "setContext",
        "tabnine.inline-suggestion:enabled",
        undefined
      );
    },
  };
}

async function enableSnippetSuggestionsContext(): Promise<Disposable> {
  await commands.executeCommand(
    "setContext",
    "tabnine.snippet-suggestion:enabled",
    true
  );

  return {
    dispose() {
      void commands.executeCommand(
        "setContext",
        "tabnine.snippet-suggestion:enabled",
        undefined
      );
    },
  };
}
