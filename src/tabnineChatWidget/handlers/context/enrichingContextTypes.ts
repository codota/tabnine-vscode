export type EditorContext = {
  fileCode: string;
  currentLineIndex?: number;
};

export type WorkspaceContext = {
  symbols?: string[];
};

export type DiagnosticItem = {
  errorMessage: string;
  lineNumber: number;
  lineCode: string;
};

export type DiagnosticsContext = {
  diagnostics: DiagnosticItem[];
};

export type EnrichingContextTypes = "Editor" | "Workspace" | "Diagnostics";

export type ContextTypeData =
  | ({ type: "Editor" } & EditorContext)
  | ({
      type: "Diagnostics";
    } & DiagnosticsContext)
  | ({ type: "Workspace" } & WorkspaceContext);
