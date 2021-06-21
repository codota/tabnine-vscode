import { window } from "vscode";

export type MessageOptions = {
  messageText: string;
  buttonText: string;
  action: () => void;
};

export default async function showMessage(
  options: MessageOptions
): Promise<void> {
  const value = await window.showInformationMessage(
    options.messageText,
    options.buttonText
  );

  if (value === options.buttonText) {
    options.action();
  }
}
