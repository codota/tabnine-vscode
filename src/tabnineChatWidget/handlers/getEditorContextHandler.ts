import * as vscode from "vscode";
import { getFileMetadata } from "../../binary/requests/fileMetadata";
import { resolveSymbols } from "./resolveSymbols";
import { Logger } from "../../utils/logger";
import { rejectOnTimeout } from "../../utils/utils";

export type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContextResponse = {
  fileCode: string;
  selectedCode: string;
  currentLineIndex?: number;
  selectedCodeUsages: SelectedCodeUsage[];
  diagnosticsText?: string;
  fileUri?: string;
  language?: string;
  lineTextAtCursor?: string;
  metadata?: unknown;
};

export type EditorContextRequest = {
  userQuery: string;
};

export async function getEditorContext(
  request?: EditorContextRequest
): Promise<EditorContextResponse> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
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
      fileCode: "",
      selectedCode: "",
      selectedCodeUsages: [],
      metadata,
    };
  }

  const doc = editor.document;
  const fileCode = doc.getText();
  const selectedCode = (await getSelectedCode(editor, request)) || "";
  const metadata = await getFileMetadata(doc.fileName);
  const currentLineIndex = doc.lineAt(editor.selection.active).lineNumber;

  return {
    fileCode,
    selectedCode,
    currentLineIndex,
    selectedCodeUsages: [],
    diagnosticsText: getDiagnosticsText(editor),
    fileUri: doc.uri.toString(),
    language: doc.languageId,
    lineTextAtCursor: doc.lineAt(editor.selection.active).text,
    metadata,
  };
}

async function getSelectedCode(
  editor: vscode.TextEditor,
  request?: EditorContextRequest
): Promise<string | undefined> {
  if (!editor.selection.isEmpty) {
    return editor.document.getText(editor.selection);
  }
  if (!request?.userQuery) return undefined;

  const wordsInQuery = request.userQuery.match(/\b\w+\b/g);

  if (!wordsInQuery?.length) return undefined;
  try {
    return await rejectOnTimeout(
      findUserQuerySymbolInCurrentFile(wordsInQuery, editor),
      1000
    );
  } catch (e) {
    Logger.debug(
      `failed to fetch symbols for selected code: ${(e as Error).message}`
    );
    return undefined;
  }
}

async function findUserQuerySymbolInCurrentFile(
  wordsInQuery: string[],
  editor: vscode.TextEditor
): Promise<string | undefined> {
  const allSymbols = await Promise.all(
    wordsInQuery.map((word) =>
      resolveSymbols({ symbol: word })
        .then((symbols) =>
          symbols?.filter(
            (symbol) =>
              symbol?.location?.uri.fsPath === editor.document.uri.fsPath
          )
        )
        .catch((e) => {
          Logger.debug(
            `failed to fetch symbols for '${word}': ${(e as Error).message}`
          );
          return undefined;
        })
    )
  );
  const firstSymbol = allSymbols.find((s) => s?.length)?.find((s) => !!s);
  if (firstSymbol) {
    return editor.document.getText(firstSymbol.location.range);
  }
  return undefined;
}

function getDiagnosticsText(editor: vscode.TextEditor): string {
  const visibleDiagnostics = vscode.languages
    .getDiagnostics(editor.document.uri)
    .filter(
      (e) =>
        e.severity === vscode.DiagnosticSeverity.Error &&
        editor.visibleRanges.some((r) => r.contains(e.range))
    );
  return formatDiagnostics(visibleDiagnostics);
}

function formatDiagnostics(diagnostics: vscode.Diagnostic[]): string {
  return `${diagnostics.map((e) => `${e.message}`).join("\n")}`;
}
