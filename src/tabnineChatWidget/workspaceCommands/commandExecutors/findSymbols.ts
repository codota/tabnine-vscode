import { CommandExecutor } from ".";
import { resolveSymbols } from "../../handlers/resolveSymbols";

const findSymbolsCommandExecutor: CommandExecutor = {
  execute: async (arg: string) => {
    const workspaceSymbols = await resolveSymbols({ symbol: arg });
    return workspaceSymbols?.map(
      (symbol) => `${symbol.name} - ${symbol.relativePath}`
    );
  },
};

export default findSymbolsCommandExecutor;
