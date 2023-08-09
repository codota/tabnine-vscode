import { TextEditor, ExtensionContext } from "vscode";
import {
  SymbolInformationResult,
  resolveSymbols,
} from "../../handlers/resolveSymbols";
import { Logger } from "../../../utils/logger";
import getBasicContextCache from "../../handlers/context/basicContextCache";

const threeBackticks = "```";

export default async function findSymbolsCommandExecutor(
  arg: string,
  editor: TextEditor,
  context: ExtensionContext | undefined
): Promise<string[] | undefined> {
  if (!context) {
    Logger.warn("No extension context provided, skipping symbol resolution");
    return undefined;
  }

  const workspaceSymbols = await resolveSymbols({
    symbol: arg,
    document: editor.document,
  });
  const language =
    getBasicContextCache(context).get()?.language ?? editor.document.languageId;

  return workspaceSymbols?.map((symbol) =>
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
