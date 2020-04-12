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

export function activate(context: vscode.ExtensionContext) {

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

    const unregisterFunctions = [];

    const request = JSON.stringify(any_request) + '\n';
    let response = new Promise<any>((resolve, reject) => {
      try {
        if (!this.isChildAlive()) {
          this.restartChild();
        }
        if (!this.isChildAlive()) {
          reject(new Error("TabNine process is dead."))
        }
        const onResponse: (input: any) => void = (response) => {
          let any_response: any = JSON.parse(response.toString());
          resolve(any_response);
        };
        this.rl.once('line', onResponse);

        unregisterFunctions.push(() => this.rl.removeListener('line', onResponse));

        this.proc.stdin.write(request, "utf8");
      } catch (e) {
        console.log(`Error interacting with TabNine: ${e}`);
        reject(e);
      }
    });

    let timeout = new Promise((_resolve, reject) => {
      setTimeout(() => reject('request timed out'), 1000);
    });

    let procExit = new Promise((_resolve, reject) => {
      const onClose = () => reject('Child process exited');
      this.proc.once('exit', onClose);

      unregisterFunctions.push(() => this.proc.removeListener('exit', onClose));
    });

    const unregister = () => {
      unregisterFunctions.forEach(f => f());
    };

    return Promise.race([response, timeout, procExit]).then(value => {
      unregister();
      return value;
    }, err => {
      unregister();
      throw err;
    });
  }

  private isChildAlive(): boolean {
    return this.proc && !this.childDead;
  }

  private onChildDeath() {
    this.childDead = true;

    setTimeout(() => {
        if (!this.isChildAlive()) {
          this.restartChild();
        }
    }, 10000);
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
      this.onChildDeath();
    });
    this.proc.stdin.on('error', (error) => {
      console.log(`stdin error: ${error}`)
      this.onChildDeath();
    });
    this.proc.stdout.on('error', (error) => {
      console.log(`stdout error: ${error}`)
      this.onChildDeath();
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
          suffix = 'unknown-linux-musl/TabNine'
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
