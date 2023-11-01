import * as vscode from "vscode";
import { getFileMetadata } from "../../../binary/requests/fileMetadata";
import languages from "../../../globals/languages";

export type BasicContext = {
  fileUri?: string;
  language?: string;
  metadata?: unknown;
};

export async function getBasicContext(): Promise<BasicContext> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return noEditorResponse();
  }

  const metadata = await getFileMetadata(editor.document.fileName);
  return {
    fileUri: editor.document.uri.toString(),
    language:
      editor.document.languageId || (await getPredominantWorkspaceLanguage()),
    metadata,
  };
}

async function noEditorResponse() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  let metadata;

  if (folder) {
    const firstFileInWorkspace = (
      await vscode.workspace.fs.readDirectory(folder?.uri)
    ).find(([, type]) => type === vscode.FileType.File);
    if (firstFileInWorkspace) {
      metadata = await getFileMetadata(
        vscode.Uri.joinPath(folder.uri, firstFileInWorkspace[0]).fsPath
      );
    }
  }

  return {
    metadata,
    language: await getPredominantWorkspaceLanguage(),
  };
}

export async function getPredominantWorkspaceLanguage(
  maxFiles = 50
): Promise<string | undefined> {
  const breakdown: { [extension: string]: number } = {};

  const topFileTypes = Object.values(languages);
  const fileTypeToLanguageID = new Map(
    Object.entries(languages).map(([key, value]) => [value, key])
  );

  // Ensure a workspace is open
  if (!vscode.workspace.workspaceFolders) {
    return undefined;
  }

  // Get up to maxFiles from the workspace without depth restriction
  const files = await vscode.workspace.findFiles("**/*", null, maxFiles);

  // Tally up file extensions
  files.forEach((file) => {
    const ext = `.${file?.fsPath.split(".").pop()?.toLowerCase() || ""}`;
    if (ext && topFileTypes.includes(ext)) {
      breakdown[ext] = (breakdown[ext] || 0) + 1;
    }
  });

  // Sort extensions by frequency and return the predominant language ID
  const sortedExtensions = Object.entries(breakdown).sort(
    ([, a], [, b]) => b - a
  );
  if (!sortedExtensions.length) return undefined;

  const predominantFileType = sortedExtensions[0][0];
  return fileTypeToLanguageID.get(predominantFileType);
}
