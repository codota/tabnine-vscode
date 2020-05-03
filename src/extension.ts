/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { TabNine } from './TabNine';
import * as fs from 'fs';
import * as path from 'path';

const CHAR_LIMIT = 100000;
const MAX_NUM_RESULTS = 5;
const DEFAULT_DETAIL = "TabNine";

export function activate(context: vscode.ExtensionContext) {
  handleUninstall();
  
  const command = 'TabNine::config';
  const commandHandler = () => {
    const request = tabNine.request("1.0.7", {
      "Configuration": {}
    });
  };

  context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));

  const tabNine = new TabNine();

  const triggers = [
    ' ',
    '.',
    '(',
    ')',
    '{',
    '}',
    '[',
    ']',
    ',',
    ':',
    '\'',
    '"',
    '=',
    '<',
    '>',
    '/',
    '\\',
    '+',
    '-',
    '|',
    '&',
    '*',
    '%',
    '=',
    '$',
    '#',
    '@',
    '!',
  ];

  vscode.languages.registerCompletionItemProvider({ pattern: '**' }, {
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
      try {
        const offset = document.offsetAt(position);
        const before_start_offset = Math.max(0, offset - CHAR_LIMIT)
        const after_end_offset = offset + CHAR_LIMIT;
        const before_start = document.positionAt(before_start_offset);
        const after_end = document.positionAt(after_end_offset);
        const before = document.getText(new vscode.Range(before_start, position));
        const after = document.getText(new vscode.Range(position, after_end));
        const request = tabNine.request("1.0.7", {
          "Autocomplete": {
            "filename": document.fileName,
            "before": before,
            "after": after,
            "region_includes_beginning": (before_start_offset === 0),
            "region_includes_end": (document.offsetAt(after_end) !== after_end_offset),
            "max_num_results": MAX_NUM_RESULTS,
          }
        });
        if (!completionIsAllowed(document, position)) {
          return undefined;
        }
        const response: AutocompleteResult = await request;
        let completionList;
        if (response.results.length === 0) {
          completionList = [];
        } else {
          const results = [];
          let detailMessage = "";
          for (const msg of response.user_message) {
            if (detailMessage !== "") {
              detailMessage += "\n";
            }
            detailMessage += msg;
          }
          if (detailMessage === "") {
            detailMessage = DEFAULT_DETAIL;
          }
          let limit = undefined;
          if (showFew(response, document, position)) {
            limit = 1;
          }
          let index = 0;
          for (const entry of response.results) {
            results.push(makeCompletionItem({
              document,
              index,
              position,
              detailMessage,
              old_prefix: response.old_prefix,
              entry,
            }));
            index += 1;
            if (limit !== undefined && index >= limit) {
              break;
            }
          }
          completionList = results;
        }
        return new vscode.CompletionList(completionList, true);
      } catch (e) {
        console.log(`Error setting up request: ${e}`);
      }
    }
  }, ...triggers);

  function showFew(response: AutocompleteResult, document: vscode.TextDocument, position: vscode.Position): boolean {
    for (const entry of response.results) {
      if (entry.kind || entry.documentation) {
        return false;
      }
    }
    const leftPoint = position.translate(0, -response.old_prefix.length);
    const tail = document.getText(new vscode.Range(document.lineAt(leftPoint).range.start, leftPoint));
    return tail.endsWith('.') || tail.endsWith('::');
  }

  function makeCompletionItem(args: {
    document: vscode.TextDocument,
    index: number,
    position: vscode.Position,
    detailMessage: string,
    old_prefix: string,
    entry: ResultEntry,
  })
    : vscode.CompletionItem
  {
    let item = new vscode.CompletionItem(args.entry.new_prefix);
    item.sortText = new Array(args.index + 2).join("0");
    item.insertText = new vscode.SnippetString(escapeTabStopSign(args.entry.new_prefix));
    if (args.entry.new_suffix) {
      item.insertText
        .appendTabstop(0)
        .appendText(escapeTabStopSign(args.entry.new_suffix));
    }
    

    item.range = new vscode.Range(args.position.translate(0, -args.old_prefix.length), args.position.translate(0, args.entry.old_suffix.length));
    if (args.entry.documentation) {
      item.documentation = formatDocumentation(args.entry.documentation);
    }
    if (args.entry.detail) {
      if (args.detailMessage === DEFAULT_DETAIL || args.detailMessage.includes("Your project contains")) {
        item.detail = args.entry.detail;
      } else {
        item.detail = args.detailMessage;
      }
    } else {
      item.detail = args.detailMessage;
    }
    item.preselect = (args.index === 0);
    item.kind = args.entry.kind;
    return item;
  }

  function formatDocumentation(documentation: string | MarkdownStringSpec): string | vscode.MarkdownString {
    if (isMarkdownStringSpec(documentation)) {
      if (documentation.kind == "markdown") {
        return new vscode.MarkdownString(documentation.value);
      } else {
        return documentation.value;
      }
    } else {
      return documentation;
    }
  }
  function escapeTabStopSign(value){
    return value.replace(new RegExp("\\$", 'g'), "\\$");
  }

  function isMarkdownStringSpec(x: any): x is MarkdownStringSpec {
    return x.kind;
  }

  function completionIsAllowed(document: vscode.TextDocument, position: vscode.Position): boolean {
    const configuration = vscode.workspace.getConfiguration();
    let disable_line_regex = configuration.get<string[]>('tabnine.disable_line_regex');
    if (disable_line_regex === undefined) {
      disable_line_regex = [];
    }
    let line = undefined;
    for (const r of disable_line_regex) {
      if (line === undefined) {
        line = document.getText(new vscode.Range(
          position.with({character: 0}),
          position.with({character: 500}),
        ))
      }
      if (new RegExp(r).test(line)) {
        return false;
      }
    }
    let disable_file_regex = configuration.get<string[]>('tabnine.disable_file_regex');
    if (disable_file_regex === undefined) {
      disable_file_regex = []
    }
    for (const r of disable_file_regex) {
      if (new RegExp(r).test(document.fileName)) {
        return false;
      }
    }
    return true;
  }
}

interface AutocompleteResult {
  old_prefix: string,
  results: ResultEntry[],
  user_message: string[],
}

interface ResultEntry {
  new_prefix: string,
  old_suffix: string,
  new_suffix: string,

  kind?: vscode.CompletionItemKind,
  detail?: string,
  documentation?: string | MarkdownStringSpec,
  deprecated?: boolean
}

interface MarkdownStringSpec {
  kind: string,
  value: string
}


function handleUninstall() {
  try {
    const extension = vscode.extensions.all.find(x => x.id.includes("tabnine-vscode"));
    const extensionsPath = path.dirname(extension.extensionPath);
    const uninstalledPath = path.join(extensionsPath, '.obsolete');
    fs.watchFile(uninstalledPath, () => {
      fs.readFile(uninstalledPath, async (err, uninstalled) => {
        try {
          if (err) {
            console.error("failed to read .obsolete file:", err);
            throw err;
          }
          const extensionName = `tabnine-vscode-${extension.packageJSON.version}`;
          if (uninstalled.includes(extensionName)) {
            await TabNine.reportUninstall();
          }
        } catch (error) {
          console.error("failed to report uninstall:", error);
        }
      });
    });
  } catch (error) {
    console.error("failed to invoke uninstall:", error);
  }
}

