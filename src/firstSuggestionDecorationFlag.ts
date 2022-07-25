import { ExtensionContext } from "./preRelease/types";

const FIRST_SUGGESTION_DECORATION_SHOWN =
  "already-displayed-first-suggestion-hint";

export async function setFirstSuggestionFlag(
  context: ExtensionContext | null
): Promise<void> {
  if (!context) {
    return;
  }
  await context.globalState.update(FIRST_SUGGESTION_DECORATION_SHOWN, true);
}

export function firstSuggestionDecorationAlreadyDisplayed(
  context: ExtensionContext
): boolean {
  return context.globalState.get<boolean>(
    FIRST_SUGGESTION_DECORATION_SHOWN,
    false
  );
}
