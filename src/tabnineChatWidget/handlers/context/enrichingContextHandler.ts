import vscode from "vscode";
import { Logger } from "../../../utils/logger";
import { WorkspaceCommandInstruction } from "../../workspaceCommands";
import getEditorContext from "./editorContext";
import {
  ContextTypeData,
  EnrichingContextTypes,
} from "./enrichingContextTypes";
import getDiagnosticsContext from "./diagnosticsContext";
import getWorkspaceContext from "./workspaceContext";

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
    await Promise.all(
      contextTypesSet.map((contextType) => {
        try {
          switch (contextType) {
            case "Editor":
              return getEditorContext(editor);
            case "Diagnostics":
              return getDiagnosticsContext(editor);
            case "Workspace":
              return getWorkspaceContext();
            default:
              return undefined;
          }
        } catch (error) {
          Logger.warn(
            `failed to fetch data for context type '${contextType}': ${
              (error as Error).message
            }`
          );
          return undefined;
        }
      })
    )
  ).filter((contextData) => !!contextData) as ContextTypeData[];
  return { enrichingContextData };
}
