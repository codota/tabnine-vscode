import { languages, Disposable, ExtensionContext, ExtensionMode } from "vscode";
import getSuggestionMode, {
  SuggestionsMode,
} from "./capabilities/getSuggestionMode";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import registerInlineHandlers from "./inlineSuggestions/registerHandlers";

import provideCompletionItems from "./provideCompletionItems";
import { COMPLETION_TRIGGERS } from "./globals/consts";

let subscriptions: Disposable[] = [];

export default async function installAutocomplete(
  context: ExtensionContext
): Promise<void> {
  context.subscriptions.push({
    dispose: () => uninstallAutocomplete(),
  });

  const reinstallAutocomplete = async () => {
    uninstallAutocomplete();

    const testMode = context.extensionMode === ExtensionMode.Test;
    const inlineEnabled = isInlineEnabled() || testMode;
    const snippetsEnabled = isSnippetSuggestionsEnabled() || testMode;

    subscriptions.push(
      ...(await registerInlineHandlers(inlineEnabled, snippetsEnabled))
    );

    if (isAutoCompleteEnabled() || testMode) {
      subscriptions.push(
        languages.registerCompletionItemProvider(
          { pattern: "**" },
          {
            provideCompletionItems,
          },
          ...COMPLETION_TRIGGERS
        )
      );
    }
  };

  await reinstallAutocomplete();
}

function uninstallAutocomplete() {
  subscriptions.forEach((s) => {
    s.dispose();
  });
  subscriptions = [];
}

function isInlineEnabled() {
  return getSuggestionMode() === SuggestionsMode.INLINE;
}

function isSnippetSuggestionsEnabled() {
  return isCapabilityEnabled(Capability.SNIPPET_SUGGESTIONS);
}

function isAutoCompleteEnabled() {
  return getSuggestionMode() === SuggestionsMode.AUTOCOMPLETE;
}
