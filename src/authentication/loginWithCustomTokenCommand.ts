import { window, env, Uri } from "vscode";
import {
  signInUsingCustomToken,
  signInUsingCustomTokenUrl,
} from "./authentication.api";

async function loginFailed() {
  await window.showErrorMessage("Failed to sign in using auth token");
}

export default async function SignInUsingCustomTokenCommand() {
  const url = await signInUsingCustomTokenUrl();
  if (!url) {
    void loginFailed();
    return;
  }

  const doYouHaveAuthToken = await window.showInformationMessage(
    "If already have an auth token, click `Sign in` and apply it. Otherwise, click on `Get auth token` to get one.",
    { modal: true },
    "Sign in",
    "Get auth token"
  );

  if (doYouHaveAuthToken === "Get auth token") {
    await env.openExternal(Uri.parse(url));
  }

  const customToken = await window.showInputBox({
    prompt: "Enter your auth token",
    ignoreFocusOut: true,
  });

  if (customToken) {
    await signInUsingCustomToken(customToken);
  }
}
