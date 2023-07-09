import { exec } from "child_process";
import * as vscode from "vscode";

export type GitDiffContextResponse = {
  diff: string;
};

export async function getGitDiffContext(): Promise<GitDiffContextResponse> {
  return new Promise((resolve, reject) => {
    let folder = vscode.workspace.workspaceFolders?.[0];
    if (folder) {
      let rootPath = folder.uri.fsPath;
      const branch = "master";
      const maxChanges = 100;
      const command = `git diff ${branch}`;
      exec(command, { cwd: rootPath }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        }
        if (stderr) {
          reject(stderr);
        }
        resolve({
          diff: stdout.substring(0, 20000)
        });
      });
      return;
    }
    resolve({
      diff: ""
    });
  });
}
