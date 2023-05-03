import { Position, Range, TextDocument, WorkspaceConfiguration, workspace } from "vscode";
import {URL} from "url";
import fetch from "node-fetch";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { CHAR_LIMIT, FULL_BRAND_REPRESENTATION } from "./globals/consts";
import languages from "./globals/languages";
import { setDefaultStatus, setLoadingStatus } from "./statusBar/statusBar";
import { logInput, logOutput } from "./outputChannels";
import { getTabnineExtensionContext } from "./globals/tabnineExtensionContext";

export type CompletionType = "normal" | "snippet";

export default async function runCompletion(
  document: TextDocument,
  position: Position,
  timeout?: number,
  currentSuggestionText = ""
): Promise<AutocompleteResult | null | undefined> {
  setLoadingStatus(FULL_BRAND_REPRESENTATION);
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  const afterEnd = document.positionAt(afterEndOffset);
  const prefix =  document.getText(new Range(beforeStart, position)) + currentSuggestionText;
  const suffix = document.getText(new Range(position, afterEnd));
  // const requestData = {
    // filename: getFileNameWithExtension(document),
    // prefix,
    // suffix,
    // region_includes_beginning: beforeStartOffset === 0,
    // region_includes_end: document.offsetAt(afterEnd) !== afterEndOffset,
    // max_num_results: getMaxResults(),
    // offset,
    // line: position.line,
    // character: position.character,
    // indentation_size: getTabSize(),
  // };

  type Config = WorkspaceConfiguration & {
    modelIdOrEndpoint: string;
    isFillMode: boolean;
    startToken: string;
    middleToken: string;
    endToken: string;
    stopToken: string;
    temperature: number;
  };
  const config: Config = workspace.getConfiguration("HuggingFaceCode") as Config;
  const { modelIdOrEndpoint, isFillMode, startToken, middleToken, endToken, stopToken, temperature } = config;

  let endpoint = ""
  try{
    new URL(modelIdOrEndpoint);
    endpoint = modelIdOrEndpoint;
  }catch(e){
    endpoint = `https://api-inference.huggingface.co/models/${modelIdOrEndpoint}`
  }

  let inputs = `${startToken}${prefix}`;
  if(isFillMode){
    inputs += `${middleToken}${suffix}`;
  }
  inputs += endToken;

  const data = {
    inputs,
    parameters: {
      max_new_tokens: 256,
      temperature,
      do_sample: temperature > 0,
      top_p: 0.95,
      stop: [stopToken]
    }
  };

  logInput(inputs, data.parameters);

  const context = getTabnineExtensionContext();
  const apiToken = await context?.secrets.get("apiToken");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": "",
  };
  if(apiToken){
    headers.Authorization = `Bearer ${apiToken}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  if(!res.ok){
    console.error("Error sending a request", res.status, res.statusText);
    return null;
  }

  const generatedTextRaw = getGeneratedText(await res.json());
  let generatedText = generatedTextRaw.replace(stopToken, "");
  const indexEndToken = generatedText.indexOf(endToken)
  if(indexEndToken !== -1){
    generatedText = generatedText.slice(indexEndToken+endToken.length).trim();
  }

  const resultEntry: ResultEntry = {
    new_prefix: generatedText,
    old_suffix: "",
    new_suffix: ""
  }

  const result: AutocompleteResult = {
    results: [resultEntry],
    old_prefix: "",
    user_message: [],
    is_locked: false,
  }

  setDefaultStatus();
  logOutput(generatedTextRaw);
  return result;
}

function getGeneratedText(json: any): string{
  return json?.generated_text ?? json?.[0].generated_text ?? "";
}

export type KnownLanguageType = keyof typeof languages;

export function getLanguageFileExtension(
  languageId: string
): string | undefined {
  return languages[languageId as KnownLanguageType];
}

export function getFileNameWithExtension(document: TextDocument): string {
  const { languageId, fileName } = document;
  if (!document.isUntitled) {
    return fileName;
  }
  const extension = getLanguageFileExtension(languageId);
  if (extension) {
    return fileName.concat(extension);
  }
  return fileName;
}
