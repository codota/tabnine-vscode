import { Disposable, languages } from "vscode";
import { Capability, isCapabilityEnabled } from "../capabilities/capabilities";

import enableProposed from "../globals/proposedAPI";
import { initTracker } from "./documentChangesTracker";

import {
  isInlineSuggestionProposedApiSupported,
  isInlineSuggestionReleasedApiSupported,
} from "../globals/versions";
import { initTabOverride } from "../lookAheadSuggestion";

async function isDefaultAPIEnabled(): Promise<boolean> {
  return (
    (isCapabilityEnabled(Capability.SNIPPET_SUGGESTIONS_CONFIGURABLE) ||
      isCapabilityEnabled(Capability.VSCODE_INLINE_V2)) &&
    isInlineSuggestionProposedApiSupported() &&
    (await enableProposed())
  );
}

export default async function registerInlineHandlers(
  inlineEnabled: boolean,
  snippetsEnabled: boolean
): Promise<Disposable[]> {
  const subscriptions: Disposable[] = [];

  if (!inlineEnabled && !snippetsEnabled) return subscriptions;

  if (
    isInlineSuggestionReleasedApiSupported() ||
    (await isDefaultAPIEnabled())
  ) {
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
    await initTabOverride(subscriptions);
    return subscriptions;
  }
  return subscriptions;
}
