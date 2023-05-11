import * as vscode from "vscode";
import getInlineCompletionItems from "./getInlineCompletionItems";
import { TabnineInlineCompletionItem } from "./inlineSuggestions/tabnineInlineCompletionItem";
import { sleep, timed } from "../utils/utils";

export default async function debounceCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken,
  debounceMsByExperiment = 0
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  const { time, value: current } = await timed(() =>
    getInlineCompletionItems(document, position)
  );

  const debounceTime = calculateDebounceMs(time, debounceMsByExperiment);

  if (debounceTime === 0) {
    return current;
  }

  await debounceOrCancelOnRequest(token, debounceTime);

  if (token.isCancellationRequested) {
    return undefined;
  }

  // re fetch the most updated suggestions
  return getInlineCompletionItems(document, position);
}

async function debounceOrCancelOnRequest(
  token: vscode.CancellationToken,
  debounceTime: number
) {
  const canceledPromise = new Promise<void>((resolve) =>
    token.onCancellationRequested(resolve)
  );

  await Promise.race([canceledPromise, sleep(debounceTime)]);
}

function calculateDebounceMs(
  time: number,
  debounceMsByExperiment: number
): number {
  const debounceMilliseconds = getDebounceMs() || debounceMsByExperiment;
  const debounceTime = Math.max(debounceMilliseconds - time, 0);
  return debounceTime;
}

function getDebounceMs(): number | undefined {
  const debounceMilliseconds = vscode.workspace
    .getConfiguration()
    .get<number>("tabnine.debounceMilliseconds");
  return debounceMilliseconds;
}
