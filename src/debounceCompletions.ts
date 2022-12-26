import * as vscode from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import getInlineCompletionItems from "./getInlineCompletionItems";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { sleep, timed } from "./utils/utils";

const ALPHA_ONE_SECOND_DEBOUNCE = 1000;

export default async function debounceCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  const { time, value: current } = await timed(() =>
    getInlineCompletionItems(document, position)
  );

  const debounceTime = calculateDebounceMs(time);

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

function calculateDebounceMs(time: number): number {
  const debounceMilliseconds = getDebounceMs();
  const debounceTime = Math.max(debounceMilliseconds - time, 0);
  return debounceTime;
}

function getDebounceMs(): number {
  const debounceMilliseconds = vscode.workspace
    .getConfiguration()
    .get<number>("tabnine.debounceMilliseconds");
  const isAlphaCapabilityEnabled = isCapabilityEnabled(
    Capability.ALPHA_CAPABILITY
  );
  const experimentDebounceMs = getDebounceMsByExperiment();
  return (
    debounceMilliseconds ||
    (isAlphaCapabilityEnabled
      ? ALPHA_ONE_SECOND_DEBOUNCE
      : experimentDebounceMs)
  );
}
function getDebounceMsByExperiment(): number {
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_300)) return 300;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_600)) return 600;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_900)) return 900;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_1200)) return 1200;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_1500)) return 1500;
  return 0;
}
