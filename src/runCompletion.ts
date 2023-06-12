import { CancellationToken, Position, Range, TextDocument } from "vscode";
import {
  autocomplete,
  AutocompleteParams,
  AutocompleteResult,
} from "./binary/requests/requests";
import getTabSize from "./binary/requests/tabSize";
import { Capability, isCapabilityEnabled } from "./capabilities/capabilities";
import {
  CHAR_LIMIT,
  INLINE_REQUEST_TIMEOUT,
  MAX_NUM_RESULTS,
} from "./globals/consts";
import languages from "./globals/languages";
import { getSDKPath } from "./languages";

export default async function runCompletion({
  document,
  position,
  timeout = undefined,
  currentSuggestionText = "",
  retry,
}: {
  document: TextDocument;
  position: Position;
  timeout?: number | undefined;
  currentSuggestionText?: string;
  retry?: {
    cancellationToken?: CancellationToken;
    interval?: number;
    timeout?: number;
  };
}): Promise<AutocompleteResult | null | undefined> {
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  const afterEnd = document.positionAt(afterEndOffset);
  const requestData = {
    filename: getFileNameWithExtension(document),
    before:
      document.getText(new Range(beforeStart, position)) +
      currentSuggestionText,
    after: document.getText(new Range(position, afterEnd)),
    region_includes_beginning: beforeStartOffset === 0,
    region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
    max_num_results: getMaxResults(),
    offset,
    line: position.line,
    character: position.character,
    indentation_size: getTabSize(),
    sdk_path: getSDKPath(document.languageId),
  };

  const isEmptyLine = document.lineAt(position.line).text.trim().length === 0;

  const result = await autocomplete(
    requestData,
    isEmptyLine ? INLINE_REQUEST_TIMEOUT : timeout
  );

  if (result?.results.length || !retry?.cancellationToken) {
    return result;
  }

  return handleRetries(requestData, retry);
}

function handleRetries(
  requestData: AutocompleteParams,
  {
    cancellationToken,
    interval = 200,
    timeout = 1000,
  }: {
    cancellationToken?: CancellationToken;
    interval?: number;
    timeout?: number;
  }
): Promise<AutocompleteResult | null | undefined> | null | undefined {
  if (cancellationToken?.isCancellationRequested) {
    return null;
  }
  return new Promise((resolve, reject) => {
    let timeoutId: NodeJS.Timeout | undefined;
    let lastResult: AutocompleteResult | undefined;
    const intervalId = setInterval(() => {
      void autocomplete({ ...requestData, cached_only: true })
        .then((result) => {
          if (result?.results.length) {
            clearInterval(intervalId);
            clearTimeout(timeoutId as NodeJS.Timeout);
            lastResult = result;
            resolve(result);
          }
        })
        .catch((error) => {
          clearInterval(intervalId);
          clearTimeout(timeoutId as NodeJS.Timeout);
          reject(error);
        });
    }, interval);

    timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      resolve(lastResult);
    }, timeout);

    cancellationToken?.onCancellationRequested(() => {
      clearInterval(intervalId);
      clearTimeout(timeoutId as NodeJS.Timeout);
      resolve(null);
    });
  });
}

function getMaxResults(): number {
  if (isCapabilityEnabled(Capability.SUGGESTIONS_SINGLE)) {
    return 1;
  }

  if (isCapabilityEnabled(Capability.SUGGESTIONS_TWO)) {
    return 2;
  }

  return MAX_NUM_RESULTS;
}

type KnownLanguageType = keyof typeof languages;

export function getLanguageFileExtension(
  languageId: string
): string | undefined {
  return languages[languageId as KnownLanguageType];
}

function getFileNameWithExtension(document: TextDocument): string {
  const { languageId, fileName } = document;
  if (!document.isUntitled) {
    return fileName;
  }
  const extension = getLanguageFileExtension(languageId);
  if (extension) {
    return fileName.concat(extension);
  }
  return fileName;
}
