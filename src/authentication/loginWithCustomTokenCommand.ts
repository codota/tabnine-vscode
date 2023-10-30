import { window } from "vscode";
import { loginWithCustomToken } from "./authentication.api";

export default async function loginWithCustomTokenCommand() {
  const customToken = await window.showInputBox({
    prompt: "Enter your auth token",
    ignoreFocusOut: true,
  });
  if (customToken) {
    await loginWithCustomToken(customToken);
  }
}
