import { languages, Disposable, ExtensionContext, ExtensionMode } from "vscode";
import getSuggestionMode, {
  SuggestionsMode,
} from "./capabilities/getSuggestionMode";
import {
  Capability,
  isCapabilityEnabled,
  onDidRefreshCapabilities,
} from "./capabilities/capabilities";
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

  const testMode = context.extensionMode === ExtensionMode.Test;
  let installOptions = InstallOptions.get(testMode);

  await reinstallAutocomplete(installOptions);

  context.subscriptions.push(
    onDidRefreshCapabilities(() => {
      const newInstallOptions = InstallOptions.get(testMode);

      if (!newInstallOptions.equals(installOptions)) {
        void reinstallAutocomplete(newInstallOptions);
        installOptions = newInstallOptions;
      }
    })
  );
}

async function reinstallAutocomplete({
  inlineEnabled,
  snippetsEnabled,
  autocompleteEnabled,
}: InstallOptions) {
  uninstallAutocomplete();

  subscriptions.push(
    ...(await registerInlineHandlers(inlineEnabled, snippetsEnabled))
  );

  if (autocompleteEnabled) {
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
}

class InstallOptions {
  inlineEnabled: boolean;

  snippetsEnabled: boolean;

  autocompleteEnabled: boolean;

  constructor(
    inlineEnabled: boolean,
    snippetsEnabled: boolean,
    autocompleteEnabled: boolean
  ) {
    this.inlineEnabled = inlineEnabled;
    this.snippetsEnabled = snippetsEnabled;
    this.autocompleteEnabled = autocompleteEnabled;
  }

  public equals(other: InstallOptions): boolean {
    return (
      this.autocompleteEnabled === other.autocompleteEnabled &&
      this.inlineEnabled === other.inlineEnabled &&
      this.snippetsEnabled === other.snippetsEnabled
    );
  }

  public static get(testMode: boolean) {
    return new InstallOptions(
      isInlineEnabled() || testMode,
      isSnippetSuggestionsEnabled() || testMode,
      isAutoCompleteEnabled() || testMode
    );
  }
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
