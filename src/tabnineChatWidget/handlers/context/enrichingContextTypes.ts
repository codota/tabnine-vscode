export type EditorContext = {
  fileCode: string;
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
