import * as vscode from "vscode";

export interface GitInputBox {
  value: string;
}

export interface GitChange {
  readonly uri: vscode.Uri;
  readonly status: number;
}

export interface GitRepositoryState {
  readonly indexChanges: GitChange[];
  readonly workingTreeChanges: GitChange[];
  readonly mergeChanges: GitChange[];
}

export interface GitRepository {
  readonly rootUri: vscode.Uri;
  readonly inputBox: GitInputBox;
  readonly state: GitRepositoryState;
  diff(cached?: boolean): Promise<string>;
  status(): Promise<void>;
}

export interface GitAPI {
  readonly repositories: GitRepository[];
  getRepository(uri: vscode.Uri): GitRepository | null;
}

export interface GitExtension {
  readonly enabled: boolean;
  getAPI(version: 1): GitAPI;
}

export async function getGitAPI(): Promise<GitAPI | undefined> {
  const extension = vscode.extensions.getExtension<GitExtension>("vscode.git");
  if (!extension) {
    return undefined;
  }

  if (!extension.isActive) {
    await extension.activate();
  }

  const gitExtension = extension.exports;
  if (!gitExtension?.enabled) {
    return undefined;
  }

  return gitExtension.getAPI(1);
}

export function resolveRepository(
  api: GitAPI,
  sourceControl?: vscode.SourceControl
): GitRepository | undefined {
  if (sourceControl?.rootUri) {
    const matched = api.getRepository(sourceControl.rootUri);
    if (matched) {
      return matched;
    }
  }

  if (api.repositories.length === 1) {
    return api.repositories[0];
  }

  const activeUri = vscode.window.activeTextEditor?.document.uri;
  if (activeUri) {
    const fromEditor = api.getRepository(activeUri);
    if (fromEditor) {
      return fromEditor;
    }
  }

  return api.repositories[0];
}

export async function getCommitDiff(repository: GitRepository): Promise<string> {
  await repository.status();

  const stagedDiff = await repository.diff(true);
  if (stagedDiff.trim()) {
    return stagedDiff;
  }

  if (repository.state.indexChanges.length > 0) {
    return stagedDiff;
  }

  const unstagedDiff = await repository.diff(false);
  return unstagedDiff;
}

export function hasChanges(repository: GitRepository): boolean {
  return (
    repository.state.indexChanges.length > 0 ||
    repository.state.workingTreeChanges.length > 0 ||
    repository.state.mergeChanges.length > 0
  );
}
