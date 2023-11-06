import { window, env, Uri } from "vscode";
import {
  signInUsingCustomToken,
  signInUsingCustomTokenUrl,
} from "./authentication.api";

const SIGN_IN = "Sign in";
const GET_AUTH_TOKEN = "Get auth token";
export default async function SignInUsingCustomTokenCommand() {
  const url = await signInUsingCustomTokenUrl();
  if (!url) {
    await window.showErrorMessage("Failed to sign in using auth token");
    return;
  }

  const doYouHaveAuthToken = await window.showInformationMessage(
    `If already have an auth token, click "${SIGN_IN}" to apply it. Otherwise, click on "${GET_AUTH_TOKEN}" to get one`,
    { modal: true },
    SIGN_IN,
    GET_AUTH_TOKEN
  );

  if (doYouHaveAuthToken === GET_AUTH_TOKEN) {
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
