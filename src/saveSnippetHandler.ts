import { window } from "vscode";
import { saveSnippet } from "./binary/requests/requests";
import {
  ErrorSaveSnippetResponse,
  SaveSnippetResponse,
} from "./binary/requests/saveSnippet";

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

  const error = getErrorMessage(result);

  await window.showInformationMessage(
    buildNotificationMessage(error),
    OK_BUTTON
  );
}

function getErrorMessage(
  result: SaveSnippetResponse | null | undefined
): string | undefined {
  if (!result) return NO_RESPONSE_ERROR_MESSAGE;

  return (result as ErrorSaveSnippetResponse).Error;
}

function buildNotificationMessage(error: string | undefined): string {
  return error ? `${ERROR_MESSAGE_PREFIX}: ${error}` : SUCCESS_MESSAGE;
}
