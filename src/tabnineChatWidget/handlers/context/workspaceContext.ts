import executeWorkspaceCommand, {
  WorkspaceCommandInstruction,
} from "../../workspaceCommands";
import { ContextTypeData, WorkspaceContext } from "./enrichingContextTypes";

export default async function getWorkspaceContext(
  workspaceCommands: WorkspaceCommandInstruction[] | undefined
): Promise<ContextTypeData | undefined> {
  if (!workspaceCommands || !workspaceCommands.length) return undefined;

  const workspaceData: WorkspaceContext = {
    symbols: undefined,
  };
  const results = await Promise.all(
    workspaceCommands.map(executeWorkspaceCommand)
  );

  results.forEach((result) => {
    if (!result) return;
    if (result.command === "findSymbols") {
      workspaceData.symbols = (workspaceData?.symbols ?? []).concat(
        result.data
      );
    }
  });

  return { type: "Workspace", ...workspaceData };
}
