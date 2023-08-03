import * as vscode from "vscode";
import { WorkspaceCommandInstruction } from "../../workspaceCommands";
import getEditorContext from "./editorContext";
import {
  ContextTypeData,
  EnrichingContextTypes,
} from "./enrichingContextTypes";
import getDiagnosticsContext from "./diagnosticsContext";
import getWorkspaceContext from "./workspaceContext";
import { rejectOnTimeout } from "../../../utils/utils";

export type EnrichingContextRequestPayload = {
  contextTypes: EnrichingContextTypes[];
  workspaceCommands?: WorkspaceCommandInstruction[];
};

export type EnrichingContextResponsePayload = {
  enrichingContextData: ContextTypeData[];
};

export async function getEnrichingContext(
  request?: EnrichingContextRequestPayload
): Promise<EnrichingContextResponsePayload> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || !request?.contextTypes || !request.contextTypes.length)
    return { enrichingContextData: [] };

  const contextTypesSet = [...new Set(request.contextTypes)];

  const enrichingContextData = (
    await rejectOnTimeout(
      Promise.all(
        contextTypesSet.map((contextType) => {
          switch (contextType) {
            case "Editor":
              return getEditorContext(editor);
            case "Diagnostics":
              return getDiagnosticsContext(editor);
            case "Workspace":
              return getWorkspaceContext(request.workspaceCommands);
            default:
              return undefined;
          }
        })
      ),
      3000
    )
  ).filter((contextData) => !!contextData) as ContextTypeData[];
  return { enrichingContextData };
}
