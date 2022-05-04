import {
  AutocompleteParams,
  AutocompleteResult,
  CompletionKind,
} from "./requests";

export default function postprocess(
  request: AutocompleteParams,
  result: AutocompleteResult,
  tabSize: number
): void {
  const tabsInSpaces = " ".repeat(tabSize);
  const resultsSubset = result.results.filter(
    (entry) => entry.completion_kind === CompletionKind.Snippet
  );
  if (resultsSubset.length === 0) return;

  resultsSubset.forEach((entry, index) => {
    resultsSubset[index].new_prefix = entry.new_prefix.replace(
      /\t/g,
      tabsInSpaces
    );
  });

  const requestIndentation = lastLineIndentation(request.before, tabsInSpaces);
  if (requestIndentation === undefined || requestIndentation === 0) {
    return;
  }

  const regex = constructRegex(requestIndentation);
  resultsSubset.forEach((entry, index) => {
    const trimmingIndex = calculateTrimmingIndex(regex, entry.new_prefix);
    if (trimmingIndex && trimmingIndex > 0) {
      resultsSubset[index].new_prefix = entry.new_prefix.slice(
        0,
        trimmingIndex
      );
    }
  });
}

/**
 * Finds the first match of the given `regex` in `value`, *after* the first newline appearance
 */
function calculateTrimmingIndex(
  regex: RegExp,
  value: string
): number | undefined {
  const indexOfFirstNewline = value.indexOf("\n");
  if (indexOfFirstNewline < 0) return undefined;

  const match = regex.exec(value.substring(indexOfFirstNewline + 1));
  return match ? match.index + indexOfFirstNewline : undefined;
}

/**
 * Constructs a regex which accepts a \n followed by at most `indentation - 1` spaces,
 * followed by any text or another \n.
 */
function constructRegex(indentation: number): RegExp {
  return RegExp(`^ {0,${indentation - 1}}(\\w|\n)+`, "m");
}

/**
 * Finds the amount of spaces or tabs in the last line of the given `value`,
 * returning `undefined` if `value` has no newlines, or the last line is not whitespaces only.
 */
function lastLineIndentation(
  value: string,
  tabsInSpaces: string
): number | undefined {
  const lastLineStartIndex = value.lastIndexOf("\n");
  if (lastLineStartIndex === -1) return undefined;

  const lastLine = value
    .substring(lastLineStartIndex + 1)
    .replace(/\t/g, tabsInSpaces);

  return lastLine.trim().length === 0 ? lastLine.length : undefined;
}
