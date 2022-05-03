import {
  AutocompleteParams,
  AutocompleteResult,
  CompletionKind,
} from "./requests";

export default function postprocess(
  request: AutocompleteParams,
  result: AutocompleteResult,
  tabSize: number
) {
  const resultsSubset = result.results.filter(
    (entry) => entry.completion_kind === CompletionKind.Snippet
  );
  if (resultsSubset.length === 0) return;

  resultsSubset.forEach((entry, index, array) => {
    array[index].new_prefix = entry.new_prefix.replace(
      /\t/g,
      " ".repeat(tabSize)
    );
  });

  const requestIndentation = lastLineIndentation(request.before, tabSize);
  if (requestIndentation === undefined || requestIndentation === 0) {
    return;
  }

  const regex = constructRegex(requestIndentation);
  resultsSubset.forEach((entry, index, array) => {
    const trimmingIndex = calculateTrimmingIndex(regex, entry.new_prefix);
    if (trimmingIndex && trimmingIndex > 0) {
      array[index].new_prefix = entry.new_prefix.slice(0, trimmingIndex);
    }
  });
}

function calculateTrimmingIndex(
  regex: RegExp,
  value: string
): number | undefined {
  const indexOfFirstNewline = value.indexOf("\n");
  if (indexOfFirstNewline < 0) return undefined;

  const match = regex.exec(value.substring(indexOfFirstNewline + 1));
  return match ? match.index + indexOfFirstNewline : undefined;
}

function constructRegex(indentation: number): RegExp {
  return RegExp(`^ {0,${indentation - 1}}(\\w|\n)+`, "m");
}

// function getTabSize(): number {
//   let tabSize = window.activeTextEditor?.options.tabSize;
//   if (typeof tabSize !== "number") {
//     return 4;
//   }
//   return tabSize;
// }

function lastLineIndentation(
  value: string,
  tabSize: number
): number | undefined {
  const lastLine = value
    .substring(value.lastIndexOf("\n") + 1)
    .replace(/\t/g, " ".repeat(tabSize));

  return lastLine.trim().length === 0 ? lastLine.length : undefined;
}
