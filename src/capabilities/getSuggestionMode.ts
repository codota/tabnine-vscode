import { Capability, isCapabilityEnabled } from "./capabilities";

export enum SuggestionsMode {
  INLINE,
  AUTOCOMPLETE,
}

export default function getSuggestionMode(): SuggestionsMode {
  if (isCapabilityEnabled(Capability.INLINE_SUGGESTIONS)) {
    return SuggestionsMode.INLINE;
  }
  return SuggestionsMode.AUTOCOMPLETE;
}
