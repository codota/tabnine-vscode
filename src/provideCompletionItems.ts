import * as vscode from "vscode";
import {
  AutocompleteResult,
  MarkdownStringSpec,
  ResultEntry,
} from "./binary/requests/requests";
import {
  ATTRIBUTION_BRAND,
  BRAND_NAME,
  DEFAULT_DETAIL,
  LIMITATION_SYMBOL,
} from "./globals/consts";
import tabnineExtensionProperties from "./globals/tabnineExtensionProperties";
import runCompletion from "./runCompletion";
import { COMPLETION_IMPORTS } from "./selectionHandler";
import { setCompletionStatus } from "./statusBar/statusBar";
import { escapeTabStopSign } from "./utils/utils";

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

    const response = await runCompletion({ document, position });

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

  item.filterText = args.entry.new_prefix;
  item.preselect = args.index === 0;
  item.kind = args.entry.completion_metadata?.kind;
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
          oldPrefix: args.oldPrefix,
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

  if (args.entry.completion_metadata?.documentation) {
    item.documentation = formatDocumentation(
      args.entry.completion_metadata?.documentation
    );
  }

  return item;
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

function isMarkdownStringSpec(
  x: string | MarkdownStringSpec
): x is MarkdownStringSpec {
  return !(typeof x === "string");
}

export function completionIsAllowed(
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  const configuration = vscode.workspace.getConfiguration();
  const disableLineRegex = getMisnamedConfigPropertyValue(
    "tabnine.disableLineRegex",
    "tabnine.disable_line_regex",
    configuration
  );

  const line = document.getText(
    new vscode.Range(
      position.with({ character: 0 }),
      position.with({ character: 500 })
    )
  );

  if (disableLineRegex.some((r) => new RegExp(r).test(line))) {
    return false;
  }

  const disableFileRegex = getMisnamedConfigPropertyValue(
    "tabnine.disableFileRegex",
    "tabnine.disable_file_regex",
    configuration
  );

  return !disableFileRegex.some((r) => new RegExp(r).test(document.fileName));
}

function getMisnamedConfigPropertyValue(
  properPropName: string,
  propMisname: string,
  configuration: vscode.WorkspaceConfiguration
): string[] {
  let disableLineRegex = configuration.get<string[]>(properPropName);
  if (!disableLineRegex || !disableLineRegex.length) {
    disableLineRegex = configuration.get<string[]>(propMisname);
  }

  if (disableLineRegex === undefined) {
    disableLineRegex = [];
  }

  return disableLineRegex;
}

function showFew(
  response: AutocompleteResult,
  document: vscode.TextDocument,
  position: vscode.Position
): boolean {
  if (
    response.results.some(
      (entry) =>
        entry.completion_metadata?.kind ||
        entry.completion_metadata?.documentation
    )
  ) {
    return false;
  }

  const leftPoint = position.translate(0, -response.old_prefix.length);
  const tail = document.getText(
    new vscode.Range(document.lineAt(leftPoint).range.start, leftPoint)
  );

  return tail.endsWith(".") || tail.endsWith("::");
}
