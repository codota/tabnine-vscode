import { languages, Disposable, ExtensionContext } from "vscode";
import getSuggestionMode, {
  SuggestionsMode,
} from "./capabilities/getSuggestionMode";
import {
  Capability,
  isCapabilityEnabled,
  onDidRefreshCapabilities,
} from "./capabilities/capabilities";

import provideCompletionItems from "./provideCompletionItems";
import { COMPLETION_TRIGGERS } from "./globals/consts";
import {
  isInlineSuggestionProposedApiSupported,
  isInlineSuggestionReleasedApiSupported,
} from "./globals/versions";
import enableProposed from "./globals/proposedAPI";
import { registerInlineProvider } from "./inlineSuggestions/registerInlineProvider";
import { completionsState } from "./state/completionsState";

let subscriptions: Disposable[] = [];

export default async function installAutocomplete(
  context: ExtensionContext
): Promise<void> {
  context.subscriptions.push({
    dispose: () => uninstallAutocomplete(),
  });

  let installOptions = InstallOptions.get();

  await reinstallAutocomplete(installOptions);

  context.subscriptions.push(
    onDidRefreshCapabilities(() => {
      const newInstallOptions = InstallOptions.get();

      if (!newInstallOptions.equals(installOptions)) {
        void reinstallAutocomplete(newInstallOptions);
        installOptions = newInstallOptions;
      }
    })
  );

  completionsState.on("changed", (enabled) => {
    if (enabled) {
      void reinstallAutocomplete(InstallOptions.get());
    } else {
      uninstallAutocomplete();
    }
  });
}

async function reinstallAutocomplete({
  inlineEnabled,
  snippetsEnabled,
  autocompleteEnabled,
}: InstallOptions) {
  uninstallAutocomplete();

  if (!completionsState.value) {
    return;
  }

  if (
    (inlineEnabled || snippetsEnabled) &&
    (isInlineSuggestionReleasedApiSupported() || (await isDefaultAPIEnabled()))
  ) {
    subscriptions.push(await registerInlineProvider());
  }

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

  public static get() {
    return new InstallOptions(
      isInlineEnabled(),
      isSnippetSuggestionsEnabled(),
      isAutoCompleteEnabled()
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
async function isDefaultAPIEnabled(): Promise<boolean> {
  return (
    (isCapabilityEnabled(Capability.SNIPPET_SUGGESTIONS_CONFIGURABLE) ||
      isCapabilityEnabled(Capability.VSCODE_INLINE_V2)) &&
    isInlineSuggestionProposedApiSupported() &&
    (await enableProposed())
  );
}
