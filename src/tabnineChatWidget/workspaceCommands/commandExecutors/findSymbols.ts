import { TextEditor, ExtensionContext } from "vscode";
import {
  SymbolInformationResult,
  resolveSymbols,
} from "../../handlers/resolveSymbols";
import { Logger } from "../../../utils/logger";
import getBasicContextCache from "../../handlers/context/basicContextCache";

const threeBackticks = "```";
import { toCamelCase, toSnakeCase } from "../../../utils/string.utils";

export default async function findSymbolsCommandExecutor(
  arg: string,
  editor: TextEditor,
  context: ExtensionContext | undefined
): Promise<string[] | undefined> {
  if (!context) {
    Logger.warn("No extension context provided, skipping symbol resolution");
    return undefined;
  }

  const language =
    getBasicContextCache(context).get()?.language ?? editor.document.languageId;

  const camelCaseArg = toCamelCase(arg);
  const snakeCaseArg = toSnakeCase(arg);
  const camelCaseSymbols = resolveSymbols({
    symbol: camelCaseArg,
    document: editor.document,
  });
  const snakeCaseSymbols = resolveSymbols({
    symbol: snakeCaseArg,
    document: editor.document,
  });

  const allSymbols = (
    await Promise.all([camelCaseSymbols, snakeCaseSymbols])
  ).reduce((acc, val) => (acc || []).concat(val || []), []);

  return allSymbols?.map((symbol) =>
    constructTextForSymbol(symbol, language.toLowerCase())
  );
}

function constructTextForSymbol(
  symbol: SymbolInformationResult,
  language: string
): string {
  const formatterCodeText = `${threeBackticks}${language}\n${symbol.textAccordingToFoldingRange}\n${threeBackticks}`;

  return `file: ${symbol.relativePath}\n${formatterCodeText}`;
}
