import * as vscode from "vscode";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import getInlineCompletionItems from "./getInlineCompletionItems";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { sleep, timed } from "./utils/utils";

const ALPHA_ONE_SECOND_DEBOUNCE = 1000;
const DEBOUNCE_DELAY = 300;

export function debounce<T extends unknown[], R>(
  callback: (...rest: T) => R,
  limit: number
): (...rest: T) => Promise<R | undefined> {
  let timer: ReturnType<typeof setTimeout>;

  return function (...rest): Promise<R | undefined> {
    return new Promise((resolve) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        resolve(callback(...rest));
      }, limit);
    });
  };
}

async function debounceCompletionsHelper(
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

const debounceCompletions = debounce(debounceCompletionsHelper, DEBOUNCE_DELAY);

export default debounceCompletions;

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
  const experimentDebounceMs = getDebounceMsByExperiment();
  return debounceMilliseconds || experimentDebounceMs;
}

function getDebounceMsByExperiment(): number {
  if (isCapabilityEnabled(Capability.ALPHA_CAPABILITY))
    return ALPHA_ONE_SECOND_DEBOUNCE;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_300)) return 300;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_600)) return 600;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_900)) return 900;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_1200)) return 1200;
  if (isCapabilityEnabled(Capability.DEBOUNCE_VALUE_1500)) return 1500;
  return 0;
}
