import { AssistantDiagnostic } from "../AssistantDiagnostic";
import CancellationToken from "../CancellationToken";
import getMode from "../getMode";
import { Range } from "../Range";
import { request } from "./request";

export default function getAssistantDiagnostics(
  code: string,
  fileName: string,
  visibleRange: Range,
  threshold: string,
  editDistance: number,
  apiKey: string,
  cancellationToken: CancellationToken
): Promise<AssistantDiagnostic[] | undefined> {
  const body = {
    method: "get_assistant_diagnostics",
    params: {
      code,
      fileName,
      visibleRange,
      mode: getMode(),
      threshold,
      editDistance,
      apiKey,
    },
  };
  return request(body, cancellationToken);
}
