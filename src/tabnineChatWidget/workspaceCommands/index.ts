import { CommandExecutor } from "./commandExecutors";
import symbolSearchCommandExecutor from "./commandExecutors/symbolSearch";

type WorkspaceCommand = "symbolSearch";

export type WorkspaceCommandInstruction = {
  command: WorkspaceCommand;
  arg: string;
};

export type ExecutionResult = {
  command: WorkspaceCommand;
  data: string[];
};

const commandsExecutors: Record<WorkspaceCommand, CommandExecutor> = {
  symbolSearch: symbolSearchCommandExecutor,
};

export default async function executeWorkspaceCommand(
  workspaceCommand: WorkspaceCommandInstruction
): Promise<ExecutionResult | undefined> {
  const { command, arg } = workspaceCommand;
  const executor = commandsExecutors[command];

  if (!executor) {
    console.debug(`Unknown workspace command: ${command}`);
    return undefined;
  }

  const result = await executor.execute(arg);
  if (!result) return undefined;

  return {
    command: workspaceCommand.command,
    data: result,
  };
}
