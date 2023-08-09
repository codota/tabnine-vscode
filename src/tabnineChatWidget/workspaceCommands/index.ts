import { ExtensionContext, TextEditor } from "vscode";
import { Logger } from "../../utils/logger";
import findSymbolsCommandExecutor from "./commandExecutors/findSymbols";

type WorkspaceCommand = "findSymbols";

export type WorkspaceCommandInstruction = {
  command: WorkspaceCommand;
  arg: string;
};

export type ExecutionResult = {
  command: WorkspaceCommand;
  data: string[];
};

type CommandExecutor = (
  arg: string,
  editor: TextEditor,
  context: ExtensionContext | undefined
) => Promise<string[] | undefined>;

const commandsExecutors: Record<WorkspaceCommand, CommandExecutor> = {
  findSymbols: findSymbolsCommandExecutor,
};

export default async function executeWorkspaceCommand(
  workspaceCommand: WorkspaceCommandInstruction,
  editor: TextEditor,
  context: ExtensionContext | undefined
): Promise<ExecutionResult | undefined> {
  try {
    const { command, arg } = workspaceCommand;
    const executor = commandsExecutors[command];

    if (!executor) {
      Logger.debug(`Unknown workspace command: ${command}`);
      return undefined;
    }

    const result = await executor(arg, editor, context);
    if (!result || !result.length) return undefined;

    return {
      command: workspaceCommand.command,
      data: result,
    };
  } catch (error) {
    console.error(error);
    Logger.error(error);
    return undefined;
  }
}
