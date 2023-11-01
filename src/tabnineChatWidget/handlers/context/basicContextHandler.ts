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
    language: editor.document.languageId || await getPredominantWorkspaceLanguage() ,
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

  // Getting the known languages from VS Code
  const knownLanguages = await vscode.languages.getLanguages();

  // File extension to VS Code language ID mapping
  const fileTypeToLanguageID = new Map<string, string>([
      ['js', 'javascript'],
      ['py', 'python'],
      ['java', 'java'],
      ['cpp', 'cpp'],
      ['hpp', 'cpp'],
      ['c', 'c'],
      ['h', 'c'],
      ['cs', 'csharp'],
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

  const topFileTypes = Array.from(fileTypeToLanguageID.keys());

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

  // Sort extensions by frequency and return the predominant language ID
  const sortedExtensions = Object.entries(breakdown).sort(([, a], [, b]) => b - a);
  const predominantFileType = sortedExtensions[0][0];
  const languageID = fileTypeToLanguageID.get(predominantFileType);
  if (!languageID) {
      return;
  }
  // Check if the languageID is among known languages
  return sortedExtensions.length > 0 && knownLanguages.includes(languageID) ? languageID : undefined;
}
