import { Logger } from "../../../utils/logger";
import { rejectOnTimeout } from "../../../utils/utils";
import executeWorkspaceCommand, {
  WorkspaceCommandInstruction,
} from "../../workspaceCommands";
import { ContextTypeData } from "./enrichingContextTypes";

export default async function getWorkspaceContext(
  workspaceCommands: WorkspaceCommandInstruction[] | undefined
): Promise<ContextTypeData | undefined> {
  if (!workspaceCommands || !workspaceCommands.length) return undefined;

  let symbols: unknown[] = [];

  try {
    const results = await rejectOnTimeout(
      Promise.all(workspaceCommands.map(executeWorkspaceCommand)),
      2500
    );

    results.forEach((result) => {
      if (!result) return;
      if (result.command === "findSymbols") {
        symbols = symbols.concat(result.data);
      }
    });

    return {
      type: "Workspace",
      ...{
        symbols: [...new Set(symbols)] as string[],
      },
    };
  } catch (error) {
    Logger.warn(
      `failed to obtain workspace context, continuing without it: ${
        (error as Error).message
      }`
    );
    return undefined;
  }
}
