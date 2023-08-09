import * as vscode from "vscode";
import { getFileMetadata } from "../../../binary/requests/fileMetadata";
import getBasicContextCache from "./basicContextCache";
import BasicContext from "./basicContext";

export async function getBasicContext(
  _nothing: void,
  context?: vscode.ExtensionContext
): Promise<BasicContext> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return noEditorResponse();
  }

  const metadata = await getFileMetadata(editor.document.fileName);

  const language = (metadata as { language?: string } | undefined)?.language;
  const basicContext = {
    fileUri: editor.document.uri.toString(),
    language,
    metadata,
  };

  if (context) {
    getBasicContextCache(context).save(basicContext);
  }

  return basicContext;
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
