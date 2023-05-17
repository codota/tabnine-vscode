import { Disposable, languages } from "vscode";
import { initTracker } from "./documentChangesTracker";
import { initTabOverride } from "../lookAheadSuggestion";

// eslint-disable-next-line import/prefer-default-export
export async function registerInlineProvider(): Promise<Disposable> {
  const provideInlineCompletionItems = (
    await import("../provideInlineCompletionItems")
  ).default;
  const inlineCompletionsProvider = {
    provideInlineCompletionItems,
  };
  return Disposable.from(
    languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      inlineCompletionsProvider
    ),
    initTracker(),
    await initTabOverride()
  );
}
