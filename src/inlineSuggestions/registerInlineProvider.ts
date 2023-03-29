import { Disposable, languages } from "vscode";
import { initTracker } from "./documentChangesTracker";
import { initTabOverride } from "../lookAheadSuggestion";

// eslint-disable-next-line import/prefer-default-export
export async function registerInlineProvider(subscriptions: Disposable[]) {
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
    initTracker(),
    await initTabOverride()
  );
}
