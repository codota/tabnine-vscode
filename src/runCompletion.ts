import {
  CancellationToken,
  Position,
  Range,
  TextDocument,
  window,
  Uri,
} from "vscode";
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

function calculateContextForJupyterNotebook(
  notebookEditor: window.NotebookEditor,
  documentUri: Uri
): { before: string; after: string } {
  const cells = notebookEditor.notebook.getCells();

  const index = cells.findIndex(
    (cell) => cell.document.uri.toString() === documentUri.toString()
  );
  const before = cells
    .slice(0, index)
    .map((cell) => cell.document.getText())
    .join("\n");
  const after = cells
    .slice(index + 1)
    .map((cell) => cell.document.getText())
    .join("\n");
  return {
    before: before + "\n",
    after: "\n" + after,
  };
}

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

  const notebookEditor = window.activeNotebookEditor;

  const { before, after } = notebookEditor
    ? calculateContextForJupyterNotebook(notebookEditor, document.uri)
    : { before: "", after: "" };

  const requestData = {
    filename: getFileNameWithExtension(document),
    before:
      before +
      document.getText(new Range(beforeStart, position)) +
      currentSuggestionText,
    after: document.getText(new Range(position, afterEnd)) + after,
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
