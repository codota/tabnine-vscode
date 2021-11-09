import { Completion } from "./Completion";

export type IgnoreAssistantSelection = {
  allSuggestions: Completion[];
  reference: string;
  threshold: string;
  responseId: string;
};
