import * as vscode from "vscode";
import {
  autocomplete,
  AutocompleteResult,
  MarkdownStringSpec,
  ResultEntry,
} from "./binary/requests/requests";
import { Capability, isCapabilityEnabled } from "./capabilities";
import {
  ATTRIBUTION_BRAND,
  BRAND_NAME,
  CHAR_LIMIT,
  DEFAULT_DETAIL,
  LIMITATION_SYMBOL,
  MAX_NUM_RESULTS,
} from "./globals/consts";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";
import { COMPLETION_IMPORTS } from "./selectionHandler";
import { setCompletionStatus } from "./statusBar/statusBar";

const INCOMPLETE = true;

export default async function provideCompletionItems(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<vscode.CompletionList> {
  return new vscode.CompletionList(
    await completionsListFor(document, position),
    INCOMPLETE
  );
}

async function completionsListFor(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<vscode.CompletionItem[]> {
  try {
    if (!completionIsAllowed(document, position)) {
      return [];
    }

    const offset = document.offsetAt(position);
    const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
    const afterEndOffset = offset + CHAR_LIMIT;
    const beforeStart = document.positionAt(beforeStartOffset);
    const afterEnd = document.positionAt(afterEndOffset);
    const response: AutocompleteResult | null | undefined = await autocomplete({
      filename: document.fileName,
      before: document.getText(new vscode.Range(beforeStart, position)),
      after: document.getText(new vscode.Range(position, afterEnd)),
      region_includes_beginning: beforeStartOffset === 0,
      region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
      max_num_results: getMaxResults(),
    });

    setCompletionStatus(response?.is_locked);

    if (!response || response?.results.length === 0) {
      return [];
    }

    const limit =
      showFew(response, document, position) || response.is_locked
        ? 1
        : response.results.length;

    return response.results.slice(0, limit).map((entry, index) =>
      makeCompletionItem({
        document,
        index,
        position,
        detailMessage: extractDetailMessage(response),
        oldPrefix: response?.old_prefix,
        entry,
        results: response?.results,
        limited: response?.is_locked,
      })
    );
  } catch (e) {
    console.error(`Error setting up request: ${e}`);

    return [];
  }
}

function extractDetailMessage(response: AutocompleteResult) {
  return (response.user_message || []).join("\n") || DEFAULT_DETAIL;
}

function makeCompletionItem(args: {
  document: vscode.TextDocument;
  index: number;
  position: vscode.Position;
  detailMessage: string;
  oldPrefix: string;
  entry: ResultEntry;
  results: ResultEntry[];
  limited: boolean;
}): vscode.CompletionItem {
  const item = new vscode.CompletionItem(
    ATTRIBUTION_BRAND + args.entry.new_prefix
  );
  if (args.limited) {
    item.detail = `${LIMITATION_SYMBOL} ${BRAND_NAME}`;
  } else {
    item.detail = BRAND_NAME;
  }

  item.sortText = String.fromCharCode(0) + String.fromCharCode(args.index);
  item.insertText = new vscode.SnippetString(
    escapeTabStopSign(args.entry.new_prefix)
  );
  item.insertText = new vscode.SnippetString(
    escapeTabStopSign(args.entry.new_prefix)
  );
  item.filterText = args.entry.new_prefix;
  item.preselect = args.index === 0;
  item.kind = args.entry.kind;
  item.range = new vscode.Range(
    args.position.translate(0, -args.oldPrefix.length),
    args.position.translate(0, args.entry.old_suffix.length)
  );

  if (tabnineExtensionProperties.isTabNineAutoImportEnabled) {
    item.command = {
      arguments: [
        {
          currentCompletion: args.entry.new_prefix,
          completions: args.results,
          position: args.position,
          limited: args.limited,
        },
      ],
      command: COMPLETION_IMPORTS,
      title: "accept completion",
    };
  }

  if (args.entry.new_suffix) {
    item.insertText
      .appendTabstop(0)
      .appendText(escapeTabStopSign(args.entry.new_suffix));
  }

  if (args.entry.documentation) {
    item.documentation = formatDocumentation(args.entry.documentation);
  }

  return item;
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

function formatDocumentation(
  documentation: string | MarkdownStringSpec
): string | vscode.MarkdownString {
  if (isMarkdownStringSpec(documentation)) {
    if (documentation.kind === "markdown") {
      return new vscode.MarkdownString(documentation.value);
    }
    return documentation.value;
  }
  return documentation;
}

function escapeTabStopSign(value: string) {
  return value.replace(new RegExp("\\$", "g"), "\\$");
}

function isMarkdownStringSpec(
  x: string | MarkdownStringSpec
): x is MarkdownStringSpec {
  return !(typeof x === "string");
}

function completionIsAllowed(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const configuration = vscode.workspace.getConfiguration();
  let disableLineRegex = configuration.get<string[]>(
    "tabnine.disable_line_regex"
  );
  if (disableLineRegex === undefined) {
    disableLineRegex = [];
  }
  const line = document.getText(
    new vscode.Range(
      position.with({ character: 0 }),
      position.with({ character: 500 })
    )
  );
  if (disableLineRegex.some((r) => new RegExp(r).test(line))) {
    return false;
  }

  let disableFileRegex = configuration.get<string[]>(
    "tabnine.disable_file_regex"
  );

  if (disableFileRegex === undefined) {
    disableFileRegex = [];
  }

  if (disableFileRegex.some((r) => new RegExp(r).test(document.fileName))) {
    return false;
  }

  return true;
}

function showFew(
  response: AutocompleteResult,
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  if (response.results.some((entry) => entry.kind || entry.documentation)) {
    return false;
  }

  const leftPoint = position.translate(0, -response.old_prefix.length);
  const tail = document.getText(
    new vscode.Range(document.lineAt(leftPoint).range.start, leftPoint)
  );

  return tail.endsWith(".") || tail.endsWith("::");
}
