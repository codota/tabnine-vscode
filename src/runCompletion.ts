import { Position, Range, TextDocument, WorkspaceConfiguration, workspace, window, env, Uri } from "vscode";
import {URL} from "url";
import fetch from "node-fetch";
import { AutocompleteResult, ResultEntry } from "./binary/requests/requests";
import { CHAR_LIMIT, FULL_BRAND_REPRESENTATION } from "./globals/consts";
import languages from "./globals/languages";
import { setDefaultStatus, setLoadingStatus } from "./statusBar/statusBar";
import { logInput, logOutput } from "./outputChannels";
import { getTabnineExtensionContext } from "./globals/tabnineExtensionContext";

export type CompletionType = "normal" | "snippet";

let didShowTokenWarning = false;

export default async function runCompletion(
  document: TextDocument,
  position: Position,
  timeout?: number,
  currentSuggestionText = ""
): Promise<AutocompleteResult | null | undefined> {
  setLoadingStatus(FULL_BRAND_REPRESENTATION);
  const offset = document.offsetAt(position);
  const beforeStartOffset = Math.max(0, offset - CHAR_LIMIT);
  // const afterEndOffset = offset + CHAR_LIMIT;
  const beforeStart = document.positionAt(beforeStartOffset);
  // const afterEnd = document.positionAt(afterEndOffset);
  const prefix =  document.getText(new Range(beforeStart, position)) + currentSuggestionText;
  // const suffix = document.getText(new Range(position, afterEnd));

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
  const { modelIdOrEndpoint, stopToken, temperature } = config;

  const context = getTabnineExtensionContext();
  const apiToken = await context?.secrets.get("apiToken");

  let endpoint = ""
  try{
    new URL(modelIdOrEndpoint);
    endpoint = modelIdOrEndpoint;
  }catch(e){
    endpoint = `https://api-inference.huggingface.co/models/${modelIdOrEndpoint}`

    // if user hasn't supplied API Token yet, ask user to supply one
    if(!apiToken && !didShowTokenWarning){
      didShowTokenWarning = true;
      void window.showInformationMessage(`In order to use "${modelIdOrEndpoint}" through Hugging Face API Inference, you'd need Hugging Face API Token`,
        "Get your token"
      ).then(clicked => {
        if (clicked) {
          void env.openExternal(Uri.parse("https://github.com/huggingface/huggingface-vscode#hf-api-token"));
        }
      });
    }
  }

  const inputs = prefix;

  const data = {
    inputs,
    parameters: {
      max_new_tokens: 60,
      temperature,
      do_sample: temperature > 0,
      top_p: 0.95,
      stop: [stopToken]
    }
  };

  logInput(inputs, data.parameters);

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
    setDefaultStatus();
    return null;
  }

  const generatedTextRaw = getGeneratedText(await res.json());
  
  let generatedText = generatedTextRaw.replace(stopToken, "");
  if(generatedText.slice(0, inputs.length) === inputs){
    generatedText = generatedText.slice(inputs.length);
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
