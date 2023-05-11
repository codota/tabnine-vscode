import { Disposable, languages } from "vscode";
import { initTracker } from "./documentChangesTracker";
import { initTabOverride } from "../lookAheadSuggestion";
import { registerSelectionHandling } from "../afterSelection/selectionHandler";

// eslint-disable-next-line import/prefer-default-export
export async function registerInlineProvider(): Promise<Disposable> {
  const inlineCompletionsProvider = await import(
    "../provideInlineCompletionItems"
  );
  return Disposable.from(
    languages.registerInlineCompletionItemProvider(
      { pattern: "**" },
      inlineCompletionsProvider
    ),
    initTracker(),
    await initTabOverride(),
    registerSelectionHandling()
  );
}
