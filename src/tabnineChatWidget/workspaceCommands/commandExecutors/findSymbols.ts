import { resolveSymbols } from "../../handlers/resolveSymbols";

export default async function findSymbolsCommandExecutor(
  arg: string
): Promise<string[] | undefined> {
  const workspaceSymbols = await resolveSymbols({ symbol: arg });
  return workspaceSymbols?.map(
    (symbol) => `${symbol.name} - ${symbol.relativePath}`
  );
}
