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
    return noEditorResponse() ;
  }

  const metadata = await getFileMetadata(editor.document.fileName);
  return {
    fileUri: editor.document.uri.toString(),
    language: editor.document.languageId ,
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



async function getPredominantWorkspaceLanguage(maxFiles: number = 50): Promise<string | undefined> {
  const breakdown: { [extension: string]: number } = {};

    // File extension to language name mapping as a Map
    const fileTypeToLanguage = new Map<string, string>([
        ['js', 'javascript'],
        ['py', 'python'],
        ['java', 'java'],
        ['cpp', 'c++'],
        ['hpp', 'c++'],
        ['c', 'c'],
        ['h', 'c'],
        ['cs', 'c#'],
        ['php', 'php'],
        ['ts', 'typescript'],
        ['rb', 'ruby'],
        ['go', 'go'],
        ['rs', 'rust'],
        ['swift', 'swift'],
        ['kt', 'kotlin'],
        ['dart', 'dart'],
        ['json', 'json'],
        ['yaml', 'yaml'],
        ['yml', 'yaml']
    ]);

    const topFileTypes = Array.from(fileTypeToLanguage.keys());

    // Ensure a workspace is open
    if (!vscode.workspace.workspaceFolders) {
        console.log("No workspace is open.");
        return;
    }

    // Get up to maxFiles from the workspace without depth restriction
    const files = await vscode.workspace.findFiles('**/*', null, maxFiles);

    // Tally up file extensions
    for (const file of files) {
        const ext = file.fsPath.split('.').pop()?.toLowerCase();
        if (ext && topFileTypes.includes(ext)) {
            if (!breakdown[ext]) {
                breakdown[ext] = 0;
            }
            breakdown[ext]++;
        }
    }

    // Sort extensions by frequency and return the name of the most common language
    const sortedExtensions = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
    const predominantFileType = sortedExtensions[0][0];
    return sortedExtensions.length > 0 ? fileTypeToLanguage.get(predominantFileType) : undefined;
}
