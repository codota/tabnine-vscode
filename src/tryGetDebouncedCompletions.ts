import * as vscode from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import getInlineCompletionItems from "./getInlineCompletionItems";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { sleep, timed } from "./utils/utils";

export default async function tryGetDebouncedCompletions(
  document: vscode.TextDocument,
  position: vscode.Position,
  token: vscode.CancellationToken
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  const { time, value: current } = await timed(() =>
    getInlineCompletionItems(document, position)
  );

  const debounceTime = calculateDebounceValue(time);

  if (debounceTime > 0) {
    await debounceOrCancelOnRequest(token, debounceTime);

    if (token.isCancellationRequested) {
      return undefined;
    }

    // re fetch the most updated suggestions
    return await getInlineCompletionItems(document, position);
  }
  return current;
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

function calculateDebounceValue(time: number) {
  const debounceMilliseconds = getDebounceValue();
  const debounceTime = Math.max(debounceMilliseconds - time, 0);
  return debounceTime;
}

function getDebounceValue(): number {
  const debounceMilliseconds = vscode.workspace
    .getConfiguration()
    .get<number>("tabnine.debounceMilliseconds");
  const isAlphaCapabilityEnabled = isCapabilityEnabled(
    Capability.ALPHA_CAPABILITY
  );
  const ALPHA_ONE_SECOND_DEBOUNCE = 1000;
  return (
    debounceMilliseconds ||
    (isAlphaCapabilityEnabled ? ALPHA_ONE_SECOND_DEBOUNCE : 0)
  );
}
