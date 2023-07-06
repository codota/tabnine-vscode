import * as vscode from "vscode";
import { getFileMetadata } from "../../binary/requests/fileMetadata";
import executeWorkspaceCommand, {
  WorkspaceCommandInstruction,
} from "../workspaceCommands";

export type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContextRequest = {
  workspaceCommands: WorkspaceCommandInstruction[];
};

export type WorkspaceData = {
  symbols?: string[];
};

export type EditorContextResponse = {
  fileCode: string;
  selectedCode: string;
  selectedCodeUsages: SelectedCodeUsage[];
  diagnosticsText?: string;
  fileUri?: string;
  language?: string;
  lineTextAtCursor?: string;
  workspaceData?: WorkspaceData;
  metadata?: unknown;
};

export async function getEditorContext(
  request: EditorContextRequest
): Promise<EditorContextResponse> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return {
      fileCode: "",
      selectedCode: "",
      selectedCodeUsages: [],
    };
  }
  const doc = editor.document;
  const fileCode = doc.getText();
  const selectedCode = doc.getText(editor.selection);
  const workspaceData = request
    ? await resolveWorkspaceData(request.workspaceCommands)
    : undefined;

  const metadata = await getFileMetadata(doc.fileName);

  return {
    fileCode,
    selectedCode,
    selectedCodeUsages: [],
    diagnosticsText: getDiagnosticsText(editor),
    fileUri: doc.uri.toString(),
    language: doc.languageId,
    lineTextAtCursor: doc.lineAt(editor.selection.active).text,
    workspaceData,
    metadata,
  };
}

async function resolveWorkspaceData(
  workspaceCommands: WorkspaceCommandInstruction[]
): Promise<WorkspaceData | undefined> {
  const workspaceData: WorkspaceData = {
    symbols: undefined,
  };
  const results = await Promise.all(
    workspaceCommands.map(executeWorkspaceCommand)
  );

  results.forEach((result) => {
    if (!result) return;
    if (result.command === "symbolSearch") {
      workspaceData.symbols = (workspaceData?.symbols ?? []).concat(
        result.data
      );
    }
  });

  return workspaceData;
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
