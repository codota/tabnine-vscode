type SelectedCodeUsage = {
  filePath: string;
  code: string;
};

export type EditorContext = {
  fileCode: string;
  selectedCode: string;
  selectedCodeUsages: SelectedCodeUsage[];
  lineTextAtCursor?: string;
  currentLineIndex?: number;
};

export type WorkspaceContext = {
  symbols?: string[];
};

export type DiagnosticsContext = {
  diagnosticsText?: string;
};

export type EnrichingContextTypes = "Editor" | "Workspace" | "Diagnostics";

export type ContextTypeData =
  | ({ type: "Editor" } & EditorContext)
  | ({
      type: "Diagnostics";
    } & DiagnosticsContext)
  | ({ type: "Workspace" } & WorkspaceContext);
