import vscode from "vscode";
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
    language: editor.document.languageId,
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
