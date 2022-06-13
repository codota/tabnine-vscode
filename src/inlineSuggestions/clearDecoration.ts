import { clearState } from "./inlineSuggestionState";
import { clearInlineDecoration } from "./setInlineSuggestion";

export default async function clearInlineSuggestionsState(): Promise<void> {
  clearInlineDecoration();
  await clearState();
}
