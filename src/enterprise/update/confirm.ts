import { window } from "vscode";

export default async function confirm(
  message: string,
  text: string
): Promise<boolean> {
  const selected = await window.showInformationMessage(
    message,
    { modal: true },
    text
  );
  return selected === text;
}
