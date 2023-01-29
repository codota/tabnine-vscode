import { env, Uri } from "vscode";
import { URL } from "url";
import { StateType, TABNINE_URL_QUERY_PARAM } from "../globals/consts";
import createHubWebView from "../hub/createHubWebView";
import hubUri from "../hub/hubUri";
import {isSandboxed} from "../sandbox";

export default async function openLogin(): Promise<void> {
  if (isSandboxed()) {
    return Promise.reject("Sandboxed mode does not open login");
  }
  const uri = await hubUri(StateType.AUTH);
  if (uri) {
    const callback = new URL("https://app.tabnine.com/auth/sign-in");
    callback.searchParams.set(TABNINE_URL_QUERY_PARAM, uri.toString());
    callback.searchParams.set("sync", "false");

    const panel = await createHubWebView(uri);
    panel.reveal();
    void env.openExternal(Uri.parse(callback.toString()));
  }
}
