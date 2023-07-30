import executeWorkspaceCommand, {
  WorkspaceCommandInstruction,
} from "../../workspaceCommands";
import { WorkspaceContext } from "./enrichingContextTypes";

export default async function getWorkspaceContext(
  workspaceCommands?: WorkspaceCommandInstruction[]
): Promise<WorkspaceContext | undefined> {
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

  return workspaceData;
}
