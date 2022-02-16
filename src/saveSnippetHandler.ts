import { window } from "vscode";
import { saveSnippet } from "./binary/requests/requests";
import { ErrorSaveSnippetResponse } from "./binary/requests/saveSnippet";

export const SUCCESS_MESSAGE = "Snippet saved successfully!";
export const ERROR_MESSAGE_PREFIX = "Failed to save snippet";
export const NO_RESPONSE_ERROR_MESSAGE = "No response from Tabnine Engine";
export const OK_BUTTON = "Ok";

export default async function handleSaveSnippet(): Promise<void> {
  const editor = window.activeTextEditor;
  if (!editor) return;

  const { document, selection } = editor;
  const text = document.getText(selection);
  const request = {
    code: text,
    filename: document.fileName,
    start_offset: document.offsetAt(selection.start),
    end_offset: document.offsetAt(selection.end),
  };

  const result = await saveSnippet(request);

  const error = result
    ? (result as ErrorSaveSnippetResponse).Error
    : NO_RESPONSE_ERROR_MESSAGE;
  const message = error ? errorMessage(error) : SUCCESS_MESSAGE;

  await window.showInformationMessage(message, OK_BUTTON);
}

function errorMessage(error: string): string {
  return `${ERROR_MESSAGE_PREFIX}: ${error}`;
}
