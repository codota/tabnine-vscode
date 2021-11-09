import { Range } from "./Range";
import { Completion } from "./Completion";

export interface AssistantDiagnostic {
  range: Range;
  completionList: Completion[];
  reference: string;
  currentLine: number;
  references: Range[]; // refrences in the given visibleRange
  responseId: string;
}
