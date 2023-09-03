import { Logger } from "../../utils/logger";
import findSymbolsCommandExecutor from "./commandExecutors/findSymbols";

type WorkspaceCommand = "findSymbols";

export type WorkspaceCommandInstruction = {
  command: WorkspaceCommand;
  arg: string;
};

export type ExecutionResult = {
  command: WorkspaceCommand;
  data: unknown[];
};

type CommandExecutor = (arg: string) => Promise<unknown[] | undefined>;

const commandsExecutors: Record<WorkspaceCommand, CommandExecutor> = {
  findSymbols: findSymbolsCommandExecutor,
};

export default async function executeWorkspaceCommand(
  workspaceCommand: WorkspaceCommandInstruction
): Promise<ExecutionResult | undefined> {
  try {
    const { command, arg } = workspaceCommand;
    const executor = commandsExecutors[command];

    if (!executor) {
      Logger.debug(`Unknown workspace command: ${command}`);
      return undefined;
    }

    const result = await executor(arg);
    if (!result || !result.length) return undefined;

    return {
      command: workspaceCommand.command,
      data: result,
    };
  } catch (error) {
    Logger.error(error);
    return undefined;
  }
}
