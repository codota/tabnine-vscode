import { Completion } from "./Completion";

export type AcceptAssistantSelection = {
  currentSuggestion: Completion;
  allSuggestions: Completion[];
  reference: string;
  threshold: string;
};
