import * as vscode from "vscode";
import { getFileMetadata } from "../../../binary/requests/fileMetadata";

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
    language: editor.document.languageId || getPrimaryWorkspaceLanguage(),
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
  };
}


function getPrimaryWorkspaceLanguage(): string | undefined {
  // Get the files associations from the workspace settings
  const filesAssociations: { [globPattern: string]: string } = vscode.workspace.getConfiguration('files').get('associations') || {};

  // Count the occurrences for each language
  const languageCount: { [lang: string]: number } = {};

  for (const lang of Object.values(filesAssociations)) {
      if (!languageCount[lang]) {
          languageCount[lang] = 0;
      }
      languageCount[lang]++;
  }

  // Determine the most common language
  let mostCommonLanguage: string | undefined;
  let highestCount = 0;

  for (const [lang, count] of Object.entries(languageCount)) {
      if (count > highestCount) {
          mostCommonLanguage = lang;
          highestCount = count;
      }
  }

  return mostCommonLanguage;
}