/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as semver from 'semver';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import {Mutex} from 'await-semaphore';

const CHAR_LIMIT = 100000;
const MAX_NUM_RESULTS = 5;
const DEFAULT_DETAIL = "TabNine";
const COMMAND_NAME = "TabNine Substitute";

export function activate(context: vscode.ExtensionContext) {

  vscode.commands.registerTextEditorCommand(
    COMMAND_NAME,
    (editor, edit, args: CommandArgs) => {
      editor.selections = editor.selections.map((selection: vscode.Selection) => {
        const editorPrefix = editor.document.getText(new vscode.Range(selection.active.translate(0, -args.old_prefix.length), selection.active));
        if (args.old_prefix != editorPrefix) {
          return selection;
        }
        const editorSuffix = editor.document.getText(new vscode.Range(selection.active, selection.active.translate(0, args.old_suffix.length)));
        let old_suffix: string;
        if (args.old_suffix == editorSuffix) {
          old_suffix = args.old_suffix;
        } else {
          old_suffix = "";
        }
        edit.insert(
          selection.active.translate(0, -args.old_prefix.length),
          args.new_prefix
        );
        edit.insert(
          selection.active.translate(0, old_suffix.length),
          args.new_suffix
        );
        edit.delete(new vscode.Range(
          selection.active.translate(0, -args.old_prefix.length),
          selection.active.translate(0, old_suffix.length),
        ));

        let new_position = selection.active.translate(0, -args.new_suffix.length);
        return new vscode.Selection(new_position, new_position)
      })
    }
  );

  const tabNine = new TabNine();

  const triggers = [];
  for (let i = 32; i <= 126; i++) {
    triggers.push(String.fromCharCode(i));
  }

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
        const request = tabNine.request("1.0.10", {
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
          }
          completionList = results;
        }
        return new vscode.CompletionList(completionList, true);
      } catch (e) {
        console.log(`Error setting up request: ${e}`);
      }
    }
  }, ...triggers);

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
    item.insertText = "";
    item.sortText = new Array(args.index + 2).join('0');
    item.range = new vscode.Range(args.position, args.position);
    let arg: CommandArgs = {
      old_prefix: args.old_prefix,
      new_prefix: args.entry.new_prefix,
      old_suffix: args.entry.old_suffix,
      new_suffix: args.entry.new_suffix,
    };
    item.command = {
      arguments: [arg],
      command: COMMAND_NAME,
      title: "accept completion",
    };
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

interface CommandArgs {
  old_prefix: string,
  new_prefix: string,
  old_suffix: string,
  new_suffix: string,
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

class TabNine {
  private proc: child_process.ChildProcess;
  private rl: readline.ReadLine;
  private numRestarts: number = 0;
  private childDead: boolean;
  private mutex: Mutex = new Mutex();

  constructor() {
  }

  async request(version: string, any_request: any): Promise<any> {
    const release = await this.mutex.acquire();
    try {
      return await this.requestUnlocked(version, any_request);
    } finally {
      release();
    }
  }

  private requestUnlocked(version: string, any_request: any): Promise<any> {
    any_request = {
      "version": version,
      "request": any_request
    };
    const request = JSON.stringify(any_request) + '\n';
    return new Promise<any>((resolve, reject) => {
      try {
        if (!this.isChildAlive()) {
          this.restartChild();
        }
        if (!this.isChildAlive()) {
          reject(new Error("TabNine process is dead."))
        }
        this.rl.once('line', (response) => {
          let any_response: any = JSON.parse(response.toString());
          resolve(any_response);
        });
        this.proc.stdin.write(request, "utf8");
      } catch (e) {
        console.log(`Error interacting with TabNine: ${e}`);
        reject(e);
      }
    });
  }

  private isChildAlive(): boolean {
    return this.proc && !this.childDead;
  }

  private restartChild(): void {
    if (this.numRestarts >= 10) {
      return;
    }
    this.numRestarts += 1;
    if (this.proc) {
      this.proc.kill();
    }
    const args = [
      "--client=vscode",
    ];
    const binary_root = path.join(__dirname, "..", "binaries");
    const command = TabNine.getBinaryPath(binary_root);
    this.proc = child_process.spawn(command, args);
    this.childDead = false;
    this.proc.on('exit', (code, signal) => {
      this.childDead = true;
    });
    this.proc.stdin.on('error', (error) => {
      console.log(`stdin error: ${error}`)
      this.childDead = true;
    });
    this.proc.stdout.on('error', (error) => {
      console.log(`stdout error: ${error}`)
      this.childDead = true;
    });
    this.proc.unref(); // AIUI, this lets Node exit without waiting for the child
    this.rl = readline.createInterface({
      input: this.proc.stdout,
      output: this.proc.stdin
    });
  }

  private static getBinaryPath(root): string {
      let arch;
      if (process.arch == 'x32') {
          arch = 'i686'
      } else if (process.arch == 'x64') {
          arch = 'x86_64'
      } else {
          throw new Error(`Sorry, the architecture '${process.arch}' is not supported by TabNine.`)
      }
      let suffix;
      if (process.platform == 'win32') {
          suffix = 'pc-windows-gnu/TabNine.exe'
      } else if (process.platform == 'darwin') {
          suffix = 'apple-darwin/TabNine'
      } else if (process.platform == 'linux') {
          suffix = 'unknown-linux-gnu/TabNine'
      }  else {
          throw new Error(`Sorry, the platform '${process.platform}' is not supported by TabNine.`)
      }
      const versions = fs.readdirSync(root)
      TabNine.sortBySemver(versions)
      const tried = []
      for (let version of versions) {
          const full_path = `${root}/${version}/${arch}-${suffix}`
          tried.push(full_path)
          if (fs.existsSync(full_path)) {
              return full_path
          }
      }
      throw new Error(`Couldn't find a TabNine binary (tried the following paths: versions=${versions} ${tried})`)
  }

  private static sortBySemver(versions: string[]) {
      versions.sort(TabNine.cmpSemver);
  }

  private static cmpSemver(a, b): number {
      const a_valid = semver.valid(a)
      const b_valid = semver.valid(b)
      if (a_valid && b_valid) { return semver.rcompare(a, b) }
      else if (a_valid) { return -1 }
      else if (b_valid) { return 1 }
      else if (a < b) { return -1 }
      else if (a > b) { return 1 }
      else { return 0 }
  }
}
