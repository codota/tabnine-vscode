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

const CHAR_LIMIT = 3000;
const MAX_NUM_RESULTS = 4;

export function activate(context: vscode.ExtensionContext) {

  const tabNine = new TabNine();

  const triggers = [];
  for (let i = 32; i <= 126; i++) {
    triggers.push(String.fromCharCode(i));
  }

  vscode.languages.registerCompletionItemProvider({ pattern: '**' }, {
    async provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken, context: vscode.CompletionContext) {
      try {
        let offset = document.offsetAt(position);
        let before_start_offset = Math.max(0, offset - CHAR_LIMIT)
        let after_end_offset = offset + CHAR_LIMIT;
        let before_start = document.positionAt(before_start_offset);
        let after_end = document.positionAt(after_end_offset);
        let before = document.getText(new vscode.Range(before_start, position));
        let after = document.getText(new vscode.Range(position, after_end));
        const response: AutocompleteResult = await tabNine.request("0.6.0", {
          "Autocomplete": {
            "filename": document.fileName,
            "before": before,
            "after": after,
            "region_includes_beginning": (before_start_offset === 0),
            "region_includes_end": (document.offsetAt(after_end) !== after_end_offset),
            "max_num_results": MAX_NUM_RESULTS,
          }
        });
        let completionList;
        if (response.results.length === 0) {
          completionList = [];
        } else {
          const results = [];
          let index = 0;
          for (const r of response.results) {
            results.push(makeCompletionItem(
              r.result,
              index,
              r.prefix_to_substitute,
              response.suffix_to_substitute,
              position,
            ));
            index += 1;
          }
          for (const msg of response.promotional_message) {
            results.push(makeCompletionItem(
              msg,
              index,
              "",
              "",
              position,
            ));
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

  function makeCompletionItem(
    text: string,
    index: number,
    prefix_to_substitute: string,
    suffix_to_substitute: string,
    position: vscode.Position)
    : vscode.CompletionItem
  {
    let prefix = '';
    for (let j = 0; j < index; j++) {
      prefix += '~';
    }
    let item = new vscode.CompletionItem(text);
    item.filterText = intersperse(suffix_to_substitute, index);
    item.range = new vscode.Range(
      position.translate(0, -suffix_to_substitute.length),
      position.translate(0, prefix_to_substitute.length))
    // item.kind = vscode.CompletionItemKind.Keyword;
    item.detail = 'TabNine';
    return item;
  }

  function intersperse(s: string, cnt: number): string {
    let result = "";
    for (let c of s) {
      result += c;
      for (let i = 0; i < cnt; i++) {
        result += "z";
      }
    }
    return result;
  }

  function createSnippetItem(): vscode.CompletionItem {
    let item = new vscode.CompletionItem('Good part of the day', vscode.CompletionItemKind.Snippet);
    item.insertText = new vscode.SnippetString("Good ${1|morning,afternoon,evening|}. It is ${1}, right?");
    item.documentation = new vscode.MarkdownString("Inserts a snippet that lets you select the _appropriate_ part of the day for your greeting.");

    return item;
  }
}

interface AutocompleteResult {
  suffix_to_substitute: string,
  results: ResultEntry[],
  promotional_message: string[],
}

interface ResultEntry {
  result: string,
  prefix_to_substitute: string,
}

class TabNine {
  private proc: child_process.ChildProcess;
  private numRestarts: number = 0;
  private childDead: boolean;

  constructor() {
  }

  request(version: string, any_request: any): any {
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
        this.proc.stdout.once('data', (response) => {
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
