import { env, Uri } from "vscode";
import { URL } from "url";
import { StateType, TABNINE_URL_QUERY_PARAM } from "../globals/consts";
import createHubWebView from "../hub/createHubWebView";
import hubUri from "../hub/hubUri";

export async function openLogin(): Promise<void> {
  return open("https://app.tabnine.com/auth/sign-in");
}

export async function openSignup(): Promise<void> {
  return open("https://app.tabnine.com/auth/signup");
}

async function open(url: string): Promise<void> {
  const uri = await hubUri(StateType.AUTH);
  if (uri) {
    const callback = new URL(url);
    callback.searchParams.set(TABNINE_URL_QUERY_PARAM, uri.toString());
    callback.searchParams.set("sync", "false");

    const panel = await createHubWebView(uri);
    panel.reveal();
    void env.openExternal(Uri.parse(callback.toString()));
  }
}
