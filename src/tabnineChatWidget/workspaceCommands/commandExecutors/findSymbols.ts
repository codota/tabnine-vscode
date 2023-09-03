import { toCamelCase, toSnakeCase } from "../../../utils/string.utils";
import { resolveSymbols } from "../../handlers/resolveSymbols";

export type WorkspaceSymbol = {
  name: string;
  file: string;
};

export default async function findSymbolsCommandExecutor(
  arg: string
): Promise<WorkspaceSymbol[] | undefined> {
  const camelCaseArg = toCamelCase(arg);
  const snakeCaseArg = toSnakeCase(arg);
  const camelCaseSymbols = resolveSymbols({ symbol: camelCaseArg });
  const snakeCaseSymbols = resolveSymbols({ symbol: snakeCaseArg });

  const allSymbols = (
    await Promise.all([camelCaseSymbols, snakeCaseSymbols])
  ).reduce((acc, val) => (acc || []).concat(val || []), []);

  return allSymbols?.map((symbol) => ({
    name: symbol.name,
    file: symbol.relativePath,
  }));
}
