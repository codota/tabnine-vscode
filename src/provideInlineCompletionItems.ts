import * as vscode from "vscode";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import TabnineInlineCompletionItem from "./inlineSuggestions/tabnineInlineCompletionItem";
import { completionIsAllowed } from "./provideCompletionItems";
import runCompletion from "./runCompletion";
import { getShouldComplete } from "./inlineSuggestions/documentChangesTracker";
import getAutoImportCommand from "./getAutoImportCommand";
import {
  clearCurrentLookAheadSuggestion,
  getLookAheadSuggestion,
} from "./lookAheadSuggestion";
import { handleFirstSuggestionDecoration } from "./firstSuggestionDecoration";
import { SuggestionTrigger } from "./globals/consts";
import { isMultiline, sleep } from "./utils/utils";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";

const INLINE_REQUEST_TIMEOUT = 3000;
const END_OF_LINE_VALID_REGEX = new RegExp("^\\s*[)}\\]\"'`]*\\s*[:{;,]?\\s*$");

export default async function provideInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position,
  context: vscode.InlineCompletionContext,
  token: vscode.CancellationToken
): Promise<
  vscode.InlineCompletionList<TabnineInlineCompletionItem> | undefined
> {
  try {
    clearCurrentLookAheadSuggestion();
    if (
      !completionIsAllowed(document, position) ||
      !isValidMidlinePosition(document, position) ||
      !getShouldComplete()
    ) {
      return undefined;
    }

    const completionInfo = context.selectedCompletionInfo;
    if (completionInfo) {
      return await getLookAheadSuggestion(document, completionInfo, position);
    }

    const { time, value } = await timed(() =>
      getInlineCompletionItems(document, position)
    );
    let completions = value;

    const debounceTime = calculateDebounceValue(time);

    if (debounceTime > 0) {
      await debounceOrCancelOnRequest(token, debounceTime);

      if (token.isCancellationRequested) {
        return undefined;
      }

      // re fetch the most updated suggestions
      completions = await getInlineCompletionItems(document, position);
    }

    await handleFirstSuggestionDecoration(position, completions);
    return completions;
  } catch (e) {
    console.error(`Error setting up request: ${e}`);

    return undefined;
  }
}
async function debounceOrCancelOnRequest(
  token: vscode.CancellationToken,
  debounceTime: number
) {
  const canceledPromise = new Promise<void>((resolve) =>
    token.onCancellationRequested((arg) => {
      console.log("arg: ", arg);
      resolve();
    })
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

async function timed<T>(
  fn: () => Promise<T>
): Promise<{ time: number; value: T }> {
  const time = process.hrtime();
  const value = await fn();
  const after = hrtimeToMs(process.hrtime(time));
  return { time: after, value };
}

function hrtimeToMs(hrtime: [number, number]): number {
  const seconds = hrtime[0];
  const nanoseconds = hrtime[1];
  return seconds * 1000 + nanoseconds / 1000000;
}

async function getInlineCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const isEmptyLine = document.lineAt(position.line).text.trim().length === 0;

  const response = await runCompletion(
    document,
    position,
    isEmptyLine ? INLINE_REQUEST_TIMEOUT : undefined
  );

  const completions = response?.results.map(
    (result) =>
      new TabnineInlineCompletionItem(
        result.new_prefix,
        calculateRange(position, response, result),
        getAutoImportCommand(
          result,
          response,
          position,
          SuggestionTrigger.DocumentChanged
        ),
        result.completion_kind,
        result.is_cached,
        response.snippet_context
      )
  );

  return new vscode.InlineCompletionList(completions || []);
}

function calculateRange(
  position: vscode.Position,
  response: AutocompleteResult,
  result: ResultEntry
): vscode.Range {
  return new vscode.Range(
    position.translate(0, -response.old_prefix.length),
    isMultiline(result.old_suffix)
      ? position
      : position.translate(0, result.old_suffix.length)
  );
}

function isValidMidlinePosition(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const lineSuffix = document.getText(
    new vscode.Range(position, document.lineAt(position.line).range.end)
  );
  return END_OF_LINE_VALID_REGEX.test(lineSuffix);
}
